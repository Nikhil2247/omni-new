// ============================================================================
// VENDOR METRICS SERVICE - Vendor Performance Analytics
// ============================================================================
// Tracks and aggregates vendor performance metrics for analytics dashboard
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';
import type { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

export interface VendorDailyMetrics {
  vendorProfileId: string;
  date: Date;
  profileViews: number;
  searchAppearances: number;
  searchClicks: number;
  clickThroughRate: number | null;
  leadsReceived: number;
  leadsResponded: number;
  responseRate: number | null;
  avgResponseTime: number | null;
  leadsConverted: number;
  conversionRate: number | null;
  wishlistAdds: number;
  portfolioViews: number;
  totalRevenue: number | null;
}

export interface VendorPerformanceSummary {
  vendorProfileId: string;
  vendorName: string;
  businessName?: string;
  categoryName?: string;
  cityName?: string;
  totalProfileViews: number;
  totalSearchAppearances: number;
  totalSearchClicks: number;
  avgClickThroughRate: number;
  totalLeadsReceived: number;
  totalLeadsResponded: number;
  avgResponseRate: number;
  avgResponseTime: number;
  totalLeadsConverted: number;
  avgConversionRate: number;
  totalWishlistAdds: number;
  totalPortfolioViews: number;
  totalRevenue: number;
  performanceScore: number;
  ranking?: number;
}

export interface VendorRanking {
  vendorProfileId: string;
  rank: number;
  score: number;
  categoryId?: string;
  cityId?: string;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  vendorCount: number;
  avgProfileViews: number;
  avgLeadsReceived: number;
  avgConversionRate: number;
  totalRevenue: number;
}

@Injectable()
export class VendorMetricsService {
  private readonly logger = new Logger(VendorMetricsService.name);
  private readonly CACHE_PREFIX = 'vendor-metrics:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
  ) {}

  // ============================================================================
  // TRACKING METHODS
  // ============================================================================

  /**
   * Track profile view
   */
  async trackProfileView(vendorProfileId: string): Promise<void> {
    await this.incrementMetric(vendorProfileId, 'profileViews');
  }

  /**
   * Track search appearance
   */
  async trackSearchAppearance(vendorProfileId: string): Promise<void> {
    await this.incrementMetric(vendorProfileId, 'searchAppearances');
  }

  /**
   * Track search click
   */
  async trackSearchClick(vendorProfileId: string): Promise<void> {
    await this.incrementMetric(vendorProfileId, 'searchClicks');
    await this.recalculateCTR(vendorProfileId);
  }

  /**
   * Track lead received
   */
  async trackLeadReceived(vendorProfileId: string): Promise<void> {
    await this.incrementMetric(vendorProfileId, 'leadsReceived');
  }

  /**
   * Track lead response
   */
  async trackLeadResponded(
    vendorProfileId: string,
    responseTimeMinutes: number,
  ): Promise<void> {
    const today = this.getToday();

    // Get current metrics
    const current = await this.prisma.vendorMetrics.findUnique({
      where: {
        vendorProfileId_date: { vendorProfileId, date: today },
      },
    });

    if (current) {
      // Calculate new average response time
      const totalResponded = current.leadsResponded + 1;
      const currentAvg = current.avgResponseTime || 0;
      const newAvg = Math.round(
        (currentAvg * current.leadsResponded + responseTimeMinutes) /
          totalResponded,
      );

      await this.prisma.vendorMetrics.update({
        where: {
          vendorProfileId_date: { vendorProfileId, date: today },
        },
        data: {
          leadsResponded: { increment: 1 },
          avgResponseTime: newAvg,
          responseRate: new Decimal(totalResponded / current.leadsReceived),
        },
      });
    } else {
      await this.prisma.vendorMetrics.create({
        data: {
          vendorProfileId,
          date: today,
          leadsResponded: 1,
          avgResponseTime: responseTimeMinutes,
        },
      });
    }

    await this.invalidateCache(vendorProfileId);
  }

  /**
   * Track lead conversion
   */
  async trackLeadConverted(
    vendorProfileId: string,
    revenue?: number,
  ): Promise<void> {
    const today = this.getToday();

    await this.prisma.vendorMetrics.upsert({
      where: {
        vendorProfileId_date: { vendorProfileId, date: today },
      },
      create: {
        vendorProfileId,
        date: today,
        leadsConverted: 1,
        totalRevenue: revenue ? new Decimal(revenue) : null,
      },
      update: {
        leadsConverted: { increment: 1 },
        totalRevenue: revenue ? { increment: revenue } : undefined,
      },
    });

    await this.recalculateConversionRate(vendorProfileId);
    await this.invalidateCache(vendorProfileId);
  }

  /**
   * Track wishlist add
   */
  async trackWishlistAdd(vendorProfileId: string): Promise<void> {
    await this.incrementMetric(vendorProfileId, 'wishlistAdds');
  }

  /**
   * Track portfolio view
   */
  async trackPortfolioView(vendorProfileId: string): Promise<void> {
    await this.incrementMetric(vendorProfileId, 'portfolioViews');
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get vendor daily metrics for a date range
   */
  async getVendorMetrics(
    vendorProfileId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<VendorDailyMetrics[]> {
    const metrics = await this.prisma.vendorMetrics.findMany({
      where: {
        vendorProfileId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return metrics.map((m) => ({
      vendorProfileId: m.vendorProfileId,
      date: m.date,
      profileViews: m.profileViews,
      searchAppearances: m.searchAppearances,
      searchClicks: m.searchClicks,
      clickThroughRate: m.clickThroughRate?.toNumber() ?? null,
      leadsReceived: m.leadsReceived,
      leadsResponded: m.leadsResponded,
      responseRate: m.responseRate?.toNumber() ?? null,
      avgResponseTime: m.avgResponseTime,
      leadsConverted: m.leadsConverted,
      conversionRate: m.conversionRate?.toNumber() ?? null,
      wishlistAdds: m.wishlistAdds,
      portfolioViews: m.portfolioViews,
      totalRevenue: m.totalRevenue?.toNumber() ?? null,
    }));
  }

  /**
   * Get vendor performance summary
   */
  async getVendorSummary(
    vendorProfileId: string,
    days: number = 30,
  ): Promise<VendorPerformanceSummary | null> {
    const cacheKey = `${this.CACHE_PREFIX}summary:${vendorProfileId}:${days}`;
    const cached = await this.cache.get<VendorPerformanceSummary>(cacheKey);

    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch vendor profile details
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: {
        businessName: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        address: {
          select: {
            city: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const result = await this.prisma.vendorMetrics.aggregate({
      where: {
        vendorProfileId,
        date: { gte: startDate },
      },
      _sum: {
        profileViews: true,
        searchAppearances: true,
        searchClicks: true,
        leadsReceived: true,
        leadsResponded: true,
        leadsConverted: true,
        wishlistAdds: true,
        portfolioViews: true,
        totalRevenue: true,
      },
      _avg: {
        clickThroughRate: true,
        responseRate: true,
        avgResponseTime: true,
        conversionRate: true,
      },
      _count: { id: true },
    });

    if (!result._count.id) {
      return null;
    }

    const vendorName =
      vendorProfile?.businessName ||
      (vendorProfile?.user
        ? `${vendorProfile.user.firstName || ''} ${vendorProfile.user.lastName || ''}`.trim()
        : '') ||
      'Unknown Vendor';

    const summary: VendorPerformanceSummary = {
      vendorProfileId,
      vendorName,
      businessName: vendorProfile?.businessName || undefined,
      categoryName: vendorProfile?.category?.name || undefined,
      cityName: vendorProfile?.address?.city?.name || undefined,
      totalProfileViews: result._sum.profileViews || 0,
      totalSearchAppearances: result._sum.searchAppearances || 0,
      totalSearchClicks: result._sum.searchClicks || 0,
      avgClickThroughRate: result._avg.clickThroughRate?.toNumber() || 0,
      totalLeadsReceived: result._sum.leadsReceived || 0,
      totalLeadsResponded: result._sum.leadsResponded || 0,
      avgResponseRate: result._avg.responseRate?.toNumber() || 0,
      avgResponseTime: result._avg.avgResponseTime || 0,
      totalLeadsConverted: result._sum.leadsConverted || 0,
      avgConversionRate: result._avg.conversionRate?.toNumber() || 0,
      totalWishlistAdds: result._sum.wishlistAdds || 0,
      totalPortfolioViews: result._sum.portfolioViews || 0,
      totalRevenue: result._sum.totalRevenue?.toNumber() || 0,
      performanceScore: this.calculatePerformanceScore(result),
    };

    await this.cache.set(cacheKey, summary, { ttl: this.CACHE_TTL });

    return summary;
  }

  /**
   * Get top performing vendors
   */
  async getTopVendors(
    limit: number = 10,
    days: number = 30,
    categoryId?: string,
  ): Promise<VendorPerformanceSummary[]> {
    const cacheKey = `${this.CACHE_PREFIX}top-vendors:${limit}:${days}:${categoryId || 'all'}`;
    const cached = await this.cache.get<VendorPerformanceSummary[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // First, try to get vendors with metrics data
    const results = await this.prisma.vendorMetrics.groupBy({
      by: ['vendorProfileId'],
      where: {
        date: { gte: startDate },
      },
      _sum: {
        profileViews: true,
        searchAppearances: true,
        searchClicks: true,
        leadsReceived: true,
        leadsResponded: true,
        leadsConverted: true,
        wishlistAdds: true,
        portfolioViews: true,
        totalRevenue: true,
      },
      _avg: {
        clickThroughRate: true,
        conversionRate: true,
        responseRate: true,
        avgResponseTime: true,
      },
      orderBy: {
        _sum: { leadsConverted: 'desc' },
      },
      take: limit,
    });

    // If we have results from metrics, fetch vendor details and merge
    if (results.length > 0) {
      const vendorIds = results.map((r) => r.vendorProfileId);

      // Fetch vendor profile details (name, category, city via address)
      const vendorProfiles = await this.prisma.vendorProfile.findMany({
        where: { id: { in: vendorIds } },
        select: {
          id: true,
          businessName: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
          address: {
            select: {
              city: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      const vendorMap = new Map(vendorProfiles.map((v) => [v.id, v]));

      const topVendors = results.map((r, index) => {
        const vendor = vendorMap.get(r.vendorProfileId);
        const performanceScore = this.calculatePerformanceScore({
          _sum: r._sum,
          _avg: r._avg,
        });

        // Build vendor display name
        const vendorName =
          vendor?.businessName ||
          (vendor?.user
            ? `${vendor.user.firstName || ''} ${vendor.user.lastName || ''}`.trim()
            : '') ||
          `Vendor ${index + 1}`;

        return {
          vendorProfileId: r.vendorProfileId,
          vendorName,
          businessName: vendor?.businessName || undefined,
          categoryName: vendor?.category?.name || undefined,
          cityName: vendor?.address?.city?.name || undefined,
          totalProfileViews: r._sum.profileViews || 0,
          totalSearchAppearances: r._sum.searchAppearances || 0,
          totalSearchClicks: r._sum.searchClicks || 0,
          avgClickThroughRate: r._avg.clickThroughRate?.toNumber() || 0,
          totalLeadsReceived: r._sum.leadsReceived || 0,
          totalLeadsResponded: r._sum.leadsResponded || 0,
          avgResponseRate: r._avg.responseRate?.toNumber() || 0,
          avgResponseTime: r._avg.avgResponseTime || 0,
          totalLeadsConverted: r._sum.leadsConverted || 0,
          avgConversionRate: r._avg.conversionRate?.toNumber() || 0,
          totalWishlistAdds: r._sum.wishlistAdds || 0,
          totalPortfolioViews: r._sum.portfolioViews || 0,
          totalRevenue: r._sum.totalRevenue?.toNumber() || 0,
          performanceScore,
          ranking: index + 1,
        };
      });

      await this.cache.set(cacheKey, topVendors, { ttl: this.CACHE_TTL });
      return topVendors;
    }

    // Fallback: Get vendors with most leads (using denormalized counts on VendorProfile)
    const vendorsWithLeads = await this.prisma.vendorProfile.findMany({
      where: {
        status: 'ACTIVE',
        ...(categoryId && { categoryId }),
      },
      select: {
        id: true,
        businessName: true,
        leadCount: true,
        viewCount: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        address: {
          select: {
            city: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        leadCount: 'desc',
      },
      take: limit,
    });

    const topVendors = vendorsWithLeads.map((vendor, index) => {
      const vendorName =
        vendor.businessName ||
        (vendor.user
          ? `${vendor.user.firstName || ''} ${vendor.user.lastName || ''}`.trim()
          : '') ||
        `Vendor ${index + 1}`;

      return {
        vendorProfileId: vendor.id,
        vendorName,
        businessName: vendor.businessName || undefined,
        categoryName: vendor.category?.name || undefined,
        cityName: vendor.address?.city?.name || undefined,
        totalProfileViews: vendor.viewCount,
        totalSearchAppearances: 0,
        totalSearchClicks: 0,
        avgClickThroughRate: 0,
        totalLeadsReceived: vendor.leadCount,
        totalLeadsResponded: 0,
        avgResponseRate: 0,
        avgResponseTime: 0,
        totalLeadsConverted: 0,
        avgConversionRate: 0,
        totalWishlistAdds: 0,
        totalPortfolioViews: 0,
        totalRevenue: 0,
        performanceScore: vendor.leadCount * 5 + vendor.viewCount,
        ranking: index + 1,
      };
    });

    await this.cache.set(cacheKey, topVendors, { ttl: this.CACHE_TTL });
    return topVendors;
  }

  /**
   * Get vendor rankings
   */
  async getVendorRankings(
    days: number = 30,
    limit: number = 100,
  ): Promise<VendorRanking[]> {
    const cacheKey = `${this.CACHE_PREFIX}rankings:${days}:${limit}`;
    const cached = await this.cache.get<VendorRanking[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.prisma.vendorMetrics.groupBy({
      by: ['vendorProfileId'],
      where: {
        date: { gte: startDate },
      },
      _sum: {
        profileViews: true,
        leadsReceived: true,
        leadsConverted: true,
      },
      _avg: {
        conversionRate: true,
      },
      orderBy: {
        _sum: { leadsConverted: 'desc' },
      },
      take: limit,
    });

    const rankings: VendorRanking[] = results.map((r, index) => ({
      vendorProfileId: r.vendorProfileId,
      rank: index + 1,
      score: this.calculateRankingScore(r),
    }));

    await this.cache.set(cacheKey, rankings, { ttl: this.CACHE_TTL });

    return rankings;
  }

  /**
   * Get comparison between vendors
   */
  async compareVendors(
    vendorIds: string[],
    days: number = 30,
  ): Promise<Map<string, VendorPerformanceSummary>> {
    const comparisons = new Map<string, VendorPerformanceSummary>();

    for (const vendorId of vendorIds) {
      const summary = await this.getVendorSummary(vendorId, days);
      if (summary) {
        comparisons.set(vendorId, summary);
      }
    }

    return comparisons;
  }

  /**
   * Get industry benchmarks
   */
  async getIndustryBenchmarks(days: number = 30): Promise<{
    avgProfileViews: number;
    avgLeadsReceived: number;
    avgConversionRate: number;
    avgResponseTime: number;
    avgRevenue: number;
  }> {
    const cacheKey = `${this.CACHE_PREFIX}benchmarks:${days}`;
    const cached = await this.cache.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.prisma.vendorMetrics.aggregate({
      where: {
        date: { gte: startDate },
      },
      _avg: {
        profileViews: true,
        leadsReceived: true,
        conversionRate: true,
        avgResponseTime: true,
        totalRevenue: true,
      },
    });

    const benchmarks = {
      avgProfileViews: Math.round(result._avg.profileViews || 0),
      avgLeadsReceived: Math.round(result._avg.leadsReceived || 0),
      avgConversionRate: result._avg.conversionRate?.toNumber() || 0,
      avgResponseTime: Math.round(result._avg.avgResponseTime || 0),
      avgRevenue: result._avg.totalRevenue?.toNumber() || 0,
    };

    await this.cache.set(cacheKey, benchmarks, { ttl: this.CACHE_TTL });

    return benchmarks;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async incrementMetric(
    vendorProfileId: string,
    field: string,
  ): Promise<void> {
    const today = this.getToday();

    await this.prisma.vendorMetrics.upsert({
      where: {
        vendorProfileId_date: { vendorProfileId, date: today },
      },
      create: {
        vendorProfileId,
        date: today,
        [field]: 1,
      },
      update: {
        [field]: { increment: 1 },
      },
    });

    await this.invalidateCache(vendorProfileId);
  }

  private async recalculateCTR(vendorProfileId: string): Promise<void> {
    const today = this.getToday();

    const metrics = await this.prisma.vendorMetrics.findUnique({
      where: {
        vendorProfileId_date: { vendorProfileId, date: today },
      },
    });

    if (metrics && metrics.searchAppearances > 0) {
      const ctr = metrics.searchClicks / metrics.searchAppearances;

      await this.prisma.vendorMetrics.update({
        where: {
          vendorProfileId_date: { vendorProfileId, date: today },
        },
        data: {
          clickThroughRate: new Decimal(ctr),
        },
      });
    }
  }

  private async recalculateConversionRate(
    vendorProfileId: string,
  ): Promise<void> {
    const today = this.getToday();

    const metrics = await this.prisma.vendorMetrics.findUnique({
      where: {
        vendorProfileId_date: { vendorProfileId, date: today },
      },
    });

    if (metrics && metrics.leadsReceived > 0) {
      const rate = metrics.leadsConverted / metrics.leadsReceived;

      await this.prisma.vendorMetrics.update({
        where: {
          vendorProfileId_date: { vendorProfileId, date: today },
        },
        data: {
          conversionRate: new Decimal(rate),
        },
      });
    }
  }

  private calculatePerformanceScore(metrics: any): number {
    const weights = {
      profileViews: 1,
      leadsReceived: 5,
      leadsConverted: 20,
      conversionRate: 100,
      responseRate: 50,
    };

    let score = 0;
    score += (metrics._sum?.profileViews || 0) * weights.profileViews;
    score += (metrics._sum?.leadsReceived || 0) * weights.leadsReceived;
    score += (metrics._sum?.leadsConverted || 0) * weights.leadsConverted;
    score +=
      (metrics._avg?.conversionRate?.toNumber() || 0) * weights.conversionRate;
    score +=
      (metrics._avg?.responseRate?.toNumber() || 0) * weights.responseRate;

    return Math.round(score);
  }

  private calculateRankingScore(metrics: any): number {
    const leadsConverted = metrics._sum?.leadsConverted || 0;
    const conversionRate = metrics._avg?.conversionRate?.toNumber() || 0;
    const profileViews = metrics._sum?.profileViews || 0;

    return Math.round(
      leadsConverted * 100 + conversionRate * 1000 + profileViews,
    );
  }

  private getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private async invalidateCache(vendorProfileId: string): Promise<void> {
    // Use deletePattern which supports glob patterns
    await Promise.all([
      this.cache.deletePattern(
        `${this.CACHE_PREFIX}summary:${vendorProfileId}:*`,
      ),
      this.cache.deletePattern(`${this.CACHE_PREFIX}top-vendors:*`),
      this.cache.deletePattern(`${this.CACHE_PREFIX}rankings:*`),
      this.cache.deletePattern(`${this.CACHE_PREFIX}benchmarks:*`),
    ]);
  }
}
