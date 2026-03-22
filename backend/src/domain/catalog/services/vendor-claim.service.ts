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
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VendorClaimRepository } from '../repositories/vendor-claim.repository';
import { VendorProfileRepository } from '../repositories/vendor-profile.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import { SubscriptionPlanService } from '../../subscription/services/subscription-plan.service';
import {
  VendorClaim,
  ClaimStatus,
  ClaimVerificationMethod,
  VendorStatus,
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
  private readonly VERIFICATION_CODE_EXPIRY_HOURS = 24;
  private readonly VERIFICATION_CODE_LENGTH = 6;

  constructor(
    private readonly vendorClaimRepository: VendorClaimRepository,
    private readonly vendorProfileRepository: VendorProfileRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenService: TokenService,
    private readonly roleLookupService: RoleLookupService,
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
   * Calculate verification expiry date
   */
  private getVerificationExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.VERIFICATION_CODE_EXPIRY_HOURS);
    return expiry;
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
        if (!vendorProfile.contactPhone) {
          throw new BadRequestException(
            'This vendor profile does not have a phone number. Please choose a different verification method.',
          );
        }
        break;
      case ClaimVerificationMethod.DOCUMENT:
      case ClaimVerificationMethod.ADMIN_VERIFIED:
        // These methods are always available
        break;
    }
  }

  /**
   * Send verification code/link to the vendor
   */
  async sendVerification(claimId: string): Promise<void> {
    this.logger.log(`Sending verification for claim: ${claimId}`);

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

    const verificationCode = this.generateVerificationCode();
    const verificationExpiry = this.getVerificationExpiry();

    // Update claim with verification code
    await this.vendorClaimRepository.update(claimId, {
      status: ClaimStatus.VERIFICATION_SENT,
      verificationCode,
      verificationExpiry,
    });

    // Send the verification based on method
    const vendorProfile = (claim as any).vendorProfile;

    switch (claim.verificationMethod) {
      case ClaimVerificationMethod.EMAIL:
        await this.sendEmailVerification(
          vendorProfile.contactEmail,
          verificationCode,
          vendorProfile.businessName,
        );
        break;
      case ClaimVerificationMethod.PHONE:
        await this.sendPhoneVerification(
          vendorProfile.contactPhone,
          verificationCode,
        );
        break;
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
   * Send email verification (placeholder - integrate with notification service)
   */
  private async sendEmailVerification(
    email: string,
    code: string,
    businessName: string,
  ): Promise<void> {
    // TODO: Integrate with notification/email service
    this.logger.log(
      `Email verification would be sent to: ${email} with code: ${code} for business: ${businessName}`,
    );

    // Example event emission for notification service to pick up
    this.eventEmitter.emit('notification.send', {
      type: 'CLAIM_VERIFICATION_EMAIL',
      recipient: email,
      data: {
        verificationCode: code,
        businessName,
        expiresIn: `${this.VERIFICATION_CODE_EXPIRY_HOURS} hours`,
      },
    });
  }

  /**
   * Send phone verification (placeholder - integrate with SMS service)
   */
  private async sendPhoneVerification(
    phone: string,
    code: string,
  ): Promise<void> {
    // TODO: Integrate with SMS/OTP service
    this.logger.log(
      `Phone verification would be sent to: ${phone} with code: ${code}`,
    );

    // Example event emission for SMS service to pick up
    this.eventEmitter.emit('notification.send', {
      type: 'CLAIM_VERIFICATION_SMS',
      recipient: phone,
      data: {
        verificationCode: code,
        expiresIn: `${this.VERIFICATION_CODE_EXPIRY_HOURS} hours`,
      },
    });
  }

  /**
   * Verify the code submitted by the user
   */
  async verifyCode(
    dto: VerifyClaimDto,
    userId: string,
  ): Promise<VendorClaimResponseDto> {
    this.logger.log(`Verifying code for claim: ${dto.claimId}`);

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

    // Verify code
    if (claim.verificationCode !== dto.verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

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

    // For certain verification methods, auto-approve
    if (
      claim.verificationMethod === ClaimVerificationMethod.EMAIL ||
      claim.verificationMethod === ClaimVerificationMethod.PHONE
    ) {
      // Auto-approve verified claims for EMAIL and PHONE methods
      return this.approveClaim(dto.claimId, undefined, 'Auto-approved after verification');
    }

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

      // 2. Link userId to VendorProfile and update status to ACTIVE
      await tx.vendorProfile.update({
        where: { id: claim.vendorProfileId },
        data: {
          userId: claim.userId,
          status: VendorStatus.ACTIVE,
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
        this.logger.warn(
          'No FREE subscription plan found, skipping subscription creation',
        );
        return;
      }

      // Get the price for the FREE plan (should be 0)
      const prices = await this.subscriptionPlanService.getPrices(freePlan.id);
      const freePrice = prices.find(
        (p: any) => p.amount === 0 || p.billingCycle === 'MONTHLY',
      );

      if (!freePrice) {
        this.logger.warn(
          'No price found for FREE plan, skipping subscription creation',
        );
        return;
      }

      // Check if vendor already has a subscription
      const existingSubscription =
        await this.subscriptionService.findActiveByVendorProfile(
          vendorProfileId,
        );

      if (existingSubscription) {
        this.logger.log(
          `Vendor profile ${vendorProfileId} already has an active subscription`,
        );
        return;
      }

      // Create the subscription
      await this.subscriptionService.create({
        vendorProfileId,
        planId: freePlan.id,
        priceId: freePrice.id,
      });

      this.logger.log(
        `Created FREE subscription for vendor profile: ${vendorProfileId}`,
      );
    } catch (error) {
      // Don't fail the claim approval if subscription creation fails
      this.logger.error(
        `Failed to create FREE subscription for vendor ${vendorProfileId}: ${error.message}`,
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
   */
  async initiateGuestClaim(
    dto: InitiateGuestClaimDto,
  ): Promise<GuestClaimInitiatedResponseDto> {
    this.logger.log(
      `Initiating guest claim for vendor profile: ${dto.vendorProfileId} with email: ${dto.email}`,
    );

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

    // 5. Generate verification code and create record
    const verificationCode = this.generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10); // 10 minutes expiry

    await this.prisma.guestClaimVerification.create({
      data: {
        vendorProfileId: dto.vendorProfileId,
        email: normalizedEmail,
        verificationCode,
        verificationExpiry,
      },
    });

    // 6. Send verification email
    this.eventEmitter.emit('notification.send', {
      type: 'GUEST_CLAIM_VERIFICATION_EMAIL',
      recipient: normalizedEmail,
      data: {
        verificationCode,
        businessName: vendorProfile.businessName,
        expiresIn: '10 minutes',
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
   */
  async verifyGuestClaimAndCreateUser(
    dto: VerifyGuestClaimDto,
    context?: SessionContext,
  ): Promise<GuestClaimVerifiedResponseDto> {
    this.logger.log(
      `Verifying guest claim for vendor: ${dto.vendorProfileId} with email: ${dto.email}`,
    );

    const normalizedEmail = dto.email.toLowerCase().trim();

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

    // 3. Check code
    if (verification.verificationCode !== dto.verificationCode) {
      // Increment attempts
      const attempts = verification.attempts + 1;
      if (attempts >= 5) {
        await this.prisma.guestClaimVerification.delete({
          where: { id: verification.id },
        });
        throw new BadRequestException(
          'Too many failed attempts. Please request a new verification code.',
        );
      }
      await this.prisma.guestClaimVerification.update({
        where: { id: verification.id },
        data: { attempts },
      });
      throw new BadRequestException('Invalid verification code');
    }

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

    // 6. Create user account in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate a random password (user will reset it)
      const tempPassword = randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Get BUSINESS_ADMIN role
      const roleId = this.roleLookupService.getRoleIdByName(
        ROLE_NAMES.BUSINESS_ADMIN,
      );

      if (!roleId) {
        throw new Error('BUSINESS_ADMIN role not found');
      }

      // Create user
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

      // Link vendor profile to user and update status
      await tx.vendorProfile.update({
        where: { id: dto.vendorProfileId },
        data: {
          userId: user.id,
          status: VendorStatus.ACTIVE,
          verifiedAt: new Date(),
        },
      });

      // Create a VendorClaim record for audit trail
      await tx.vendorClaim.create({
        data: {
          vendorProfileId: dto.vendorProfileId,
          userId: user.id,
          status: ClaimStatus.APPROVED,
          verificationMethod: ClaimVerificationMethod.EMAIL,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(),
          reviewNotes: 'Auto-approved via guest claim email verification',
        },
      });

      // Delete the verification record
      await tx.guestClaimVerification.delete({
        where: { id: verification.id },
      });

      return user;
    });

    // 7. Create FREE subscription
    await this.createFreeSubscription(dto.vendorProfileId, result.id);

    // 8. Generate auth tokens
    const roles = result.userRoles.map((ur: any) => ur.role.name);
    const tokenPair = await this.tokenService.generateTokenPair(
      {
        sub: result.id,
        email: result.email,
        roles,
        tenantId: dto.vendorProfileId,
      },
      context,
    );

    // 9. Emit events
    this.eventEmitter.emit(VENDOR_CLAIM_EVENTS.APPROVED, {
      vendorProfileId: dto.vendorProfileId,
      userId: result.id,
      claimMethod: 'GUEST_EMAIL',
    });

    this.eventEmitter.emit('vendor.claimed', {
      vendorProfileId: dto.vendorProfileId,
      userId: result.id,
      businessName: vendorProfile.businessName,
    });

    // 10. Send welcome email with password reset link
    this.eventEmitter.emit('notification.send', {
      type: 'VENDOR_CLAIM_SUCCESS',
      recipient: normalizedEmail,
      data: {
        businessName: vendorProfile.businessName,
      },
    });

    this.logger.log(
      `Guest claim successful - User ${result.id} now owns vendor ${dto.vendorProfileId}`,
    );

    return {
      success: true,
      message: 'Business claimed successfully! You are now logged in.',
      userId: result.id,
      vendorProfileId: dto.vendorProfileId,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: result.id,
        email: result.email,
        role: ROLE_NAMES.BUSINESS_ADMIN,
      },
    };
  }

  /**
   * Resend guest claim verification code
   */
  async resendGuestVerification(
    vendorProfileId: string,
    email: string,
  ): Promise<GuestClaimInitiatedResponseDto> {
    const normalizedEmail = email.toLowerCase().trim();

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

    // Check if we can resend (rate limit - 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (verification.createdAt > oneMinuteAgo) {
      throw new BadRequestException(
        'Please wait at least 1 minute before requesting a new code.',
      );
    }

    // Generate new code
    const verificationCode = this.generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10);

    await this.prisma.guestClaimVerification.update({
      where: { id: verification.id },
      data: {
        verificationCode,
        verificationExpiry,
        attempts: 0,
        createdAt: new Date(),
      },
    });

    // Send email
    this.eventEmitter.emit('notification.send', {
      type: 'GUEST_CLAIM_VERIFICATION_EMAIL',
      recipient: normalizedEmail,
      data: {
        verificationCode,
        businessName: verification.vendorProfile.businessName,
        expiresIn: '10 minutes',
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
