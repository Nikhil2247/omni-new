import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../core/database/prisma.service';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';

/**
 * Platform-wide counts for easy frontend access
 */
export interface PlatformCounts {
  // Users
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  verifiedUsers: number;

  // Vendors
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  verifiedVendors: number;

  // Leads
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;

  // Events
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;

  // Content
  totalCategories: number;
  totalServices: number;
  totalPortfolios: number;
  totalReviews: number;
  approvedReviews: number;

  // Engagement
  totalSearches: number;
  totalProfileViews: number;
  totalMessages: number;

  // Funnels (Last 30 Days)
  vendorDiscoveryStarted: number;
  vendorDiscoveryCompleted: number;
  userSignupStarted: number;
  userSignupCompleted: number;
  vendorOnboardingStarted: number;
  vendorOnboardingCompleted: number;
  eventPlanningStarted: number;
  eventPlanningCompleted: number;

  // System
  lastUpdated: Date;
  updateDuration: number; // milliseconds
}

/**
 * Funnel conversion rates
 */
export interface FunnelConversionRates {
  vendorDiscovery: number;
  userSignup: number;
  vendorOnboarding: number;
  eventPlanning: number;
}

/**
 * Automated Counts Service
 * Automatically counts and caches platform metrics every 5 minutes
 */
@Injectable()
export class AutomatedCountsService {
  private readonly logger = new Logger(AutomatedCountsService.name);
  private readonly CACHE_KEY = 'platform:counts';
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly FUNNEL_CACHE_KEY = 'platform:funnel-rates';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
  ) {}

  /**
   * Initialize on module startup
   */
  async onModuleInit() {
    // Generate initial counts
    await this.generateAndCacheCounts();
  }

  /**
   * Scheduled job - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledCountUpdate() {
    this.logger.log('Running scheduled count update');
    try {
      await this.generateAndCacheCounts();
      this.logger.log('Scheduled count update completed successfully');
    } catch (error) {
      this.logger.error('Scheduled count update failed', error.stack);
    }
  }

  /**
   * Get counts (from cache or generate)
   */
  async getCounts(): Promise<PlatformCounts> {
    // Try cache first
    const cached = await this.cache.get<PlatformCounts>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Generate if not cached
    return this.generateAndCacheCounts();
  }

  /**
   * Force refresh counts
   */
  async refreshCounts(): Promise<PlatformCounts> {
    return this.generateAndCacheCounts();
  }

  /**
   * Get count for a specific entity
   */
  async getEntityCount(
    entity:
      | 'users'
      | 'vendors'
      | 'leads'
      | 'events'
      | 'categories'
      | 'services'
      | 'portfolios'
      | 'reviews',
  ): Promise<number> {
    const counts = await this.getCounts();
    const entityMap = {
      users: counts.totalUsers,
      vendors: counts.totalVendors,
      leads: counts.totalLeads,
      events: counts.totalEvents,
      categories: counts.totalCategories,
      services: counts.totalServices,
      portfolios: counts.totalPortfolios,
      reviews: counts.totalReviews,
    };
    return entityMap[entity];
  }

  /**
   * Get funnel conversion rates
   */
  async getFunnelConversionRates(): Promise<FunnelConversionRates> {
    const cached = await this.cache.get<FunnelConversionRates>(
      this.FUNNEL_CACHE_KEY,
    );
    if (cached) {
      return cached;
    }

    const counts = await this.getCounts();
    const rates = {
      vendorDiscovery:
        counts.vendorDiscoveryStarted > 0
          ? (counts.vendorDiscoveryCompleted / counts.vendorDiscoveryStarted) *
            100
          : 0,
      userSignup:
        counts.userSignupStarted > 0
          ? (counts.userSignupCompleted / counts.userSignupStarted) * 100
          : 0,
      vendorOnboarding:
        counts.vendorOnboardingStarted > 0
          ? (counts.vendorOnboardingCompleted /
              counts.vendorOnboardingStarted) *
            100
          : 0,
      eventPlanning:
        counts.eventPlanningStarted > 0
          ? (counts.eventPlanningCompleted / counts.eventPlanningStarted) * 100
          : 0,
    };

    await this.cache.set(this.FUNNEL_CACHE_KEY, rates, { ttl: this.CACHE_TTL });
    return rates;
  }

  /**
   * Generate and cache all counts
   */
  private async generateAndCacheCounts(): Promise<PlatformCounts> {
    const startTime = Date.now();

    // Run all counts in parallel for speed
    const [
      userCounts,
      vendorCounts,
      leadCounts,
      eventCounts,
      contentCounts,
      engagementCounts,
      funnelCounts,
    ] = await Promise.all([
      this.getUserCounts(),
      this.getVendorCounts(),
      this.getLeadCounts(),
      this.getEventCounts(),
      this.getContentCounts(),
      this.getEngagementCounts(),
      this.getFunnelCounts(),
    ]);

    const counts: PlatformCounts = {
      ...userCounts,
      ...vendorCounts,
      ...leadCounts,
      ...eventCounts,
      ...contentCounts,
      ...engagementCounts,
      ...funnelCounts,
      lastUpdated: new Date(),
      updateDuration: Date.now() - startTime,
    };

    // Cache for 5 minutes
    await this.cache.set(this.CACHE_KEY, counts, { ttl: this.CACHE_TTL });

    return counts;
  }

  /**
   * Count users by status
   */
  private async getUserCounts() {
    const [totalUsers, activeUsers, pendingUsers, verifiedUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.user.count({
          where: { status: 'PENDING' },
        }),
        this.prisma.user.count({
          where: { emailVerified: true },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      verifiedUsers,
    };
  }

  /**
   * Count vendors by status
   */
  private async getVendorCounts() {
    const [totalVendors, activeVendors, pendingVendors, verifiedVendors] =
      await Promise.all([
        this.prisma.vendorProfile.count(),
        this.prisma.vendorProfile.count({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.vendorProfile.count({
          where: { status: 'PENDING_REVIEW' },
        }),
        this.prisma.vendorProfile.count({
          where: { verifiedAt: { not: null } },
        }),
      ]);

    return {
      totalVendors,
      activeVendors,
      pendingVendors,
      verifiedVendors,
    };
  }

  /**
   * Count leads by status
   */
  private async getLeadCounts() {
    const [totalLeads, newLeads, contactedLeads, convertedLeads] =
      await Promise.all([
        this.prisma.lead.count(),
        this.prisma.lead.count({
          where: { status: 'NEW' },
        }),
        this.prisma.lead.count({
          where: { status: 'CONTACTED' },
        }),
        this.prisma.lead.count({
          where: { status: 'WON' },
        }),
      ]);

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
    };
  }

  /**
   * Count events by status
   */
  private async getEventCounts() {
    const now = new Date();
    const [totalEvents, upcomingEvents, completedEvents] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.count({
        where: {
          date: { gte: now },
          status: { in: ['PLANNING', 'CONFIRMED'] },
        },
      }),
      this.prisma.event.count({
        where: { status: 'COMPLETED' },
      }),
    ]);

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
    };
  }

  /**
   * Count content items
   */
  private async getContentCounts() {
    const [
      totalCategories,
      totalServices,
      totalPortfolios,
      totalReviews,
      approvedReviews,
    ] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.service.count(),
      this.prisma.portfolio.count(),
      this.prisma.vendorReview.count(),
      this.prisma.vendorReview.count({
        where: { status: 'APPROVED' },
      }),
    ]);

    return {
      totalCategories,
      totalServices,
      totalPortfolios,
      totalReviews,
      approvedReviews,
    };
  }

  /**
   * Count engagement metrics
   */
  private async getEngagementCounts() {
    const [totalProfileViews, totalMessages] = await Promise.all([
      this.prisma.profileView.count(),
      this.prisma.message.count(),
    ]);

    return {
      totalSearches: 0, // TODO: Implement search tracking
      totalProfileViews,
      totalMessages,
    };
  }

  /**
   * Count funnel events (last 30 days)
   */
  private async getFunnelCounts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      vendorDiscoveryStarted,
      vendorDiscoveryCompleted,
      userSignupStarted,
      userSignupCompleted,
      vendorOnboardingStarted,
      vendorOnboardingCompleted,
      eventPlanningStarted,
      eventPlanningCompleted,
    ] = await Promise.all([
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'vendor_discovery',
          stepName: 'search',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'vendor_discovery',
          stepName: 'contact',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'user_signup',
          stepName: 'start',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'user_signup',
          stepName: 'complete',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'vendor_onboarding',
          stepName: 'start',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'vendor_onboarding',
          stepName: 'complete',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'event_planning',
          stepName: 'create_event',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.funnelEvent.count({
        where: {
          funnelName: 'event_planning',
          stepName: 'finalize',
          timestamp: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      vendorDiscoveryStarted,
      vendorDiscoveryCompleted,
      userSignupStarted,
      userSignupCompleted,
      vendorOnboardingStarted,
      vendorOnboardingCompleted,
      eventPlanningStarted,
      eventPlanningCompleted,
    };
  }
}
