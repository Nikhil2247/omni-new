// ============================================================================
// VENDOR BADGE SERVICE - Catalog Domain
// ============================================================================
// Handles badge awarding for all metrics: FOLLOWERS, REVIEWS, LEADS, VIEWS
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { VendorBadgeMetric } from '@prisma/client';
import { CacheAsideStrategy } from '../../../infrastructure/cache/strategies/cache-aside.strategy';

@Injectable()
export class VendorBadgeService {
  private readonly logger = new Logger(VendorBadgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheAside: CacheAsideStrategy,
  ) {}

  /**
   * Award badges based on follower count
   */
  async awardFollowerBadges(vendorProfileId: string): Promise<void> {
    const count = await this.prisma.vendorFollow.count({
      where: { vendorProfileId },
    });

    await this.awardBadgesForMetric(
      vendorProfileId,
      VendorBadgeMetric.FOLLOWERS,
      count,
    );
  }

  /**
   * Award badges based on review count
   */
  async awardReviewBadges(vendorProfileId: string): Promise<void> {
    const count = await this.prisma.vendorReview.count({
      where: { vendorProfileId },
    });

    await this.awardBadgesForMetric(
      vendorProfileId,
      VendorBadgeMetric.REVIEWS,
      count,
    );
  }

  /**
   * Award badges based on lead count
   */
  async awardLeadBadges(vendorProfileId: string): Promise<void> {
    const count = await this.prisma.lead.count({
      where: { vendorProfileId },
    });

    await this.awardBadgesForMetric(
      vendorProfileId,
      VendorBadgeMetric.LEADS,
      count,
    );
  }

  /**
   * Award badges based on profile view count
   */
  async awardViewBadges(vendorProfileId: string): Promise<void> {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: { viewCount: true },
    });

    if (!profile) return;

    await this.awardBadgesForMetric(
      vendorProfileId,
      VendorBadgeMetric.VIEWS,
      profile.viewCount,
    );
  }

  /**
   * Check and award all badge types for a vendor
   * Useful for recalculating badges after data migration
   */
  async recalculateAllBadges(vendorProfileId: string): Promise<void> {
    await Promise.all([
      this.awardFollowerBadges(vendorProfileId),
      this.awardReviewBadges(vendorProfileId),
      this.awardLeadBadges(vendorProfileId),
      this.awardViewBadges(vendorProfileId),
    ]);
  }

  /**
   * Generic method to award badges for a specific metric
   */
  private async awardBadgesForMetric(
    vendorProfileId: string,
    metric: VendorBadgeMetric,
    currentCount: number,
  ): Promise<void> {
    // Find all badge definitions for this metric where threshold is met
    const definitions = await this.prisma.vendorBadgeDefinition.findMany({
      where: {
        metric,
        isActive: true,
        threshold: { lte: currentCount },
      },
    });

    if (definitions.length === 0) return;

    // Get existing badges for this vendor
    const definitionIds = definitions.map((d) => d.id);
    const existing = await this.prisma.vendorBadge.findMany({
      where: {
        vendorProfileId,
        badgeDefinitionId: { in: definitionIds },
      },
      select: { badgeDefinitionId: true },
    });

    const existingIds = new Set(existing.map((b) => b.badgeDefinitionId));

    // Filter to only badges not yet awarded
    const toCreate = definitionIds
      .filter((id) => !existingIds.has(id))
      .map((id) => ({ vendorProfileId, badgeDefinitionId: id }));

    if (toCreate.length === 0) return;

    // Create new badge awards
    await this.prisma.vendorBadge.createMany({
      data: toCreate,
      skipDuplicates: true,
    });

    // Invalidate vendor cache so badges show up immediately
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: { slug: true },
    });
    if (vendor?.slug) {
      await this.cacheAside.invalidate(`vendor:slug:v3:${vendor.slug}`);
    }

    this.logger.log(
      `Awarded ${toCreate.length} ${metric} badge(s) to vendor ${vendorProfileId}`,
    );
  }

  /**
   * Get all badges for a vendor profile
   */
  async getVendorBadges(vendorProfileId: string) {
    return this.prisma.vendorBadge.findMany({
      where: { vendorProfileId },
      include: { definition: true },
      orderBy: { achievedAt: 'desc' },
    });
  }
}
