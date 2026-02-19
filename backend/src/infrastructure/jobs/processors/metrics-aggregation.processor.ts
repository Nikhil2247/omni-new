// ============================================================================
// METRICS AGGREGATION PROCESSOR - Scheduled Metrics Collection
// ============================================================================
// Background job processor for aggregating daily platform metrics
// Runs on a schedule to maintain historical analytics data
// ============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformMetricsService } from '../../../domain/insights/services/platform-metrics.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { Decimal } from '@prisma/client/runtime/client';

export const METRICS_QUEUE = 'metrics-aggregation';

export enum MetricsJobType {
  AGGREGATE_DAILY = 'aggregate_daily',
  AGGREGATE_WEEKLY = 'aggregate_weekly',
  AGGREGATE_MONTHLY = 'aggregate_monthly',
  CLEANUP_OLD_DATA = 'cleanup_old_data',
  RECALCULATE_SCORES = 'recalculate_scores',
}

export interface MetricsJobData {
  type: MetricsJobType;
  date?: string; // ISO date string
  startDate?: string;
  endDate?: string;
  retentionDays?: number;
}

@Injectable()
@Processor(METRICS_QUEUE)
export class MetricsAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(MetricsAggregationProcessor.name);

  constructor(
    private readonly platformMetrics: PlatformMetricsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<MetricsJobData>): Promise<any> {
    this.logger.debug(`Processing metrics job: ${job.name} (${job.id})`);

    const { type, date, startDate, endDate, retentionDays } = job.data;

    try {
      switch (type) {
        case MetricsJobType.AGGREGATE_DAILY:
          return await this.aggregateDaily(date);

        case MetricsJobType.AGGREGATE_WEEKLY:
          return await this.aggregateWeekly(startDate, endDate);

        case MetricsJobType.AGGREGATE_MONTHLY:
          return await this.aggregateMonthly(startDate, endDate);

        case MetricsJobType.CLEANUP_OLD_DATA:
          return await this.cleanupOldData(retentionDays || 365);

        case MetricsJobType.RECALCULATE_SCORES:
          return await this.recalculateScores();

        default:
          throw new Error(`Unknown metrics job type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process metrics job ${job.id}:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<MetricsJobData>) {
    this.logger.log(`Metrics job completed: ${job.name} (${job.id})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MetricsJobData>, error: Error) {
    this.logger.error(
      `Metrics job failed: ${job.name} (${job.id}) - ${error.message}`,
    );
  }

  // ============================================================================
  // JOB HANDLERS
  // ============================================================================

  /**
   * Aggregate daily platform metrics
   */
  private async aggregateDaily(dateStr?: string): Promise<{
    success: boolean;
    date: string;
    message: string;
  }> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // If no date specified, aggregate yesterday's data
    if (!dateStr) {
      targetDate.setDate(targetDate.getDate() - 1);
    }

    await this.platformMetrics.aggregateDailyMetrics(targetDate);

    return {
      success: true,
      date: targetDate.toISOString(),
      message: `Daily metrics aggregated for ${targetDate.toDateString()}`,
    };
  }

  /**
   * Aggregate weekly summary
   */
  private async aggregateWeekly(
    startDateStr?: string,
    endDateStr?: string,
  ): Promise<{
    success: boolean;
    startDate: string;
    endDate: string;
    daysProcessed: number;
  }> {
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    let daysProcessed = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      await this.platformMetrics.aggregateDailyMetrics(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      daysProcessed++;
    }

    return {
      success: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysProcessed,
    };
  }

  /**
   * Aggregate monthly summary
   */
  private async aggregateMonthly(
    startDateStr?: string,
    endDateStr?: string,
  ): Promise<{
    success: boolean;
    startDate: string;
    endDate: string;
    daysProcessed: number;
  }> {
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    let daysProcessed = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      await this.platformMetrics.aggregateDailyMetrics(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      daysProcessed++;
    }

    return {
      success: true,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysProcessed,
    };
  }

  /**
   * Cleanup old metrics data beyond retention period
   */
  private async cleanupOldData(retentionDays: number): Promise<{
    success: boolean;
    deletedRecords: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(`Cleaning up data older than ${cutoffDate.toISOString()}`);

    // Delete old platform metrics
    const platformMetricsDeleted = await this.prisma.platformMetrics.deleteMany(
      {
        where: { date: { lt: cutoffDate } },
      },
    );

    // Delete old user engagement records
    const userEngagementDeleted = await this.prisma.userEngagement.deleteMany({
      where: { date: { lt: cutoffDate } },
    });

    // Delete old vendor metrics records
    const vendorMetricsDeleted = await this.prisma.vendorMetrics.deleteMany({
      where: { date: { lt: cutoffDate } },
    });

    // Delete old profile views (raw data)
    const profileViewsDeleted = await this.prisma.profileView.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    // Delete old search queries (raw data)
    const searchQueriesDeleted = await this.prisma.searchQuery.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    const totalDeleted =
      platformMetricsDeleted.count +
      userEngagementDeleted.count +
      vendorMetricsDeleted.count +
      profileViewsDeleted.count +
      searchQueriesDeleted.count;

    this.logger.log(
      `Cleaned up ${totalDeleted} records older than ${retentionDays} days`,
    );

    return {
      success: true,
      deletedRecords: totalDeleted,
    };
  }

  /**
   * Recalculate performance scores for all vendors
   */
  private async recalculateScores(): Promise<{
    success: boolean;
    vendorsProcessed: number;
  }> {
    this.logger.log('Recalculating vendor performance scores');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all vendors with metrics in the last 30 days
    const vendorMetrics = await this.prisma.vendorMetrics.groupBy({
      by: ['vendorProfileId'],
      where: { date: { gte: thirtyDaysAgo } },
      _sum: {
        profileViews: true,
        leadsReceived: true,
        leadsConverted: true,
      },
      _avg: {
        conversionRate: true,
        responseRate: true,
      },
    });

    let vendorsProcessed = 0;

    for (const vendor of vendorMetrics) {
      // Calculate performance score using the same formula as VendorMetricsService
      const weights = {
        profileViews: 1,
        leadsReceived: 5,
        leadsConverted: 20,
        conversionRate: 100,
        responseRate: 50,
      };

      const score =
        (vendor._sum.profileViews || 0) * weights.profileViews +
        (vendor._sum.leadsReceived || 0) * weights.leadsReceived +
        (vendor._sum.leadsConverted || 0) * weights.leadsConverted +
        (vendor._avg.conversionRate?.toNumber() || 0) * weights.conversionRate +
        (vendor._avg.responseRate?.toNumber() || 0) * weights.responseRate;

      // Update the most recent vendor metrics record with the calculated score
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await this.prisma.vendorMetrics.upsert({
        where: {
          vendorProfileId_date: {
            vendorProfileId: vendor.vendorProfileId,
            date: today,
          },
        },
        create: {
          vendorProfileId: vendor.vendorProfileId,
          date: today,
        },
        update: {
          // Update the response rate as a calculated average
          responseRate: vendor._avg.responseRate
            ? new Decimal(vendor._avg.responseRate.toNumber())
            : undefined,
          conversionRate: vendor._avg.conversionRate
            ? new Decimal(vendor._avg.conversionRate.toNumber())
            : undefined,
        },
      });

      vendorsProcessed++;
    }

    this.logger.log(`Recalculated scores for ${vendorsProcessed} vendors`);

    return {
      success: true,
      vendorsProcessed,
    };
  }
}
