// ============================================================================
// VENDOR REVIEW SERVICE - Catalog Domain
// ============================================================================

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import type {
  CreateVendorReviewDto,
  UpdateVendorReviewDto,
  RespondVendorReviewDto,
} from '../dto/vendor-review.dto';

@Injectable()
export class VendorReviewService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.vendorReview.update({
      where: { id: reviewId },
      data: {
        reviewNotes: dto.response,
        reviewedAt: new Date(),
        reviewedBy: vendorUserId,
        status: 'APPROVED',
      },
    });
  }
}
