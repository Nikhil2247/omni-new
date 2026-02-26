import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Funnel Definition Interface
 * Defines the steps in a conversion funnel
 */
export interface FunnelDefinition {
  name: string;
  displayName: string;
  description: string;
  steps: Array<{
    index: number;
    name: string;
    displayName: string;
  }>;
}

/**
 * Funnel Step Statistics
 */
export interface FunnelStepStats {
  stepIndex: number;
  stepName: string;
  displayName: string;
  totalUsers: number;
  completions: number;
  dropoffs: number;
  conversionRate: number; // Percentage of users from previous step
  overallConversionRate: number; // Percentage of users from first step
}

/**
 * Funnel Analysis Result
 */
export interface FunnelAnalysisResult {
  funnelName: string;
  displayName: string;
  description: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  completedSessions: number;
  overallConversionRate: number;
  steps: FunnelStepStats[];
  averageTimeToComplete?: number; // In seconds
}

/**
 * Track Funnel Event DTO
 */
export interface TrackFunnelEventDto {
  funnelName: string;
  stepIndex: number;
  stepName: string;
  userId?: string;
  sessionId: string;
  anonymousId?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

/**
 * Funnel Analytics Service
 *
 * Provides conversion funnel tracking and analysis capabilities
 * Tracks user progression through multi-step conversion funnels
 * Identifies drop-off points and optimization opportunities
 */
@Injectable()
export class FunnelAnalyticsService {
  private readonly logger = new Logger(FunnelAnalyticsService.name);

  /**
   * Predefined Conversion Funnels
   */
  public readonly FUNNELS: Record<string, FunnelDefinition> = {
    vendor_discovery: {
      name: 'vendor_discovery',
      displayName: 'Vendor Discovery Funnel',
      description: 'User journey from landing to sending a lead',
      steps: [
        { index: 0, name: 'landing', displayName: 'Landing Page' },
        { index: 1, name: 'search', displayName: 'Search Vendors' },
        { index: 2, name: 'view_profile', displayName: 'View Vendor Profile' },
        { index: 3, name: 'contact_click', displayName: 'Click Contact' },
        { index: 4, name: 'lead_sent', displayName: 'Lead Sent' },
      ],
    },
    user_signup: {
      name: 'user_signup',
      displayName: 'User Signup Funnel',
      description: 'User registration and onboarding process',
      steps: [
        { index: 0, name: 'signup_start', displayName: 'Start Signup' },
        { index: 1, name: 'email_entered', displayName: 'Email Entered' },
        { index: 2, name: 'password_created', displayName: 'Password Created' },
        { index: 3, name: 'account_created', displayName: 'Account Created' },
        { index: 4, name: 'email_verified', displayName: 'Email Verified' },
        { index: 5, name: 'onboarding_complete', displayName: 'Onboarding Complete' },
      ],
    },
    vendor_onboarding: {
      name: 'vendor_onboarding',
      displayName: 'Vendor Onboarding Funnel',
      description: 'Vendor profile setup and activation',
      steps: [
        { index: 0, name: 'create_profile_start', displayName: 'Start Profile Creation' },
        { index: 1, name: 'basic_info_complete', displayName: 'Basic Info Complete' },
        { index: 2, name: 'services_added', displayName: 'Services Added' },
        { index: 3, name: 'portfolio_uploaded', displayName: 'Portfolio Uploaded' },
        { index: 4, name: 'profile_submitted', displayName: 'Profile Submitted' },
        { index: 5, name: 'profile_approved', displayName: 'Profile Approved' },
      ],
    },
    event_planning: {
      name: 'event_planning',
      displayName: 'Event Planning Funnel',
      description: 'User creates and plans an event',
      steps: [
        { index: 0, name: 'create_event_start', displayName: 'Start Event Creation' },
        { index: 1, name: 'event_type_selected', displayName: 'Event Type Selected' },
        { index: 2, name: 'event_details_complete', displayName: 'Event Details Complete' },
        { index: 3, name: 'budget_set', displayName: 'Budget Set' },
        { index: 4, name: 'vendors_shortlisted', displayName: 'Vendors Shortlisted' },
        { index: 5, name: 'event_activated', displayName: 'Event Activated' },
      ],
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track a funnel event
   */
  async trackEvent(dto: TrackFunnelEventDto): Promise<void> {
    try {
      await this.prisma.funnelEvent.create({
        data: {
          funnelName: dto.funnelName,
          stepIndex: dto.stepIndex,
          stepName: dto.stepName,
          userId: dto.userId || null,
          sessionId: dto.sessionId,
          anonymousId: dto.anonymousId || null,
          metadata: dto.metadata || Prisma.JsonNull,
          userAgent: dto.userAgent || null,
          ipAddress: dto.ipAddress || null,
          referrer: dto.referrer || null,
        },
      });

      this.logger.debug(
        `Tracked funnel event: ${dto.funnelName} - ${dto.stepName} (session: ${dto.sessionId})`,
      );
    } catch (error) {
      this.logger.error(`Failed to track funnel event: ${error.message}`, error.stack);
      // Don't throw - tracking failures shouldn't break user experience
    }
  }

  /**
   * Analyze funnel performance
   */
  async analyzeFunnel(
    funnelName: string,
    startDate: Date,
    endDate: Date,
  ): Promise<FunnelAnalysisResult> {
    const funnel = this.FUNNELS[funnelName];
    if (!funnel) {
      throw new Error(`Unknown funnel: ${funnelName}`);
    }

    // Get all events for this funnel in the date range
    const events = await this.prisma.funnelEvent.findMany({
      where: {
        funnelName,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Group events by session
    const sessionMap = new Map<string, Array<{ stepIndex: number; timestamp: Date }>>();
    for (const event of events) {
      if (!sessionMap.has(event.sessionId)) {
        sessionMap.set(event.sessionId, []);
      }
      sessionMap.get(event.sessionId)!.push({
        stepIndex: event.stepIndex,
        timestamp: event.timestamp,
      });
    }

    // Calculate statistics for each step
    const stepStats: FunnelStepStats[] = [];
    const totalSessions = sessionMap.size;

    for (const step of funnel.steps) {
      // Count sessions that reached this step
      const sessionsReachingStep = Array.from(sessionMap.values()).filter((steps) =>
        steps.some((s) => s.stepIndex === step.index),
      ).length;

      // Count sessions that reached the next step (completions)
      const nextStepIndex = step.index + 1;
      const sessionsReachingNextStep =
        nextStepIndex < funnel.steps.length
          ? Array.from(sessionMap.values()).filter((steps) =>
              steps.some((s) => s.stepIndex === nextStepIndex),
            ).length
          : sessionsReachingStep; // Last step counts all who reached it as completions

      const dropoffs = sessionsReachingStep - sessionsReachingNextStep;
      const conversionRate =
        sessionsReachingStep > 0
          ? (sessionsReachingNextStep / sessionsReachingStep) * 100
          : 0;
      const overallConversionRate =
        totalSessions > 0 ? (sessionsReachingStep / totalSessions) * 100 : 0;

      stepStats.push({
        stepIndex: step.index,
        stepName: step.name,
        displayName: step.displayName,
        totalUsers: sessionsReachingStep,
        completions: sessionsReachingNextStep,
        dropoffs,
        conversionRate,
        overallConversionRate,
      });
    }

    // Count sessions that completed the entire funnel
    const lastStepIndex = funnel.steps[funnel.steps.length - 1].index;
    const completedSessions = Array.from(sessionMap.values()).filter((steps) =>
      steps.some((s) => s.stepIndex === lastStepIndex),
    ).length;

    const overallConversionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate average time to complete
    let averageTimeToComplete: number | undefined;
    const completedSessionTimes: number[] = [];

    for (const [_, steps] of sessionMap) {
      const sortedSteps = steps.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const hasCompletedFunnel = sortedSteps.some((s) => s.stepIndex === lastStepIndex);

      if (hasCompletedFunnel) {
        const firstStep = sortedSteps[0];
        const lastStep = sortedSteps.find((s) => s.stepIndex === lastStepIndex)!;
        const timeToComplete =
          (lastStep.timestamp.getTime() - firstStep.timestamp.getTime()) / 1000; // Convert to seconds
        completedSessionTimes.push(timeToComplete);
      }
    }

    if (completedSessionTimes.length > 0) {
      averageTimeToComplete =
        completedSessionTimes.reduce((sum, time) => sum + time, 0) /
        completedSessionTimes.length;
    }

    return {
      funnelName: funnel.name,
      displayName: funnel.displayName,
      description: funnel.description,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      totalSessions,
      completedSessions,
      overallConversionRate,
      steps: stepStats,
      averageTimeToComplete,
    };
  }

  /**
   * Get funnel conversion trends over time
   * Returns daily conversion rates for visualization
   */
  async getFunnelTrends(
    funnelName: string,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day',
  ): Promise<
    Array<{
      date: string;
      totalSessions: number;
      completedSessions: number;
      conversionRate: number;
    }>
  > {
    const funnel = this.FUNNELS[funnelName];
    if (!funnel) {
      throw new Error(`Unknown funnel: ${funnelName}`);
    }

    const lastStepIndex = funnel.steps[funnel.steps.length - 1].index;

    // Get date truncation function based on interval
    const dateTrunc = interval === 'day' ? 'day' : interval === 'week' ? 'week' : 'month';

    // Query for sessions started per day
    const sessionsStarted = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT
        DATE_TRUNC(${dateTrunc}, timestamp) as date,
        COUNT(DISTINCT session_id) as count
      FROM analytics.funnel_events
      WHERE funnel_name = ${funnelName}
        AND step_index = 0
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY DATE_TRUNC(${dateTrunc}, timestamp)
      ORDER BY date
    `;

    // Query for sessions completed per day
    const sessionsCompleted = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT
        DATE_TRUNC(${dateTrunc}, timestamp) as date,
        COUNT(DISTINCT session_id) as count
      FROM analytics.funnel_events
      WHERE funnel_name = ${funnelName}
        AND step_index = ${lastStepIndex}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY DATE_TRUNC(${dateTrunc}, timestamp)
      ORDER BY date
    `;

    // Merge results
    const completedMap = new Map(
      sessionsCompleted.map((row) => [row.date.toISOString(), Number(row.count)]),
    );

    return sessionsStarted.map((row) => {
      const dateStr = row.date.toISOString();
      const total = Number(row.count);
      const completed = completedMap.get(dateStr) || 0;
      const conversionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        date: dateStr,
        totalSessions: total,
        completedSessions: completed,
        conversionRate,
      };
    });
  }

  /**
   * Get top drop-off points across all funnels
   */
  async getTopDropOffPoints(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<
    Array<{
      funnelName: string;
      stepIndex: number;
      stepName: string;
      dropoffRate: number;
      affectedSessions: number;
    }>
  > {
    const dropOffPoints: Array<{
      funnelName: string;
      stepIndex: number;
      stepName: string;
      dropoffRate: number;
      affectedSessions: number;
    }> = [];

    // Analyze all funnels
    for (const funnel of Object.values(this.FUNNELS)) {
      const analysis = await this.analyzeFunnel(funnel.name, startDate, endDate);

      for (const step of analysis.steps) {
        if (step.stepIndex < funnel.steps.length - 1) {
          // Not the last step
          const dropoffRate = 100 - step.conversionRate;
          dropOffPoints.push({
            funnelName: funnel.name,
            stepIndex: step.stepIndex,
            stepName: step.stepName,
            dropoffRate,
            affectedSessions: step.dropoffs,
          });
        }
      }
    }

    // Sort by drop-off rate and return top N
    return dropOffPoints
      .sort((a, b) => b.dropoffRate - a.dropoffRate)
      .slice(0, limit);
  }

  /**
   * Get user journey for a specific session
   */
  async getUserJourney(sessionId: string): Promise<
    Array<{
      funnelName: string;
      stepIndex: number;
      stepName: string;
      timestamp: Date;
      metadata: any;
    }>
  > {
    const events = await this.prisma.funnelEvent.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return events.map((event) => ({
      funnelName: event.funnelName,
      stepIndex: event.stepIndex,
      stepName: event.stepName,
      timestamp: event.timestamp,
      metadata: event.metadata,
    }));
  }
}
