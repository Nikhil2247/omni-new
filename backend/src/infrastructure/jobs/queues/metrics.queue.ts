// ============================================================================
// METRICS QUEUE - Scheduled Analytics Jobs
// ============================================================================
// Queue for scheduling and managing metrics aggregation jobs
// ============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue, JobsOptions } from 'bullmq'
import {
  METRICS_QUEUE,
  MetricsJobType,
  MetricsJobData,
} from '../processors/metrics-aggregation.processor'

@Injectable()
export class MetricsQueue implements OnModuleInit {
  private readonly logger = new Logger(MetricsQueue.name)

  constructor(@InjectQueue(METRICS_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.setupRecurringJobs()
  }

  // ============================================================================
  // SCHEDULED JOBS SETUP
  // ============================================================================

  /**
   * Setup recurring/cron jobs for metrics aggregation
   */
  private async setupRecurringJobs(): Promise<void> {
    // Remove existing repeatable jobs to avoid duplicates
    const existingJobs = await this.queue.getRepeatableJobs()
    for (const job of existingJobs) {
      await this.queue.removeRepeatableByKey(job.key)
    }

    // Daily aggregation - runs at 2 AM every day
    await this.queue.add(
      'daily-aggregation',
      {
        type: MetricsJobType.AGGREGATE_DAILY,
      },
      {
        repeat: {
          pattern: '0 2 * * *', // Every day at 2 AM
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    )

    // Weekly summary - runs every Monday at 3 AM
    await this.queue.add(
      'weekly-aggregation',
      {
        type: MetricsJobType.AGGREGATE_WEEKLY,
      },
      {
        repeat: {
          pattern: '0 3 * * 1', // Every Monday at 3 AM
        },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    )

    // Monthly cleanup - runs on the 1st of every month at 4 AM
    await this.queue.add(
      'monthly-cleanup',
      {
        type: MetricsJobType.CLEANUP_OLD_DATA,
        retentionDays: 365, // Keep 1 year of data
      },
      {
        repeat: {
          pattern: '0 4 1 * *', // 1st of every month at 4 AM
        },
        removeOnComplete: 12,
        removeOnFail: 6,
      },
    )

    // Score recalculation - runs every Sunday at 5 AM
    await this.queue.add(
      'score-recalculation',
      {
        type: MetricsJobType.RECALCULATE_SCORES,
      },
      {
        repeat: {
          pattern: '0 5 * * 0', // Every Sunday at 5 AM
        },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    )

    this.logger.log('Metrics recurring jobs scheduled')
  }

  // ============================================================================
  // MANUAL JOB TRIGGERS
  // ============================================================================

  /**
   * Trigger daily aggregation for a specific date
   */
  async triggerDailyAggregation(
    date?: Date,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.queue.add(
      'manual-daily-aggregation',
      {
        type: MetricsJobType.AGGREGATE_DAILY,
        date: date?.toISOString(),
      },
      {
        priority: 1,
        ...options,
      },
    )

    this.logger.log(`Manual daily aggregation triggered: ${job.id}`)
    return job.id!
  }

  /**
   * Trigger weekly aggregation
   */
  async triggerWeeklyAggregation(
    startDate?: Date,
    endDate?: Date,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.queue.add(
      'manual-weekly-aggregation',
      {
        type: MetricsJobType.AGGREGATE_WEEKLY,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
      {
        priority: 2,
        ...options,
      },
    )

    this.logger.log(`Manual weekly aggregation triggered: ${job.id}`)
    return job.id!
  }

  /**
   * Trigger monthly aggregation
   */
  async triggerMonthlyAggregation(
    startDate?: Date,
    endDate?: Date,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.queue.add(
      'manual-monthly-aggregation',
      {
        type: MetricsJobType.AGGREGATE_MONTHLY,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
      {
        priority: 3,
        ...options,
      },
    )

    this.logger.log(`Manual monthly aggregation triggered: ${job.id}`)
    return job.id!
  }

  /**
   * Trigger data cleanup
   */
  async triggerCleanup(
    retentionDays: number = 365,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.queue.add(
      'manual-cleanup',
      {
        type: MetricsJobType.CLEANUP_OLD_DATA,
        retentionDays,
      },
      {
        priority: 10,
        ...options,
      },
    )

    this.logger.log(`Manual cleanup triggered: ${job.id}`)
    return job.id!
  }

  /**
   * Trigger score recalculation
   */
  async triggerScoreRecalculation(options?: JobsOptions): Promise<string> {
    const job = await this.queue.add(
      'manual-score-recalculation',
      {
        type: MetricsJobType.RECALCULATE_SCORES,
      },
      {
        priority: 5,
        ...options,
      },
    )

    this.logger.log(`Manual score recalculation triggered: ${job.id}`)
    return job.id!
  }

  /**
   * Backfill metrics for a date range
   */
  async backfillMetrics(
    startDate: Date,
    endDate: Date,
    options?: JobsOptions,
  ): Promise<string[]> {
    const jobIds: string[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const job = await this.queue.add(
        'backfill',
        {
          type: MetricsJobType.AGGREGATE_DAILY,
          date: currentDate.toISOString(),
        },
        {
          priority: 10, // Lower priority for backfill
          ...options,
        },
      )

      jobIds.push(job.id!)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    this.logger.log(
      `Backfill triggered for ${jobIds.length} days: ${startDate.toDateString()} - ${endDate.toDateString()}`,
    )

    return jobIds
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    repeatableJobs: number
  }> {
    const [waiting, active, completed, failed, delayed, repeatableJobs] =
      await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
        this.queue.getDelayedCount(),
        this.queue.getRepeatableJobs(),
      ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      repeatableJobs: repeatableJobs.length,
    }
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit: number = 10): Promise<any[]> {
    const [completed, failed] = await Promise.all([
      this.queue.getCompleted(0, limit / 2),
      this.queue.getFailed(0, limit / 2),
    ])

    return [...completed, ...failed]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit)
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.queue.pause()
    this.logger.warn('Metrics queue paused')
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.queue.resume()
    this.logger.log('Metrics queue resumed')
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(gracePeriodMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    await Promise.all([
      this.queue.clean(gracePeriodMs, 1000, 'completed'),
      this.queue.clean(gracePeriodMs * 7, 100, 'failed'),
    ])

    this.logger.log('Old jobs cleaned from queue')
  }
}
