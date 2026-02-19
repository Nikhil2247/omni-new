// ============================================================================
// PLATFORM METRICS SERVICE - Platform-wide Analytics
// ============================================================================
// Aggregates and provides platform-wide metrics for admin dashboards
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';
import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;

export interface DailyPlatformMetrics {
  date: Date;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  returningUsers: number;
  totalVendors: number;
  newVendors: number;
  activeVendors: number;
  verifiedVendors: number;
  totalLeads: number;
  leadsConverted: number;
  avgLeadValue: number | null;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number | null;
  bounceRate: number | null;
  totalSearches: number;
  zeroResultSearches: number;
  eventsCreated: number;
  eventsCompleted: number;
}

export interface PlatformOverview {
  // Current totals
  totalUsers: number;
  totalVendors: number;
  totalEvents: number;
  totalLeads: number;

  // Growth metrics (vs previous period)
  userGrowth: number;
  vendorGrowth: number;
  eventGrowth: number;
  leadGrowth: number;

  // Activity metrics
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;

  // Health metrics
  avgConversionRate: number;
  avgResponseTime: number;
  platformHealth: number;

  // Revenue metrics
  totalRevenue: number;
  revenueGrowth: number;
}

export interface GrowthMetrics {
  period: string;
  users: { current: number; previous: number; growth: number };
  vendors: { current: number; previous: number; growth: number };
  leads: { current: number; previous: number; growth: number };
  events: { current: number; previous: number; growth: number };
  revenue: { current: number; previous: number; growth: number };
}

export interface GeographicDistribution {
  countryCode: string;
  countryName: string;
  userCount: number;
  vendorCount: number;
  eventCount: number;
  percentage: number;
}

export interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  vendorCount: number;
  leadCount: number;
  avgRating: number;
  percentage: number;
}

export interface TimeSeriesData {
  date: Date;
  value: number;
}

@Injectable()
export class PlatformMetricsService {
  private readonly logger = new Logger(PlatformMetricsService.name);
  private readonly CACHE_PREFIX = 'platform-metrics:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
  ) {}

  // ============================================================================
  // OVERVIEW METHODS
  // ============================================================================

  /**
   * Get platform overview for admin dashboard
   */
  async getPlatformOverview(): Promise<PlatformOverview> {
    const cacheKey = `${this.CACHE_PREFIX}overview`;
    const cached = await this.cache.get<PlatformOverview>(cacheKey);

    if (cached) {
      return cached;
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get current totals
    const [totalUsers, totalVendors, totalEvents, totalLeads] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.vendorProfile.count(),
        this.prisma.event.count(),
        this.prisma.lead.count(),
      ]);

    // Get previous period totals for growth calculation
    const [prevUsers, prevVendors, prevEvents, prevLeads] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
      this.prisma.vendorProfile.count({
        where: { createdAt: { lte: thirtyDaysAgo } },
      }),
      this.prisma.event.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
      this.prisma.lead.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
    ]);

    // Get active user counts
    const [dau, wau, mau] = await Promise.all([
      this.getDailyActiveUsers(),
      this.getWeeklyActiveUsers(),
      this.getMonthlyActiveUsers(),
    ]);

    // Get health metrics
    const healthMetrics = await this.getHealthMetrics();

    // Get revenue metrics from vendor metrics
    const [currentRevenue, previousRevenue] = await Promise.all([
      this.prisma.vendorMetrics.aggregate({
        where: { date: { gte: thirtyDaysAgo } },
        _sum: { totalRevenue: true },
      }),
      this.prisma.vendorMetrics.aggregate({
        where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { totalRevenue: true },
      }),
    ]);

    const totalRevenue = currentRevenue._sum.totalRevenue?.toNumber() || 0;
    const prevRevenue = previousRevenue._sum.totalRevenue?.toNumber() || 0;

    const overview: PlatformOverview = {
      totalUsers,
      totalVendors,
      totalEvents,
      totalLeads,
      userGrowth: this.calculateGrowth(totalUsers, prevUsers),
      vendorGrowth: this.calculateGrowth(totalVendors, prevVendors),
      eventGrowth: this.calculateGrowth(totalEvents, prevEvents),
      leadGrowth: this.calculateGrowth(totalLeads, prevLeads),
      dailyActiveUsers: dau,
      weeklyActiveUsers: wau,
      monthlyActiveUsers: mau,
      avgConversionRate: healthMetrics.avgConversionRate,
      avgResponseTime: healthMetrics.avgResponseTime,
      platformHealth: healthMetrics.healthScore,
      totalRevenue,
      revenueGrowth: this.calculateGrowth(totalRevenue, prevRevenue),
    };

    await this.cache.set(cacheKey, overview, { ttl: this.CACHE_TTL });

    return overview;
  }

  /**
   * Get daily platform metrics for a date range
   */
  async getDailyMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyPlatformMetrics[]> {
    const metrics = await this.prisma.platformMetrics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return metrics.map((m) => ({
      date: m.date,
      totalUsers: m.totalUsers,
      newUsers: m.newUsers,
      activeUsers: m.activeUsers,
      returningUsers: m.returningUsers,
      totalVendors: m.totalVendors,
      newVendors: m.newVendors,
      activeVendors: m.activeVendors,
      verifiedVendors: m.verifiedVendors,
      totalLeads: m.totalLeads,
      leadsConverted: m.leadsConverted,
      avgLeadValue: m.avgLeadValue?.toNumber() ?? null,
      totalSessions: m.totalSessions,
      totalPageViews: m.totalPageViews,
      avgSessionDuration: m.avgSessionDuration,
      bounceRate: m.bounceRate?.toNumber() ?? null,
      totalSearches: m.totalSearches,
      zeroResultSearches: m.zeroResultSearches,
      eventsCreated: m.eventsCreated,
      eventsCompleted: m.eventsCompleted,
    }));
  }

  // ============================================================================
  // GROWTH METRICS
  // ============================================================================

  /**
   * Get growth metrics comparing periods
   */
  async getGrowthMetrics(
    period: 'day' | 'week' | 'month' = 'month',
  ): Promise<GrowthMetrics> {
    const cacheKey = `${this.CACHE_PREFIX}growth:${period}`;
    const cached = await this.cache.get<GrowthMetrics>(cacheKey);

    if (cached) {
      return cached;
    }

    const today = new Date();
    let periodDays: number;

    switch (period) {
      case 'day':
        periodDays = 1;
        break;
      case 'week':
        periodDays = 7;
        break;
      case 'month':
      default:
        periodDays = 30;
    }

    const currentStart = new Date(today);
    currentStart.setDate(currentStart.getDate() - periodDays);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - periodDays);

    // Current period counts
    const [currentUsers, currentVendors, currentLeads, currentEvents] =
      await Promise.all([
        this.prisma.user.count({
          where: { createdAt: { gte: currentStart, lte: today } },
        }),
        this.prisma.vendorProfile.count({
          where: { createdAt: { gte: currentStart, lte: today } },
        }),
        this.prisma.lead.count({
          where: { createdAt: { gte: currentStart, lte: today } },
        }),
        this.prisma.event.count({
          where: { createdAt: { gte: currentStart, lte: today } },
        }),
      ]);

    // Previous period counts
    const [prevUsers, prevVendors, prevLeads, prevEvents] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.vendorProfile.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.lead.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.event.count({
        where: { createdAt: { gte: previousStart, lt: currentStart } },
      }),
    ]);

    const growth: GrowthMetrics = {
      period,
      users: {
        current: currentUsers,
        previous: prevUsers,
        growth: this.calculateGrowth(currentUsers, prevUsers),
      },
      vendors: {
        current: currentVendors,
        previous: prevVendors,
        growth: this.calculateGrowth(currentVendors, prevVendors),
      },
      leads: {
        current: currentLeads,
        previous: prevLeads,
        growth: this.calculateGrowth(currentLeads, prevLeads),
      },
      events: {
        current: currentEvents,
        previous: prevEvents,
        growth: this.calculateGrowth(currentEvents, prevEvents),
      },
      revenue: {
        current: 0, // Would need payment integration
        previous: 0,
        growth: 0,
      },
    };

    await this.cache.set(cacheKey, growth, { ttl: this.CACHE_TTL });

    return growth;
  }

  // ============================================================================
  // ACTIVITY METRICS
  // ============================================================================

  /**
   * Get daily active users
   */
  async getDailyActiveUsers(date?: Date): Promise<number> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return result.length;
  }

  /**
   * Get weekly active users
   */
  async getWeeklyActiveUsers(endDate?: Date): Promise<number> {
    const end = endDate || new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    const result = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return result.length;
  }

  /**
   * Get monthly active users
   */
  async getMonthlyActiveUsers(endDate?: Date): Promise<number> {
    const end = endDate || new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);

    const result = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return result.length;
  }

  /**
   * Get user activity time series
   */
  async getUserActivityTimeSeries(
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesData[]> {
    const results = await this.prisma.userEngagement.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { userId: true },
      orderBy: { date: 'asc' },
    });

    return results.map((r) => ({
      date: r.date,
      value: r._count.userId,
    }));
  }

  // ============================================================================
  // DISTRIBUTION METRICS
  // ============================================================================

  /**
   * Get user type distribution
   */
  async getUserTypeDistribution(): Promise<
    Array<{ type: string; count: number; percentage: number }>
  > {
    const cacheKey = `${this.CACHE_PREFIX}user-distribution`;
    const cached = await this.cache.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const results = await this.prisma.user.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    const distribution = results.map((r) => ({
      type: r.status,
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    }));

    await this.cache.set(cacheKey, distribution, { ttl: this.CACHE_TTL });

    return distribution;
  }

  /**
   * Get vendor verification status distribution
   */
  async getVendorVerificationDistribution(): Promise<
    Array<{ status: string; count: number; percentage: number }>
  > {
    const cacheKey = `${this.CACHE_PREFIX}vendor-verification-distribution`;
    const cached = await this.cache.get<any[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const results = await this.prisma.vendorProfile.groupBy({
      by: ['status'] as any,
      _count: { id: true },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    const distribution = results.map((r) => ({
      status: r.status,
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    }));

    await this.cache.set(cacheKey, distribution, { ttl: this.CACHE_TTL });

    return distribution;
  }

  /**
   * Get lead status distribution
   */
  async getLeadStatusDistribution(): Promise<
    Array<{ status: string; count: number; percentage: number }>
  > {
    const results = await this.prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    return results.map((r) => ({
      status: r.status,
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    }));
  }

  /**
   * Get event status distribution
   */
  async getEventStatusDistribution(): Promise<
    Array<{ status: string; count: number; percentage: number }>
  > {
    const results = await this.prisma.event.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    return results.map((r) => ({
      status: r.status,
      count: r._count.id,
      percentage: total > 0 ? Math.round((r._count.id / total) * 100) : 0,
    }));
  }

  // ============================================================================
  // SEARCH ANALYTICS
  // ============================================================================

  // ============================================================================
  // REAL-TIME METRICS
  // ============================================================================

  /**
   * Get searches in the last hour
   */
  async getSearchesLastHour(): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return this.prisma.searchQuery.count({
      where: { createdAt: { gte: oneHourAgo } },
    });
  }

  /**
   * Get leads created in the last hour
   */
  async getLeadsLastHour(): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return this.prisma.lead.count({
      where: { createdAt: { gte: oneHourAgo } },
    });
  }

  /**
   * Get pending leads count (NEW status leads that haven't been contacted)
   */
  async getPendingLeadsCount(): Promise<number> {
    return this.prisma.lead.count({
      where: { status: 'NEW' },
    });
  }

  /**
   * Get ongoing events count (events happening today - IN_PROGRESS)
   */
  async getOngoingEventsCount(): Promise<number> {
    return this.prisma.event.count({
      where: {
        status: 'IN_PROGRESS',
      },
    });
  }

  /**
   * Get active events (PLANNING or CONFIRMED status)
   */
  async getActiveEventsCount(): Promise<number> {
    return this.prisma.event.count({
      where: {
        status: { in: ['PLANNING', 'CONFIRMED'] },
      },
    });
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(days: number = 30): Promise<{
    totalSearches: number;
    uniqueSearchers: number;
    avgSearchesPerUser: number;
    topSearchTerms: Array<{ term: string; count: number }>;
    zeroResultRate: number;
  }> {
    const cacheKey = `${this.CACHE_PREFIX}search-analytics:${days}`;
    const cached = await this.cache.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalSearches, uniqueSearchers, topTerms, zeroResults] =
      await Promise.all([
        this.prisma.searchQuery.count({
          where: { createdAt: { gte: startDate } },
        }),
        this.prisma.searchQuery.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: startDate }, userId: { not: null } },
        }),
        this.prisma.searchQuery.groupBy({
          by: ['query'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 20,
        }),
        this.prisma.searchQuery.count({
          where: {
            createdAt: { gte: startDate },
            hasResults: false,
          },
        }),
      ]);

    const analytics = {
      totalSearches,
      uniqueSearchers: uniqueSearchers.length,
      avgSearchesPerUser:
        uniqueSearchers.length > 0
          ? Math.round(totalSearches / uniqueSearchers.length)
          : 0,
      topSearchTerms: topTerms.map((t) => ({
        term: t.query,
        count: t._count.id,
      })),
      zeroResultRate:
        totalSearches > 0 ? Math.round((zeroResults / totalSearches) * 100) : 0,
    };

    await this.cache.set(cacheKey, analytics, { ttl: this.CACHE_TTL });

    return analytics;
  }

  // ============================================================================
  // AGGREGATION METHODS (for scheduled jobs)
  // ============================================================================

  /**
   * Aggregate and store daily platform metrics
   */
  async aggregateDailyMetrics(date?: Date): Promise<void> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const previousDay = new Date(targetDate);
    previousDay.setDate(previousDay.getDate() - 1);

    // Calculate all metrics
    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalVendors,
      newVendors,
      activeVendors,
      verifiedVendors,
      totalLeads,
      leadMetrics,
      sessionMetrics,
      searchMetrics,
      eventMetrics,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { lte: endOfDay } } }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.getDailyActiveUsers(targetDate),
      this.prisma.vendorProfile.count({
        where: { createdAt: { lte: endOfDay } },
      }),
      this.prisma.vendorProfile.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.prisma.vendorMetrics.groupBy({
        by: ['vendorProfileId'],
        where: { date: targetDate },
      }),
      this.prisma.vendorProfile.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.lead.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.prisma.lead.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: 'QUALIFIED' as any,
        },
        _count: { id: true },
        _avg: { budget: true },
      }),
      this.prisma.userEngagement.aggregate({
        where: { date: targetDate },
        _sum: { sessionCount: true, totalDuration: true },
        _count: { userId: true },
      }),
      this.prisma.searchQuery.aggregate({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        _count: { id: true },
      }),
      this.prisma.event.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
        _count: { id: true },
      }),
    ]);

    // Calculate returning users
    const previousDayUsers = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: { date: previousDay },
    });

    const todayUsers = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: { date: targetDate },
    });

    const previousUserIds = new Set(previousDayUsers.map((u) => u.userId));
    const returningUsers = todayUsers.filter((u) =>
      previousUserIds.has(u.userId),
    ).length;

    // Calculate search zero results
    const zeroResultSearches = await this.prisma.searchQuery.count({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        hasResults: false,
      },
    });

    // Upsert daily metrics
    await this.prisma.platformMetrics.upsert({
      where: { date: targetDate },
      create: {
        date: targetDate,
        totalUsers,
        newUsers,
        activeUsers,
        returningUsers,
        totalVendors,
        newVendors,
        activeVendors: activeVendors.length,
        verifiedVendors,
        totalLeads,
        leadsConverted: leadMetrics._count.id,
        avgLeadValue: leadMetrics._avg.budget
          ? new Decimal(leadMetrics._avg.budget.toNumber())
          : null,
        totalSessions: sessionMetrics._sum.sessionCount || 0,
        totalPageViews: 0, // Would need page view tracking
        avgSessionDuration:
          sessionMetrics._sum.sessionCount && sessionMetrics._sum.totalDuration
            ? Math.round(
                sessionMetrics._sum.totalDuration /
                  sessionMetrics._sum.sessionCount,
              )
            : null,
        bounceRate: null, // Would need bounce rate calculation
        totalSearches: searchMetrics._count.id,
        zeroResultSearches,
        eventsCreated:
          eventMetrics.find((e) => e.status === ('UPCOMING' as any))?._count
            .id || 0,
        eventsCompleted:
          eventMetrics.find((e) => e.status === 'COMPLETED')?._count.id || 0,
      },
      update: {
        totalUsers,
        newUsers,
        activeUsers,
        returningUsers,
        totalVendors,
        newVendors,
        activeVendors: activeVendors.length,
        verifiedVendors,
        totalLeads,
        leadsConverted: leadMetrics._count.id,
        avgLeadValue: leadMetrics._avg.budget
          ? new Decimal(leadMetrics._avg.budget.toNumber())
          : null,
        totalSessions: sessionMetrics._sum.sessionCount || 0,
        avgSessionDuration:
          sessionMetrics._sum.sessionCount && sessionMetrics._sum.totalDuration
            ? Math.round(
                sessionMetrics._sum.totalDuration /
                  sessionMetrics._sum.sessionCount,
              )
            : null,
        totalSearches: searchMetrics._count.id,
        zeroResultSearches,
        eventsCreated:
          eventMetrics.find((e) => e.status === ('UPCOMING' as any))?._count
            .id || 0,
        eventsCompleted:
          eventMetrics.find((e) => e.status === 'COMPLETED')?._count.id || 0,
      },
    });

    this.logger.log(`Daily metrics aggregated for ${targetDate.toISOString()}`);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  private async getHealthMetrics(): Promise<{
    avgConversionRate: number;
    avgResponseTime: number;
    healthScore: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const vendorMetrics = await this.prisma.vendorMetrics.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _avg: {
        conversionRate: true,
        avgResponseTime: true,
      },
    });

    const avgConversionRate =
      vendorMetrics._avg.conversionRate?.toNumber() || 0;
    const avgResponseTime = vendorMetrics._avg.avgResponseTime || 0;

    // Calculate health score (0-100)
    let healthScore = 50; // Base score

    // Add points for conversion rate (max 25)
    healthScore += Math.min(avgConversionRate * 100, 25);

    // Add points for response time (max 25) - lower is better
    if (avgResponseTime > 0) {
      healthScore += Math.max(25 - avgResponseTime / 60, 0); // Penalize for slow responses
    } else {
      healthScore += 25;
    }

    return {
      avgConversionRate: Math.round(avgConversionRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      healthScore: Math.min(Math.round(healthScore), 100),
    };
  }
}
