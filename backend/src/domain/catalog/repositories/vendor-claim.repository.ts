// ============================================================================
// VENDOR CLAIM REPOSITORY - Data Access Layer for Vendor Claim Requests
// ============================================================================
// Handles CRUD operations for vendor profile claim requests
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Prisma, VendorClaim, ClaimStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class VendorClaimRepository {
  private readonly logger = new Logger(VendorClaimRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find claim by ID
   */
  async findById(
    id: string,
    include?: Prisma.VendorClaimInclude,
  ): Promise<VendorClaim | null> {
    this.logger.debug(`Finding vendor claim by ID: ${id}`);

    return this.prisma.vendorClaim.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find claim by vendor profile ID
   * Note: vendorProfileId is unique, so there can only be one claim per vendor profile
   */
  async findByVendorProfile(
    vendorProfileId: string,
    include?: Prisma.VendorClaimInclude,
  ): Promise<VendorClaim | null> {
    this.logger.debug(
      `Finding vendor claim by vendor profile ID: ${vendorProfileId}`,
    );

    return this.prisma.vendorClaim.findUnique({
      where: { vendorProfileId },
      include,
    });
  }

  /**
   * Find all claims by user ID
   */
  async findByUser(
    userId: string,
    include?: Prisma.VendorClaimInclude,
  ): Promise<VendorClaim[]> {
    this.logger.debug(`Finding vendor claims by user ID: ${userId}`);

    return this.prisma.vendorClaim.findMany({
      where: { userId },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all pending claims (for admin review)
   */
  async findPending(include?: Prisma.VendorClaimInclude): Promise<VendorClaim[]> {
    this.logger.debug('Finding pending vendor claims');

    return this.prisma.vendorClaim.findMany({
      where: {
        status: {
          in: [ClaimStatus.PENDING, ClaimStatus.VERIFICATION_SENT, ClaimStatus.VERIFIED],
        },
      },
      include: include || {
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
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find claims that need review (VERIFIED status - user has verified but awaiting admin approval)
   */
  async findAwaitingReview(
    include?: Prisma.VendorClaimInclude,
  ): Promise<VendorClaim[]> {
    this.logger.debug('Finding claims awaiting review');

    return this.prisma.vendorClaim.findMany({
      where: {
        status: ClaimStatus.VERIFIED,
      },
      include: include || {
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
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find claim by verification code
   */
  async findByVerificationCode(
    code: string,
    include?: Prisma.VendorClaimInclude,
  ): Promise<VendorClaim | null> {
    this.logger.debug('Finding vendor claim by verification code');

    return this.prisma.vendorClaim.findFirst({
      where: {
        verificationCode: code,
        status: ClaimStatus.VERIFICATION_SENT,
        verificationExpiry: {
          gte: new Date(),
        },
      },
      include,
    });
  }

  /**
   * Find expired claims that need status update
   */
  async findExpiredClaims(): Promise<VendorClaim[]> {
    this.logger.debug('Finding expired vendor claims');

    return this.prisma.vendorClaim.findMany({
      where: {
        status: ClaimStatus.VERIFICATION_SENT,
        verificationExpiry: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Create a new claim
   */
  async create(
    data: Prisma.VendorClaimCreateInput,
    include?: Prisma.VendorClaimInclude,
  ): Promise<VendorClaim> {
    this.logger.debug('Creating vendor claim');

    return this.prisma.vendorClaim.create({
      data,
      include,
    });
  }

  /**
   * Update a claim
   */
  async update(
    id: string,
    data: Prisma.VendorClaimUpdateInput,
    include?: Prisma.VendorClaimInclude,
  ): Promise<VendorClaim> {
    this.logger.debug(`Updating vendor claim: ${id}`);

    return this.prisma.vendorClaim.update({
      where: { id },
      data,
      include,
    });
  }

  /**
   * Update claim status
   */
  async updateStatus(
    id: string,
    status: ClaimStatus,
    additionalData?: Partial<{
      reviewedBy: string;
      reviewedAt: Date;
      reviewNotes: string;
      verificationCode: string;
      verificationExpiry: Date;
    }>,
  ): Promise<VendorClaim> {
    this.logger.debug(`Updating vendor claim status: ${id} -> ${status}`);

    return this.prisma.vendorClaim.update({
      where: { id },
      data: {
        status,
        ...additionalData,
      },
    });
  }

  /**
   * Delete a claim
   */
  async delete(id: string): Promise<VendorClaim> {
    this.logger.debug(`Deleting vendor claim: ${id}`);

    return this.prisma.vendorClaim.delete({
      where: { id },
    });
  }

  /**
   * Check if a user has an active (non-expired, non-rejected) claim for a vendor profile
   */
  async hasActiveClaim(
    userId: string,
    vendorProfileId: string,
  ): Promise<boolean> {
    const claim = await this.prisma.vendorClaim.findFirst({
      where: {
        userId,
        vendorProfileId,
        status: {
          notIn: [ClaimStatus.REJECTED, ClaimStatus.EXPIRED],
        },
      },
    });

    return claim !== null;
  }

  /**
   * Count claims by status
   */
  async countByStatus(status: ClaimStatus): Promise<number> {
    return this.prisma.vendorClaim.count({
      where: { status },
    });
  }

  /**
   * Bulk update expired claims
   */
  async markExpiredClaims(): Promise<number> {
    this.logger.debug('Marking expired vendor claims');

    const result = await this.prisma.vendorClaim.updateMany({
      where: {
        status: ClaimStatus.VERIFICATION_SENT,
        verificationExpiry: {
          lt: new Date(),
        },
      },
      data: {
        status: ClaimStatus.EXPIRED,
      },
    });

    return result.count;
  }
}
