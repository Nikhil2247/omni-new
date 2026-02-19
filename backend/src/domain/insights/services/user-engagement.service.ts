// ============================================================================
// USER ENGAGEMENT SERVICE - User Activity Tracking and Analysis
// ============================================================================
// Tracks and aggregates user engagement metrics for retention analysis
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';
import { Prisma } from '@prisma/client';

export interface EngagementMetrics {
  userId: string;
  date: Date;
  sessionCount: number;
  totalDuration: number;
  profileViews: number;
  searchCount: number;
  leadsSent: number;
  messagesSent: number;
  wishlistAdds: number;
  checklistUpdates: number;
  budgetUpdates: number;
}

export interface UserEngagementSummary {
  userId: string;
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;
  totalProfileViews: number;
  totalSearches: number;
  totalLeadsSent: number;
  totalMessagesSent: number;
  engagementScore: number;
  lastActiveDate: Date;
  activeDays: number;
}

export interface EngagementTrend {
  date: Date;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  totalSearches: number;
  totalLeads: number;
}

export interface RetentionCohort {
  cohortDate: Date;
  cohortSize: number;
  retentionByWeek: number[];
  retentionByMonth: number[];
}

@Injectable()
export class UserEngagementService {
  private readonly logger = new Logger(UserEngagementService.name);
  private readonly CACHE_PREFIX = 'engagement:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
  ) {}

  // ============================================================================
  // TRACKING METHODS
  // ============================================================================

  /**
   * Track a user session
   */
  async trackSession(userId: string, durationSeconds: number): Promise<void> {
    const today = this.getToday();

    await this.prisma.userEngagement.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      create: {
        userId,
        date: today,
        sessionCount: 1,
        totalDuration: durationSeconds,
      },
      update: {
        sessionCount: { increment: 1 },
        totalDuration: { increment: durationSeconds },
      },
    });

    await this.invalidateCache(userId);
  }

  /**
   * Track profile view activity
   */
  async trackProfileView(userId: string): Promise<void> {
    await this.incrementMetric(userId, 'profileViews');
  }

  /**
   * Track search activity
   */
  async trackSearch(userId: string): Promise<void> {
    await this.incrementMetric(userId, 'searchCount');
  }

  /**
   * Track lead sent
   */
  async trackLeadSent(userId: string): Promise<void> {
    await this.incrementMetric(userId, 'leadsSent');
  }

  /**
   * Track message sent
   */
  async trackMessageSent(userId: string): Promise<void> {
    await this.incrementMetric(userId, 'messagesSent');
  }

  /**
   * Track wishlist addition
   */
  async trackWishlistAdd(userId: string): Promise<void> {
    await this.incrementMetric(userId, 'wishlistAdds');
  }

  /**
   * Track checklist update
   */
  async trackChecklistUpdate(userId: string): Promise<void> {
    await this.incrementMetric(userId, 'checklistUpdates');
  }

  /**
   * Track budget update
   */
  async trackBudgetUpdate(userId: string): Promise<void> {
    await this.incrementMetric(userId, 'budgetUpdates');
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get user engagement for a specific date range
   */
  async getUserEngagement(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EngagementMetrics[]> {
    const engagements = await this.prisma.userEngagement.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return engagements.map((e) => ({
      userId: e.userId,
      date: e.date,
      sessionCount: e.sessionCount,
      totalDuration: e.totalDuration,
      profileViews: e.profileViews,
      searchCount: e.searchCount,
      leadsSent: e.leadsSent,
      messagesSent: e.messagesSent,
      wishlistAdds: e.wishlistAdds,
      checklistUpdates: e.checklistUpdates,
      budgetUpdates: e.budgetUpdates,
    }));
  }

  /**
   * Get user engagement summary
   */
  async getUserSummary(userId: string): Promise<UserEngagementSummary | null> {
    const cacheKey = `${this.CACHE_PREFIX}summary:${userId}`;
    const cached = await this.cache.get<UserEngagementSummary>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.prisma.userEngagement.aggregate({
      where: { userId },
      _sum: {
        sessionCount: true,
        totalDuration: true,
        profileViews: true,
        searchCount: true,
        leadsSent: true,
        messagesSent: true,
        wishlistAdds: true,
        checklistUpdates: true,
        budgetUpdates: true,
      },
      _count: { id: true },
      _max: { date: true },
    });

    if (!result._count.id) {
      return null;
    }

    const summary: UserEngagementSummary = {
      userId,
      totalSessions: result._sum.sessionCount || 0,
      totalDuration: result._sum.totalDuration || 0,
      averageSessionDuration:
        result._sum.sessionCount && result._sum.totalDuration
          ? Math.round(result._sum.totalDuration / result._sum.sessionCount)
          : 0,
      totalProfileViews: result._sum.profileViews || 0,
      totalSearches: result._sum.searchCount || 0,
      totalLeadsSent: result._sum.leadsSent || 0,
      totalMessagesSent: result._sum.messagesSent || 0,
      engagementScore: this.calculateEngagementScore(result._sum),
      lastActiveDate: result._max.date || new Date(),
      activeDays: result._count.id,
    };

    await this.cache.set(cacheKey, summary, { ttl: this.CACHE_TTL });

    return summary;
  }

  /**
   * Get engagement trends over time
   */
  async getEngagementTrends(
    startDate: Date,
    endDate: Date,
  ): Promise<EngagementTrend[]> {
    const cacheKey = `${this.CACHE_PREFIX}trends:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await this.cache.get<EngagementTrend[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const results = await this.prisma.userEngagement.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { userId: true },
      _sum: {
        sessionCount: true,
        totalDuration: true,
        searchCount: true,
        leadsSent: true,
      },
      orderBy: { date: 'asc' },
    });

    const trends: EngagementTrend[] = results.map((r) => ({
      date: r.date,
      activeUsers: r._count.userId,
      totalSessions: r._sum.sessionCount || 0,
      avgSessionDuration:
        r._sum.sessionCount && r._sum.totalDuration
          ? Math.round(r._sum.totalDuration / r._sum.sessionCount)
          : 0,
      totalSearches: r._sum.searchCount || 0,
      totalLeads: r._sum.leadsSent || 0,
    }));

    await this.cache.set(cacheKey, trends, { ttl: this.CACHE_TTL });

    return trends;
  }

  /**
   * Get top engaged users
   */
  async getTopEngagedUsers(
    limit: number = 10,
    days: number = 30,
  ): Promise<UserEngagementSummary[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: {
        date: { gte: startDate },
      },
      _sum: {
        sessionCount: true,
        totalDuration: true,
        profileViews: true,
        searchCount: true,
        leadsSent: true,
        messagesSent: true,
      },
      _count: { id: true },
      _max: { date: true },
      orderBy: {
        _sum: { sessionCount: 'desc' },
      },
      take: limit,
    });

    return results.map((r) => ({
      userId: r.userId,
      totalSessions: r._sum.sessionCount || 0,
      totalDuration: r._sum.totalDuration || 0,
      averageSessionDuration:
        r._sum.sessionCount && r._sum.totalDuration
          ? Math.round(r._sum.totalDuration / r._sum.sessionCount)
          : 0,
      totalProfileViews: r._sum.profileViews || 0,
      totalSearches: r._sum.searchCount || 0,
      totalLeadsSent: r._sum.leadsSent || 0,
      totalMessagesSent: r._sum.messagesSent || 0,
      engagementScore: this.calculateEngagementScore(r._sum),
      lastActiveDate: r._max.date || new Date(),
      activeDays: r._count.id,
    }));
  }

  /**
   * Get retention cohorts
   */
  async getRetentionCohorts(weeks: number = 8): Promise<RetentionCohort[]> {
    const cohorts: RetentionCohort[] = [];
    const today = new Date();

    for (let week = 0; week < weeks; week++) {
      const cohortStart = new Date(today);
      cohortStart.setDate(cohortStart.getDate() - (week + 1) * 7);
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setDate(cohortEnd.getDate() + 7);

      // Get users who were first active in this week
      const cohortUsers = await this.prisma.userEngagement.groupBy({
        by: ['userId'],
        where: {
          date: {
            gte: cohortStart,
            lt: cohortEnd,
          },
        },
        _min: { date: true },
      });

      const cohortUserIds = cohortUsers
        .filter(
          (u) =>
            u._min.date &&
            u._min.date >= cohortStart &&
            u._min.date < cohortEnd,
        )
        .map((u) => u.userId);

      const cohortSize = cohortUserIds.length;

      if (cohortSize === 0) {
        continue;
      }

      // Calculate retention for each subsequent week
      const retentionByWeek: number[] = [];
      for (let w = 1; w <= weeks - week; w++) {
        const periodStart = new Date(cohortEnd);
        periodStart.setDate(periodStart.getDate() + (w - 1) * 7);
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);

        if (periodStart > today) break;

        const activeInPeriod = await this.prisma.userEngagement.groupBy({
          by: ['userId'],
          where: {
            userId: { in: cohortUserIds },
            date: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
        });

        retentionByWeek.push(
          Math.round((activeInPeriod.length / cohortSize) * 100),
        );
      }

      cohorts.push({
        cohortDate: cohortStart,
        cohortSize,
        retentionByWeek,
        retentionByMonth: [], // Can be calculated similarly
      });
    }

    return cohorts;
  }

  /**
   * Get daily active users (DAU)
   */
  async getDailyActiveUsers(date?: Date): Promise<number> {
    const targetDate = date || this.getToday();

    const result = await this.prisma.userEngagement.groupBy({
      by: ['userId'],
      where: { date: targetDate },
    });

    return result.length;
  }

  /**
   * Get weekly active users (WAU)
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
   * Get monthly active users (MAU)
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

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async incrementMetric(
    userId: string,
    field: keyof Prisma.UserEngagementUpdateInput,
  ): Promise<void> {
    const today = this.getToday();

    await this.prisma.userEngagement.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      create: {
        userId,
        date: today,
        [field]: 1,
      },
      update: {
        [field]: { increment: 1 },
      },
    });

    await this.invalidateCache(userId);
  }

  private calculateEngagementScore(metrics: {
    sessionCount?: number | null;
    totalDuration?: number | null;
    profileViews?: number | null;
    searchCount?: number | null;
    leadsSent?: number | null;
    messagesSent?: number | null;
    wishlistAdds?: number | null;
    checklistUpdates?: number | null;
    budgetUpdates?: number | null;
  }): number {
    // Weighted engagement score calculation
    const weights = {
      sessionCount: 10,
      totalDuration: 0.01, // Per second
      profileViews: 2,
      searchCount: 3,
      leadsSent: 15,
      messagesSent: 5,
      wishlistAdds: 5,
      checklistUpdates: 3,
      budgetUpdates: 3,
    };

    let score = 0;
    score += (metrics.sessionCount || 0) * weights.sessionCount;
    score += (metrics.totalDuration || 0) * weights.totalDuration;
    score += (metrics.profileViews || 0) * weights.profileViews;
    score += (metrics.searchCount || 0) * weights.searchCount;
    score += (metrics.leadsSent || 0) * weights.leadsSent;
    score += (metrics.messagesSent || 0) * weights.messagesSent;
    score += (metrics.wishlistAdds || 0) * weights.wishlistAdds;
    score += (metrics.checklistUpdates || 0) * weights.checklistUpdates;
    score += (metrics.budgetUpdates || 0) * weights.budgetUpdates;

    return Math.round(score);
  }

  private getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private async invalidateCache(userId: string): Promise<void> {
    await this.cache.delete(`${this.CACHE_PREFIX}summary:${userId}`);
  }
}
