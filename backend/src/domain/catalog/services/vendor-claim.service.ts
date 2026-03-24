// ============================================================================
// VENDOR CLAIM SERVICE - Business Logic for Vendor Profile Claims
// ============================================================================
// Handles the claim flow when users want to claim UNCLAIMED vendor profiles
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VendorClaimRepository } from '../repositories/vendor-claim.repository';
import { VendorProfileRepository } from '../repositories/vendor-profile.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import { SubscriptionPlanService } from '../../subscription/services/subscription-plan.service';
import { RateLimitingService } from '../../../infrastructure/rate-limiting/rate-limiting.service';
import {
  VendorClaim,
  ClaimStatus,
  ClaimVerificationMethod,
  VendorStatus,
  PlanTier as PrismaPlanTier,
} from '@prisma/client';
import {
  InitiateClaimDto,
  VerifyClaimDto,
  VendorClaimResponseDto,
  ClaimStatusResponseDto,
  PendingClaimsResponseDto,
  InitiateGuestClaimDto,
  VerifyGuestClaimDto,
  GuestClaimInitiatedResponseDto,
  GuestClaimVerifiedResponseDto,
} from '../dto/vendor-claim.dto';
import { PlanTier } from '../../subscription/dto/subscription-plan.dto';
import { TokenService, SessionContext } from '../../../core/auth/token.service';
import { RoleLookupService, ROLE_NAMES } from '../../../core/lookup/role-lookup.service';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

// Event constants for vendor claims
export const VENDOR_CLAIM_EVENTS = {
  INITIATED: 'vendor.claim.initiated',
  VERIFICATION_SENT: 'vendor.claim.verification_sent',
  VERIFIED: 'vendor.claim.verified',
  APPROVED: 'vendor.claim.approved',
  REJECTED: 'vendor.claim.rejected',
  EXPIRED: 'vendor.claim.expired',
} as const;

@Injectable()
export class VendorClaimService {
  private readonly logger = new Logger(VendorClaimService.name);
  private readonly VERIFICATION_CODE_LENGTH = 6;

  // Security constants for rate limiting and expiry
  private readonly VERIFICATION_CODE_EXPIRY_MINUTES_SHORT = 15; // For EMAIL/PHONE methods
  private readonly VERIFICATION_CODE_EXPIRY_HOURS_LONG = 24; // For DOCUMENT/ADMIN methods
  private readonly MAX_VERIFICATION_ATTEMPTS = 5;
  private readonly VERIFICATION_LOCKOUT_MINUTES = 15;
  private readonly MAX_RESEND_PER_HOUR = 3;
  private readonly RESEND_WINDOW_SECONDS = 3600; // 1 hour
  private readonly BCRYPT_SALT_ROUNDS = 10;

  constructor(
    private readonly vendorClaimRepository: VendorClaimRepository,
    private readonly vendorProfileRepository: VendorProfileRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenService: TokenService,
    private readonly roleLookupService: RoleLookupService,
    private readonly rateLimitingService: RateLimitingService,
  ) {}

  /**
   * Generate a random verification code
   */
  private generateVerificationCode(): string {
    // Generate a 6-digit numeric code
    const bytes = randomBytes(4);
    const code = (bytes.readUInt32BE(0) % 1000000).toString().padStart(6, '0');
    return code;
  }

  /**
   * Hash verification code with bcrypt for secure storage
   */
  private async hashVerificationCode(code: string): Promise<string> {
    return bcrypt.hash(code, this.BCRYPT_SALT_ROUNDS);
  }

  /**
   * Verify a code against its hashed version
   */
  private async verifyHashedCode(
    plainCode: string,
    hashedCode: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainCode, hashedCode);
  }

  /**
   * Calculate verification expiry date based on verification method
   * EMAIL/PHONE methods get shorter expiry (15 minutes) for security
   * DOCUMENT/ADMIN methods get longer expiry (24 hours) as they require manual review
   */
  private getVerificationExpiry(method: ClaimVerificationMethod): Date {
    const expiry = new Date();
    if (
      method === ClaimVerificationMethod.EMAIL ||
      method === ClaimVerificationMethod.PHONE
    ) {
      expiry.setMinutes(
        expiry.getMinutes() + this.VERIFICATION_CODE_EXPIRY_MINUTES_SHORT,
      );
    } else {
      expiry.setHours(
        expiry.getHours() + this.VERIFICATION_CODE_EXPIRY_HOURS_LONG,
      );
    }
    return expiry;
  }

  /**
   * Check if verification attempts are rate limited (locked out)
   * Returns the lockout expiry time if locked, null otherwise
   */
  private async checkVerificationAttemptLockout(
    claimId: string,
  ): Promise<{ locked: boolean; lockoutExpiresAt?: Date; attemptsRemaining?: number }> {
    const rateLimitResult = await this.rateLimitingService.getStatus(
      `claim_verify:${claimId}`,
      {
        limit: this.MAX_VERIFICATION_ATTEMPTS,
        window: this.VERIFICATION_LOCKOUT_MINUTES * 60,
        prefix: 'vendor_claim',
      },
    );

    if (!rateLimitResult.allowed) {
      const lockoutExpiresAt = new Date(
        Date.now() + rateLimitResult.resetIn * 1000,
      );
      return { locked: true, lockoutExpiresAt };
    }

    return { locked: false, attemptsRemaining: rateLimitResult.remaining };
  }

  /**
   * Record a verification attempt and check rate limit
   */
  private async recordVerificationAttempt(
    claimId: string,
  ): Promise<{ allowed: boolean; attemptsRemaining: number; lockoutExpiresAt?: Date }> {
    const rateLimitResult = await this.rateLimitingService.checkLimit(
      `claim_verify:${claimId}`,
      {
        limit: this.MAX_VERIFICATION_ATTEMPTS,
        window: this.VERIFICATION_LOCKOUT_MINUTES * 60,
        prefix: 'vendor_claim',
      },
    );

    if (!rateLimitResult.allowed) {
      const lockoutExpiresAt = new Date(
        Date.now() + rateLimitResult.resetIn * 1000,
      );
      return { allowed: false, attemptsRemaining: 0, lockoutExpiresAt };
    }

    return { allowed: true, attemptsRemaining: rateLimitResult.remaining };
  }

  /**
   * Check IP-based rate limit for code resend
   */
  private async checkResendRateLimit(
    ipAddress: string,
  ): Promise<{ allowed: boolean; resetIn: number; remaining: number }> {
    const rateLimitResult = await this.rateLimitingService.checkLimit(
      `resend:${ipAddress}`,
      {
        limit: this.MAX_RESEND_PER_HOUR,
        window: this.RESEND_WINDOW_SECONDS,
        prefix: 'vendor_claim',
      },
    );

    return {
      allowed: rateLimitResult.allowed,
      resetIn: rateLimitResult.resetIn,
      remaining: rateLimitResult.remaining,
    };
  }

  /**
   * Reset verification attempt counter after successful verification
   */
  private async resetVerificationAttempts(claimId: string): Promise<void> {
    await this.rateLimitingService.resetLimit(
      `claim_verify:${claimId}`,
      'vendor_claim',
    );
  }

  /**
   * Initiate a claim request for an UNCLAIMED vendor profile
   */
  async initiateClaim(
    userId: string,
    dto: InitiateClaimDto,
  ): Promise<VendorClaimResponseDto> {
    this.logger.log(
      `Initiating claim for vendor profile: ${dto.vendorProfileId} by user: ${userId}`,
    );

    // 1. Check if vendor profile exists and is UNCLAIMED
    const vendorProfile = await this.vendorProfileRepository.findById(
      dto.vendorProfileId,
    );

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (vendorProfile.status !== VendorStatus.UNCLAIMED) {
      throw new BadRequestException(
        'This vendor profile is not available for claiming. It may already be claimed or is in a different status.',
      );
    }

    if (vendorProfile.userId) {
      throw new BadRequestException(
        'This vendor profile is already associated with a user',
      );
    }

    // 2. Check if there's already an active claim for this vendor profile
    const existingClaim = await this.vendorClaimRepository.findByVendorProfile(
      dto.vendorProfileId,
    );

    if (existingClaim) {
      if (
        existingClaim.status === ClaimStatus.APPROVED ||
        existingClaim.status === ClaimStatus.VERIFIED ||
        existingClaim.status === ClaimStatus.PENDING ||
        existingClaim.status === ClaimStatus.VERIFICATION_SENT
      ) {
        throw new ConflictException(
          'A claim for this vendor profile is already in progress or has been approved',
        );
      }

      // If the existing claim is REJECTED or EXPIRED, we can allow a new claim
      // by deleting the old one first
      if (
        existingClaim.status === ClaimStatus.REJECTED ||
        existingClaim.status === ClaimStatus.EXPIRED
      ) {
        await this.vendorClaimRepository.delete(existingClaim.id);
      }
    }

    // 3. Check if user already has an active claim for any vendor profile
    const userClaims = await this.vendorClaimRepository.findByUser(userId);
    const activeUserClaim = userClaims.find(
      (c) =>
        c.status !== ClaimStatus.REJECTED &&
        c.status !== ClaimStatus.EXPIRED &&
        c.status !== ClaimStatus.APPROVED,
    );

    if (activeUserClaim) {
      throw new ConflictException(
        'You already have an active claim in progress. Please wait for it to be resolved before claiming another vendor profile.',
      );
    }

    // 4. Validate verification method based on available contact info
    this.validateVerificationMethod(dto.verificationMethod, vendorProfile);

    // 5. Create the claim (expires in 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const claim = await this.vendorClaimRepository.create({
      vendorProfile: { connect: { id: dto.vendorProfileId } },
      user: { connect: { id: userId } },
      status: ClaimStatus.PENDING,
      verificationMethod: dto.verificationMethod,
      expiresAt,
    });

    // 6. Emit event
    this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.INITIATED, {
      claimId: claim.id,
      vendorProfileId: dto.vendorProfileId,
      userId,
      verificationMethod: dto.verificationMethod,
    });

    this.logger.log(`Claim initiated: ${claim.id}`);
    return this.mapToResponseDto(claim);
  }

  /**
   * Validate that the verification method can be used with the vendor profile
   * Note: PHONE verification is not supported - email only
   */
  private validateVerificationMethod(
    method: ClaimVerificationMethod,
    vendorProfile: any,
  ): void {
    switch (method) {
      case ClaimVerificationMethod.EMAIL:
        if (!vendorProfile.contactEmail) {
          throw new BadRequestException(
            'This vendor profile does not have an email address. Please choose a different verification method.',
          );
        }
        break;
      case ClaimVerificationMethod.PHONE:
        // Phone verification is not supported
        throw new BadRequestException(
          'Phone verification is not currently available. Please use email or document verification.',
        );
      case ClaimVerificationMethod.DOCUMENT:
      case ClaimVerificationMethod.ADMIN_VERIFIED:
        // These methods are always available
        break;
    }
  }

  /**
   * Send verification code/link to the vendor
   * Includes IP-based rate limiting for resend protection
   */
  async sendVerification(claimId: string, ipAddress?: string): Promise<void> {
    this.logger.log(`Sending verification for claim: ${claimId}`);

    // Check IP-based rate limit for resend if IP address provided
    if (ipAddress) {
      const resendRateLimit = await this.checkResendRateLimit(ipAddress);
      if (!resendRateLimit.allowed) {
        const minutesUntilReset = Math.ceil(resendRateLimit.resetIn / 60);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many verification code requests. Please wait ${minutesUntilReset} minutes before requesting another code.`,
            retryAfter: resendRateLimit.resetIn,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      this.logger.debug(
        `Resend rate limit: ${resendRateLimit.remaining} remaining for IP ${ipAddress}`,
      );
    }

    const claim = await this.vendorClaimRepository.findById(claimId, {
      vendorProfile: true,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (
      claim.status !== ClaimStatus.PENDING &&
      claim.status !== ClaimStatus.VERIFICATION_SENT
    ) {
      throw new BadRequestException(
        `Cannot send verification for claim in status: ${claim.status}`,
      );
    }

    // Generate plain code for sending, then hash for storage
    const verificationCode = this.generateVerificationCode();
    const hashedVerificationCode = await this.hashVerificationCode(verificationCode);
    const verificationExpiry = this.getVerificationExpiry(claim.verificationMethod);

    // Calculate expiry time for notification message
    const expiryMinutes =
      claim.verificationMethod === ClaimVerificationMethod.EMAIL ||
      claim.verificationMethod === ClaimVerificationMethod.PHONE
        ? this.VERIFICATION_CODE_EXPIRY_MINUTES_SHORT
        : this.VERIFICATION_CODE_EXPIRY_HOURS_LONG * 60;

    // Update claim with HASHED verification code (never store plain text)
    await this.vendorClaimRepository.update(claimId, {
      status: ClaimStatus.VERIFICATION_SENT,
      verificationCode: hashedVerificationCode,
      verificationExpiry,
    });

    // Send the verification based on method (send PLAIN code to user)
    const vendorProfile = (claim as any).vendorProfile;

    switch (claim.verificationMethod) {
      case ClaimVerificationMethod.EMAIL:
        await this.sendEmailVerification(
          vendorProfile.contactEmail,
          verificationCode, // Send plain code
          vendorProfile.businessName,
          expiryMinutes,
        );
        break;
      case ClaimVerificationMethod.PHONE:
        // Phone verification is not supported - reject
        throw new BadRequestException(
          'Phone verification is not currently available. Please use email or document verification.',
        );
      case ClaimVerificationMethod.DOCUMENT:
        // For document verification, no code is sent - user uploads docs
        this.logger.log(
          `Document verification requested for claim: ${claimId}`,
        );
        break;
      case ClaimVerificationMethod.ADMIN_VERIFIED:
        // Admin will verify directly, no automated verification
        this.logger.log(`Admin verification requested for claim: ${claimId}`);
        break;
    }

    // Emit event
    this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.VERIFICATION_SENT, {
      claimId,
      method: claim.verificationMethod,
    });

    this.logger.log(`Verification sent for claim: ${claimId}`);
  }

  /**
   * Send email verification via notification event
   * The EmailNotificationListener picks up this event and sends via EmailService
   */
  private async sendEmailVerification(
    email: string,
    code: string,
    businessName: string,
    expiryMinutes: number,
  ): Promise<void> {
    this.logger.log(
      `Sending email verification to: ${email} for business: ${businessName} (expires in ${expiryMinutes} minutes)`,
    );

    // Emit event for EmailNotificationListener to handle
    this.eventEmitter.emit('notification.send', {
      type: 'CLAIM_VERIFICATION_EMAIL',
      recipient: email,
      data: {
        verificationCode: code,
        businessName,
        expiresIn: `${expiryMinutes} minutes`,
      },
    });
  }


  /**
   * Verify the code submitted by the user
   * Includes rate limiting: max 5 attempts, then 15 minute lockout
   * Uses bcrypt comparison for secure verification against hashed codes
   */
  async verifyCode(
    dto: VerifyClaimDto,
    userId: string,
  ): Promise<VendorClaimResponseDto> {
    this.logger.log(`Verifying code for claim: ${dto.claimId}`);

    // Check if the claim is locked out due to too many failed attempts
    const lockoutStatus = await this.checkVerificationAttemptLockout(dto.claimId);
    if (lockoutStatus.locked) {
      const minutesRemaining = lockoutStatus.lockoutExpiresAt
        ? Math.ceil((lockoutStatus.lockoutExpiresAt.getTime() - Date.now()) / 60000)
        : this.VERIFICATION_LOCKOUT_MINUTES;
      const retryAfterSeconds = minutesRemaining * 60;
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed verification attempts. Please wait ${minutesRemaining} minutes before trying again.`,
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const claim = await this.vendorClaimRepository.findById(dto.claimId, {
      vendorProfile: true,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    // Verify the user owns this claim
    if (claim.userId !== userId) {
      throw new ForbiddenException('You are not authorized to verify this claim');
    }

    if (claim.status !== ClaimStatus.VERIFICATION_SENT) {
      throw new BadRequestException(
        `Cannot verify claim in status: ${claim.status}`,
      );
    }

    // Check expiry
    if (claim.verificationExpiry && claim.verificationExpiry < new Date()) {
      await this.vendorClaimRepository.updateStatus(
        dto.claimId,
        ClaimStatus.EXPIRED,
      );
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    // Verify code using bcrypt comparison (code is stored hashed)
    if (!claim.verificationCode) {
      throw new BadRequestException(
        'No verification code found. Please request a new one.',
      );
    }

    const isCodeValid = await this.verifyHashedCode(
      dto.verificationCode,
      claim.verificationCode,
    );

    if (!isCodeValid) {
      // Record failed attempt and check rate limit
      const attemptResult = await this.recordVerificationAttempt(dto.claimId);

      if (!attemptResult.allowed) {
        const minutesRemaining = attemptResult.lockoutExpiresAt
          ? Math.ceil((attemptResult.lockoutExpiresAt.getTime() - Date.now()) / 60000)
          : this.VERIFICATION_LOCKOUT_MINUTES;
        const retryAfterSeconds = minutesRemaining * 60;
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many failed verification attempts. Please wait ${minutesRemaining} minutes before trying again.`,
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const attemptsRemaining = attemptResult.attemptsRemaining;
      this.logger.warn(
        `Invalid verification code for claim ${dto.claimId}. Attempts remaining: ${attemptsRemaining}`,
      );
      throw new BadRequestException(
        `Invalid verification code. ${attemptsRemaining} attempts remaining.`,
      );
    }

    // Reset rate limit counter on successful verification
    await this.resetVerificationAttempts(dto.claimId);

    // Update claim status to VERIFIED
    const updatedClaim = await this.vendorClaimRepository.update(dto.claimId, {
      status: ClaimStatus.VERIFIED,
      verificationCode: null, // Clear the code after successful verification
    });

    // Emit event
    this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.VERIFIED, {
      claimId: dto.claimId,
      userId,
    });

    this.logger.log(`Claim verified: ${dto.claimId}`);

    // All claims must now go through admin review - no auto-approval
    // Admin will review submitted documents and decide to approve or reject
    this.logger.log(`Claim ${dto.claimId} awaiting admin review`);

    return this.mapToResponseDto(updatedClaim);
  }

  /**
   * Admin approves a claim (or auto-approve after verification)
   */
  async approveClaim(
    claimId: string,
    adminUserId?: string,
    notes?: string,
  ): Promise<VendorClaimResponseDto> {
    this.logger.log(`Approving claim: ${claimId}`);

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.vendorClaim.findUnique({
        where: { id: claimId },
        include: { vendorProfile: true },
      });

      if (!claim) {
        throw new NotFoundException('Claim not found');
      }

      if (claim.status === ClaimStatus.APPROVED) {
        throw new BadRequestException('Claim is already approved');
      }

      if (
        claim.status !== ClaimStatus.VERIFIED &&
        claim.status !== ClaimStatus.PENDING &&
        claim.status !== ClaimStatus.VERIFICATION_SENT
      ) {
        throw new BadRequestException(
          `Cannot approve claim in status: ${claim.status}`,
        );
      }

      // 1. Update claim status to APPROVED
      const updatedClaim = await tx.vendorClaim.update({
        where: { id: claimId },
        data: {
          status: ClaimStatus.APPROVED,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
        include: { vendorProfile: true },
      });

      // 2. Link userId to VendorProfile, update status to ACTIVE, and set plan to FREE
      await tx.vendorProfile.update({
        where: { id: claim.vendorProfileId },
        data: {
          userId: claim.userId,
          status: VendorStatus.ACTIVE,
          planTier: PrismaPlanTier.FREE,
          verifiedAt: new Date(),
        },
      });

      // 3. Create FREE subscription for the vendor
      await this.createFreeSubscription(claim.vendorProfileId, claim.userId);

      // 4. Emit event
      this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.APPROVED, {
        claimId,
        vendorProfileId: claim.vendorProfileId,
        userId: claim.userId,
        adminUserId,
      });

      // 5. Emit vendor.claimed event for other listeners
      this.eventEmitter.emit('vendor.claimed', {
        vendorProfileId: claim.vendorProfileId,
        userId: claim.userId,
        claimId,
        businessName: claim.vendorProfile.businessName,
      });

      this.logger.log(
        `Claim approved: ${claimId}, vendor profile linked to user: ${claim.userId}`,
      );

      return this.mapToResponseDto(updatedClaim);
    });
  }

  /**
   * Create a FREE subscription for a newly claimed vendor
   */
  private async createFreeSubscription(
    vendorProfileId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Find the FREE plan
      const freePlan = await this.subscriptionPlanService.findByTier(
        PlanTier.FREE,
      );

      if (!freePlan) {
        this.logger.error(
          'No FREE subscription plan found - cannot create subscription for claimed vendor',
        );
        throw new Error('FREE subscription plan not found');
      }

      // Get the price for the FREE plan (must be amount = 0)
      const prices = await this.subscriptionPlanService.getPrices(freePlan.id);
      // Prioritize finding a free price (amount = 0), fallback to monthly
      const freePrice = prices.find((p: any) => p.amount === 0) ||
        prices.find((p: any) => p.billingCycle === 'MONTHLY');

      if (!freePrice) {
        this.logger.error(
          'No price found for FREE plan - cannot create subscription for claimed vendor',
        );
        throw new Error('FREE plan price not found');
      }

      // Check if vendor already has a subscription
      const existingSubscription =
        await this.subscriptionService.findActiveByVendorProfile(
          vendorProfileId,
        );

      if (existingSubscription) {
        this.logger.log(
          `Vendor profile ${vendorProfileId} already has an active subscription, skipping`,
        );
        return;
      }

      // Create the subscription linking vendor to FREE plan
      const subscription = await this.subscriptionService.create({
        vendorProfileId,
        planId: freePlan.id,
        priceId: freePrice.id,
      });

      this.logger.log(
        `Created FREE subscription (${subscription.id}) for vendor profile: ${vendorProfileId}`,
      );
    } catch (error) {
      // Log but don't fail the claim approval - planTier is already set on VendorProfile
      // The subscription record is for billing tracking, planTier is the authoritative source
      this.logger.error(
        `Failed to create FREE subscription for vendor ${vendorProfileId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Admin rejects a claim
   */
  async rejectClaim(
    claimId: string,
    adminUserId: string,
    reason: string,
  ): Promise<VendorClaimResponseDto> {
    this.logger.log(`Rejecting claim: ${claimId}`);

    const claim = await this.vendorClaimRepository.findById(claimId, {
      vendorProfile: true,
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (
      claim.status === ClaimStatus.APPROVED ||
      claim.status === ClaimStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot reject claim in status: ${claim.status}`,
      );
    }

    const updatedClaim = await this.vendorClaimRepository.update(claimId, {
      status: ClaimStatus.REJECTED,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
      reviewNotes: reason,
    });

    // Emit event
    this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.REJECTED, {
      claimId,
      vendorProfileId: claim.vendorProfileId,
      userId: claim.userId,
      adminUserId,
      reason,
    });

    this.logger.log(`Claim rejected: ${claimId}`);

    return this.mapToResponseDto(updatedClaim);
  }

  /**
   * Get claim status for a user and vendor profile
   */
  async getClaimStatus(
    userId: string,
    vendorProfileId: string,
  ): Promise<ClaimStatusResponseDto> {
    this.logger.debug(
      `Getting claim status for user: ${userId}, vendor: ${vendorProfileId}`,
    );

    // Check if vendor profile exists and is claimable
    const vendorProfile =
      await this.vendorProfileRepository.findById(vendorProfileId);

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    // Check for existing claim
    const claim =
      await this.vendorClaimRepository.findByVendorProfile(vendorProfileId);

    const canClaim =
      vendorProfile.status === VendorStatus.UNCLAIMED &&
      !vendorProfile.userId &&
      (!claim ||
        claim.status === ClaimStatus.REJECTED ||
        claim.status === ClaimStatus.EXPIRED);

    let reason: string | undefined;
    if (!canClaim) {
      if (vendorProfile.status !== VendorStatus.UNCLAIMED) {
        reason = 'This vendor profile is not available for claiming';
      } else if (vendorProfile.userId) {
        reason = 'This vendor profile is already claimed';
      } else if (claim) {
        reason = `A claim is already in progress (status: ${claim.status})`;
      }
    }

    return {
      hasClaim: !!claim && claim.userId === userId,
      claim: claim ? this.mapToResponseDto(claim) : null,
      canClaim,
      reason,
    };
  }

  /**
   * Get pending claims for admin review
   */
  async getPendingClaims(): Promise<PendingClaimsResponseDto> {
    this.logger.debug('Getting pending claims for admin review');

    const claims = await this.vendorClaimRepository.findPending();

    const [pendingCount, verificationSentCount, verifiedCount] =
      await Promise.all([
        this.vendorClaimRepository.countByStatus(ClaimStatus.PENDING),
        this.vendorClaimRepository.countByStatus(ClaimStatus.VERIFICATION_SENT),
        this.vendorClaimRepository.countByStatus(ClaimStatus.VERIFIED),
      ]);

    return {
      claims: claims.map((c) => this.mapToResponseDto(c)),
      total: claims.length,
      statusCounts: {
        pending: pendingCount,
        verificationSent: verificationSentCount,
        verified: verifiedCount,
      },
    };
  }

  /**
   * Get a single claim by ID
   */
  async getClaimById(claimId: string): Promise<VendorClaimResponseDto> {
    const claim = await this.vendorClaimRepository.findById(claimId, {
      vendorProfile: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          contactEmail: true,
          contactPhone: true,
          status: true,
        },
      },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    return this.mapToResponseDto(claim);
  }

  /**
   * Handle claim expiry (scheduler job)
   */
  async expireOldClaims(): Promise<number> {
    this.logger.log('Running claim expiry job');

    const expiredCount =
      await this.vendorClaimRepository.markExpiredClaims();

    if (expiredCount > 0) {
      this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.EXPIRED, {
        count: expiredCount,
      });

      this.logger.log(`Expired ${expiredCount} claims`);
    }

    return expiredCount;
  }

  /**
   * Get all claims by a user
   */
  async getUserClaims(userId: string): Promise<VendorClaimResponseDto[]> {
    const claims = await this.vendorClaimRepository.findByUser(userId, {
      vendorProfile: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          contactEmail: true,
          contactPhone: true,
          status: true,
        },
      },
    });

    return claims.map((c) => this.mapToResponseDto(c));
  }

  /**
   * Map VendorClaim entity to response DTO
   */
  private mapToResponseDto(claim: VendorClaim): VendorClaimResponseDto {
    const claimWithRelations = claim as any;

    return {
      id: claim.id,
      vendorProfileId: claim.vendorProfileId,
      userId: claim.userId,
      status: claim.status,
      verificationMethod: claim.verificationMethod,
      verificationExpiry: claim.verificationExpiry,
      reviewedBy: claim.reviewedBy,
      reviewedAt: claim.reviewedAt,
      reviewNotes: claim.reviewNotes,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
      vendorProfile: claimWithRelations.vendorProfile
        ? {
            id: claimWithRelations.vendorProfile.id,
            businessName: claimWithRelations.vendorProfile.businessName,
            slug: claimWithRelations.vendorProfile.slug,
            contactEmail: claimWithRelations.vendorProfile.contactEmail,
            contactPhone: claimWithRelations.vendorProfile.contactPhone,
            status: claimWithRelations.vendorProfile.status,
          }
        : undefined,
    };
  }

  // ============================================================================
  // GUEST CLAIM METHODS - For unauthenticated users
  // ============================================================================

  /**
   * Mask email for display (e.g., o***r@mybusiness.com)
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '***@***.***';
    const maskedLocal =
      localPart.length > 2
        ? `${localPart[0]}***${localPart[localPart.length - 1]}`
        : `${localPart[0]}***`;
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Initiate a guest claim for an UNCLAIMED vendor profile
   * This creates a verification record and sends a code to the user's email
   * Includes IP-based rate limiting for resend protection
   */
  async initiateGuestClaim(
    dto: InitiateGuestClaimDto,
    ipAddress?: string,
  ): Promise<GuestClaimInitiatedResponseDto> {
    this.logger.log(
      `Initiating guest claim for vendor profile: ${dto.vendorProfileId} with email: ${dto.email}`,
    );

    // Check IP-based rate limit for code requests if IP address provided
    if (ipAddress) {
      const resendRateLimit = await this.checkResendRateLimit(ipAddress);
      if (!resendRateLimit.allowed) {
        const minutesUntilReset = Math.ceil(resendRateLimit.resetIn / 60);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many verification code requests. Please wait ${minutesUntilReset} minutes before requesting another code.`,
            retryAfter: resendRateLimit.resetIn,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      this.logger.debug(
        `Guest claim rate limit: ${resendRateLimit.remaining} remaining for IP ${ipAddress}`,
      );
    }

    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check if vendor profile exists and is UNCLAIMED
    const vendorProfile = await this.vendorProfileRepository.findById(
      dto.vendorProfileId,
    );

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (vendorProfile.status !== VendorStatus.UNCLAIMED) {
      throw new BadRequestException(
        'This vendor profile is not available for claiming. It may already be claimed.',
      );
    }

    if (vendorProfile.userId) {
      throw new BadRequestException(
        'This vendor profile is already associated with a user',
      );
    }

    // 2. Check if email is already used by an existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException(
        'This email is already registered. Please log in to claim this business.',
      );
    }

    // 3. Check for existing pending claim for this vendor
    const existingClaim = await this.vendorClaimRepository.findByVendorProfile(
      dto.vendorProfileId,
    );

    if (existingClaim) {
      if (
        existingClaim.status === ClaimStatus.APPROVED ||
        existingClaim.status === ClaimStatus.VERIFIED ||
        existingClaim.status === ClaimStatus.PENDING ||
        existingClaim.status === ClaimStatus.VERIFICATION_SENT
      ) {
        throw new ConflictException(
          'A claim for this vendor profile is already in progress',
        );
      }
    }

    // 4. Delete any existing guest verification for this vendor/email combo
    await this.prisma.guestClaimVerification.deleteMany({
      where: {
        vendorProfileId: dto.vendorProfileId,
      },
    });

    // 5. Generate verification code, hash both code and password, and create record
    const verificationCode = this.generateVerificationCode();
    const hashedVerificationCode = await this.hashVerificationCode(verificationCode);
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(
      verificationExpiry.getMinutes() + this.VERIFICATION_CODE_EXPIRY_MINUTES_SHORT,
    );

    // Hash the password for secure storage
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_SALT_ROUNDS);

    await this.prisma.guestClaimVerification.create({
      data: {
        vendorProfileId: dto.vendorProfileId,
        email: normalizedEmail,
        passwordHash,
        verificationCode: hashedVerificationCode, // Store HASHED code
        verificationExpiry,
        documentUrls: dto.documentUrls || [],
      },
    });

    // 6. Send verification email with PLAIN code
    this.eventEmitter.emit('notification.send', {
      type: 'GUEST_CLAIM_VERIFICATION_EMAIL',
      recipient: normalizedEmail,
      data: {
        verificationCode, // Send PLAIN code to user
        businessName: vendorProfile.businessName,
        expiresIn: `${this.VERIFICATION_CODE_EXPIRY_MINUTES_SHORT} minutes`,
      },
    });

    this.logger.log(
      `Guest claim verification sent to ${normalizedEmail} for vendor ${dto.vendorProfileId}`,
    );

    return {
      success: true,
      message: 'Verification code sent to your email',
      maskedEmail: this.maskEmail(normalizedEmail),
      expiresAt: verificationExpiry,
    };
  }

  /**
   * Verify guest claim and create user account
   * This creates a user, links them to the vendor, and returns auth tokens
   * Includes rate limiting: max 5 attempts, then lockout
   * Uses bcrypt comparison for secure verification against hashed codes
   */
  async verifyGuestClaimAndCreateUser(
    dto: VerifyGuestClaimDto,
    context?: SessionContext,
  ): Promise<GuestClaimVerifiedResponseDto> {
    this.logger.log(
      `Verifying guest claim for vendor: ${dto.vendorProfileId} with email: ${dto.email}`,
    );

    const normalizedEmail = dto.email.toLowerCase().trim();

    // Create a unique key for rate limiting based on vendor + email
    const rateLimitKey = `guest_claim:${dto.vendorProfileId}:${normalizedEmail}`;

    // Check if locked out due to too many failed attempts
    const lockoutStatus = await this.checkVerificationAttemptLockout(rateLimitKey);
    if (lockoutStatus.locked) {
      const minutesRemaining = lockoutStatus.lockoutExpiresAt
        ? Math.ceil((lockoutStatus.lockoutExpiresAt.getTime() - Date.now()) / 60000)
        : this.VERIFICATION_LOCKOUT_MINUTES;
      const retryAfterSeconds = minutesRemaining * 60;
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed verification attempts. Please wait ${minutesRemaining} minutes before trying again.`,
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 1. Find the verification record
    const verification = await this.prisma.guestClaimVerification.findFirst({
      where: {
        vendorProfileId: dto.vendorProfileId,
        email: normalizedEmail,
      },
      include: {
        vendorProfile: true,
      },
    });

    if (!verification) {
      throw new BadRequestException(
        'No pending verification found. Please initiate a new claim.',
      );
    }

    // 2. Check if expired
    if (verification.verificationExpiry < new Date()) {
      await this.prisma.guestClaimVerification.delete({
        where: { id: verification.id },
      });
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    // 3. Check code using bcrypt comparison (code is stored hashed)
    const isCodeValid = await this.verifyHashedCode(
      dto.verificationCode,
      verification.verificationCode,
    );

    if (!isCodeValid) {
      // Record failed attempt and check rate limit
      const attemptResult = await this.recordVerificationAttempt(rateLimitKey);

      if (!attemptResult.allowed) {
        // Delete the verification record on lockout
        await this.prisma.guestClaimVerification.delete({
          where: { id: verification.id },
        });
        const minutesRemaining = attemptResult.lockoutExpiresAt
          ? Math.ceil((attemptResult.lockoutExpiresAt.getTime() - Date.now()) / 60000)
          : this.VERIFICATION_LOCKOUT_MINUTES;
        const retryAfterSeconds = minutesRemaining * 60;
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many failed verification attempts. Please wait ${minutesRemaining} minutes before trying again.`,
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const attemptsRemaining = attemptResult.attemptsRemaining;
      this.logger.warn(
        `Invalid guest claim verification code for ${normalizedEmail}. Attempts remaining: ${attemptsRemaining}`,
      );
      throw new BadRequestException(
        `Invalid verification code. ${attemptsRemaining} attempts remaining.`,
      );
    }

    // Reset rate limit counter on successful verification
    await this.resetVerificationAttempts(rateLimitKey);

    // 4. Verify vendor is still claimable
    const vendorProfile = verification.vendorProfile;
    if (vendorProfile.status !== VendorStatus.UNCLAIMED || vendorProfile.userId) {
      await this.prisma.guestClaimVerification.delete({
        where: { id: verification.id },
      });
      throw new BadRequestException(
        'This vendor profile is no longer available for claiming',
      );
    }

    // 5. Check if email got registered in the meantime
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await this.prisma.guestClaimVerification.delete({
        where: { id: verification.id },
      });
      throw new BadRequestException(
        'This email is now registered. Please log in to claim this business.',
      );
    }

    // 6. Create user account and PENDING claim in a transaction
    // Vendor profile is NOT linked until admin approves the claim
    const result = await this.prisma.$transaction(async (tx) => {
      // Use the password hash stored during claim initiation
      const passwordHash = verification.passwordHash;

      // Get BUSINESS_ADMIN role
      const roleId = this.roleLookupService.getRoleIdByName(
        ROLE_NAMES.BUSINESS_ADMIN,
      );

      if (!roleId) {
        throw new Error('BUSINESS_ADMIN role not found');
      }

      // Create user account (can login but no vendor access yet)
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          status: 'ACTIVE', // Verified through email code
          emailVerified: true,
          emailVerifiedAt: new Date(),
          userRoles: {
            create: {
              roleId,
            },
          },
        },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      // DO NOT link vendor profile yet - this happens on admin approval
      // Vendor profile stays UNCLAIMED until approved

      // Create a PENDING VendorClaim - requires admin approval
      const claim = await tx.vendorClaim.create({
        data: {
          vendorProfileId: dto.vendorProfileId,
          userId: user.id,
          status: ClaimStatus.PENDING, // PENDING - awaiting admin review
          verificationMethod: ClaimVerificationMethod.EMAIL,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          // Create document records if documents were provided
          documents: verification.documentUrls && verification.documentUrls.length > 0
            ? {
                create: verification.documentUrls.map((url: string) => ({
                  type: 'OTHER' as const, // Default type, admin can verify
                  url,
                  status: 'PENDING' as const,
                })),
              }
            : undefined,
        },
      });

      // Delete the verification record
      await tx.guestClaimVerification.delete({
        where: { id: verification.id },
      });

      return { user, claim };
    });

    // 7. DO NOT create subscription yet - that happens when admin approves
    // Subscription will be created in approveClaim()

    // 8. Generate auth tokens (user can login but has no vendor access yet)
    const roles = result.user.userRoles.map((ur: any) => ur.role.name);
    const tokenPair = await this.tokenService.generateTokenPair(
      {
        sub: result.user.id,
        email: result.user.email,
        roles,
        // NO tenantId yet - user doesn't own vendor until approved
      },
      context,
    );

    // 9. Emit claim initiated event (NOT approved yet)
    this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.INITIATED, {
      claimId: result.claim.id,
      vendorProfileId: dto.vendorProfileId,
      userId: result.user.id,
      claimMethod: 'GUEST_EMAIL',
    });

    // 10. Send email notifying user their claim is pending review
    this.eventEmitter.emit('notification.send', {
      type: 'VENDOR_CLAIM_PENDING_REVIEW',
      recipient: normalizedEmail,
      data: {
        businessName: vendorProfile.businessName,
        claimId: result.claim.id,
      },
    });

    // Notify admins about new claim for review
    this.eventEmitter.emit('notification.send', {
      type: 'ADMIN_NEW_CLAIM_FOR_REVIEW',
      data: {
        claimId: result.claim.id,
        businessName: vendorProfile.businessName,
        claimantEmail: normalizedEmail,
        documentsCount: verification.documentUrls?.length || 0,
      },
    });

    this.logger.log(
      `Guest claim submitted - User ${result.user.id} claim ${result.claim.id} pending review for vendor ${dto.vendorProfileId}`,
    );

    return {
      success: true,
      message: 'Account created! Your claim is pending admin review. You will be notified once reviewed.',
      userId: result.user.id,
      vendorProfileId: dto.vendorProfileId,
      claimId: result.claim.id,
      claimStatus: ClaimStatus.PENDING,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: ROLE_NAMES.BUSINESS_ADMIN,
      },
    };
  }

  /**
   * Resend guest claim verification code
   * Includes IP-based rate limiting (max 3 resends per hour per IP)
   * Codes are hashed before storage
   */
  async resendGuestVerification(
    vendorProfileId: string,
    email: string,
    ipAddress?: string,
  ): Promise<GuestClaimInitiatedResponseDto> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check IP-based rate limit for resend if IP address provided
    if (ipAddress) {
      const resendRateLimit = await this.checkResendRateLimit(ipAddress);
      if (!resendRateLimit.allowed) {
        const minutesUntilReset = Math.ceil(resendRateLimit.resetIn / 60);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many verification code requests. Please wait ${minutesUntilReset} minutes before requesting another code.`,
            retryAfter: resendRateLimit.resetIn,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      this.logger.debug(
        `Guest resend rate limit: ${resendRateLimit.remaining} remaining for IP ${ipAddress}`,
      );
    }

    // Find existing verification
    const verification = await this.prisma.guestClaimVerification.findFirst({
      where: {
        vendorProfileId,
        email: normalizedEmail,
      },
      include: {
        vendorProfile: true,
      },
    });

    if (!verification) {
      throw new BadRequestException(
        'No pending verification found. Please initiate a new claim.',
      );
    }

    // Check if we can resend (rate limit - 1 minute minimum between resends)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (verification.createdAt > oneMinuteAgo) {
      throw new BadRequestException(
        'Please wait at least 1 minute before requesting a new code.',
      );
    }

    // Generate new code and hash it
    const verificationCode = this.generateVerificationCode();
    const hashedVerificationCode = await this.hashVerificationCode(verificationCode);
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(
      verificationExpiry.getMinutes() + this.VERIFICATION_CODE_EXPIRY_MINUTES_SHORT,
    );

    await this.prisma.guestClaimVerification.update({
      where: { id: verification.id },
      data: {
        verificationCode: hashedVerificationCode, // Store HASHED code
        verificationExpiry,
        attempts: 0,
        createdAt: new Date(),
      },
    });

    // Reset the verification attempt rate limit for this claim
    const rateLimitKey = `guest_claim:${vendorProfileId}:${normalizedEmail}`;
    await this.resetVerificationAttempts(rateLimitKey);

    // Send email with PLAIN code
    this.eventEmitter.emit('notification.send', {
      type: 'GUEST_CLAIM_VERIFICATION_EMAIL',
      recipient: normalizedEmail,
      data: {
        verificationCode, // Send PLAIN code to user
        businessName: verification.vendorProfile.businessName,
        expiresIn: `${this.VERIFICATION_CODE_EXPIRY_MINUTES_SHORT} minutes`,
      },
    });

    return {
      success: true,
      message: 'New verification code sent to your email',
      maskedEmail: this.maskEmail(normalizedEmail),
      expiresAt: verificationExpiry,
    };
  }

  /**
   * Check if vendor can be claimed by a guest
   */
  async canGuestClaim(vendorProfileId: string): Promise<{
    canClaim: boolean;
    reason?: string;
    vendorName?: string;
  }> {
    const vendorProfile = await this.vendorProfileRepository.findById(vendorProfileId);

    if (!vendorProfile) {
      return { canClaim: false, reason: 'Vendor profile not found' };
    }

    if (vendorProfile.status !== VendorStatus.UNCLAIMED) {
      return { canClaim: false, reason: 'This business has already been claimed' };
    }

    if (vendorProfile.userId) {
      return { canClaim: false, reason: 'This business is already owned' };
    }

    // Check for active claims
    const existingClaim = await this.vendorClaimRepository.findByVendorProfile(vendorProfileId);
    const activeStatuses: ClaimStatus[] = [ClaimStatus.PENDING, ClaimStatus.VERIFICATION_SENT, ClaimStatus.VERIFIED];
    if (existingClaim && activeStatuses.includes(existingClaim.status)) {
      return { canClaim: false, reason: 'A claim is already in progress for this business' };
    }

    return {
      canClaim: true,
      vendorName: vendorProfile.businessName,
    };
  }
}
