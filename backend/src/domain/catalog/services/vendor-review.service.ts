// ============================================================================
// VENDOR REVIEW SERVICE - Catalog Domain
// ============================================================================

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { VendorBadgeService } from './vendor-badge.service';
import type {
  CreateVendorReviewDto,
  UpdateVendorReviewDto,
  RespondVendorReviewDto,
} from '../dto/vendor-review.dto';

@Injectable()
export class VendorReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badgeService: VendorBadgeService,
  ) {}

  /**
   * Update vendor rating atomically to prevent race conditions
   * Uses database-level aggregation in a single query
   */
  private async updateVendorRatingAtomic(vendorProfileId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE catalog."vendor_profiles"
      SET
        "average_rating" = (
          SELECT AVG(rating)::numeric(3,2)
          FROM catalog."vendor_reviews"
          WHERE "vendor_profile_id" = ${vendorProfileId}
            AND status = 'APPROVED'
            AND "deleted_at" IS NULL
        ),
        "total_reviews" = (
          SELECT COUNT(*)::integer
          FROM catalog."vendor_reviews"
          WHERE "vendor_profile_id" = ${vendorProfileId}
            AND status = 'APPROVED'
            AND "deleted_at" IS NULL
        ),
        "updated_at" = NOW()
      WHERE id = ${vendorProfileId}
    `;
  }

  async create(userId: string, dto: CreateVendorReviewDto) {
    return this.prisma.vendorReview.create({
      data: {
        vendor: { connect: { id: dto.vendorProfileId } },
        reviewer: { connect: { id: userId } },
        event: dto.eventId ? { connect: { id: dto.eventId } } : undefined,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: 'PENDING',
        media: dto.media?.length
          ? {
              create: dto.media.map((item) => ({
                type: item.mimeType.startsWith('video/') ? 'VIDEO' : 'IMAGE',
                url: item.url,
                thumbnailUrl: item.thumbnailUrl,
                mimeType: item.mimeType,
                fileSize: item.fileSize,
              })),
            }
          : undefined,
      },
      include: { media: true },
    });
  }

  async listForVendor(vendorProfileId: string, approvedOnly = false) {
    return this.prisma.vendorReview.findMany({
      where: {
        vendorProfileId,
        ...(approvedOnly ? { status: 'APPROVED' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        media: true,
      },
    });
  }

  async listForVendorUser(vendorUserId: string) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId: vendorUserId },
      select: { id: true },
    });

    if (!vendorProfile) {
      return [];
    }

    return this.listForVendor(vendorProfile.id);
  }

  async listByReviewer(userId: string) {
    return this.prisma.vendorReview.findMany({
      where: { reviewerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { id: true, businessName: true, slug: true } },
        media: true,
      },
    });
  }

  async update(userId: string, reviewId: string, dto: UpdateVendorReviewDto) {
    const review = await this.prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.reviewerId !== userId)
      throw new ForbiddenException('Not allowed');

    return this.prisma.vendorReview.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating ?? review.rating,
        title: dto.title ?? review.title,
        body: dto.body ?? review.body,
      },
    });
  }

  async respond(
    vendorUserId: string,
    reviewId: string,
    dto: RespondVendorReviewDto,
  ) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId: vendorUserId },
      select: { id: true },
    });

    if (!vendorProfile) {
      throw new ForbiddenException('Vendor profile required');
    }

    const review = await this.prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.vendorProfileId !== vendorProfile.id)
      throw new ForbiddenException('Not allowed');

    const updated = await this.prisma.vendorReview.update({
      where: { id: reviewId },
      data: {
        reviewNotes: dto.response,
        reviewedAt: new Date(),
        reviewedBy: vendorUserId,
        status: 'APPROVED',
      },
    });

    // Update vendor rating atomically (prevents race conditions)
    await this.updateVendorRatingAtomic(vendorProfile.id);

    // Award badges for reaching review milestones
    await this.badgeService.awardReviewBadges(vendorProfile.id);

    return updated;
  }
}
