// ============================================================================
// CAMPAIGN SCHEDULER - Subscription Domain
// ============================================================================
// Scheduled tasks for campaign management and credit processing
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CampaignService } from '../services/campaign.service';
import { AdCreditService } from '../services/ad-credit.service';

@Injectable()
export class CampaignScheduler {
  private readonly logger = new Logger(CampaignScheduler.name);

  constructor(
    private readonly campaignService: CampaignService,
    private readonly adCreditService: AdCreditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // Daily Tasks
  // ============================================================================

  /**
   * Process daily credit deduction for active campaigns
   * Runs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDailyCampaignSpend(): Promise<void> {
    this.logger.log('Starting daily campaign spend processing...');

    try {
      const result = await this.campaignService.processDailySpend();

      this.logger.log(
        `Daily spend complete. Processed: ${result.processed}, Charged: ${result.charged}, ` +
        `Paused: ${result.paused}, Completed: ${result.completed}`,
      );

      // Emit summary event for monitoring
      this.eventEmitter.emit('scheduler.campaign-spend.completed', {
        timestamp: new Date(),
        ...result,
      });
    } catch (error) {
      this.logger.error('Daily campaign spend processing failed', error);
      this.eventEmitter.emit('scheduler.campaign-spend.failed', {
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Activate scheduled campaigns that have reached their start date
   * Runs every hour at minute 0
   */
  @Cron(CronExpression.EVERY_HOUR)
  async activateScheduledCampaigns(): Promise<void> {
    this.logger.log('Checking for scheduled campaigns to activate...');

    try {
      const activated = await this.campaignService.activateScheduledCampaigns();

      if (activated > 0) {
        this.logger.log(`Activated ${activated} scheduled campaigns`);
        this.eventEmitter.emit('scheduler.campaigns-activated', {
          timestamp: new Date(),
          count: activated,
        });
      }
    } catch (error) {
      this.logger.error('Failed to activate scheduled campaigns', error);
    }
  }

  /**
   * Expire campaigns that have passed their end date
   * Runs every day at 1 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async expireEndedCampaigns(): Promise<void> {
    this.logger.log('Checking for expired campaigns...');

    try {
      const expired = await this.campaignService.expireEndedCampaigns();

      if (expired > 0) {
        this.logger.log(`Expired ${expired} campaigns`);
        this.eventEmitter.emit('scheduler.campaigns-expired', {
          timestamp: new Date(),
          count: expired,
        });
      }
    } catch (error) {
      this.logger.error('Failed to expire campaigns', error);
    }
  }

  // ============================================================================
  // Monthly Tasks
  // ============================================================================

  /**
   * Grant monthly credits to subscribed vendors
   * Runs on the 1st of every month at 2 AM
   */
  @Cron('0 2 1 * *') // At 02:00 on day-of-month 1
  async grantMonthlyCredits(): Promise<void> {
    this.logger.log('Starting monthly credit grant processing...');

    try {
      const result = await this.adCreditService.processMonthlyGrants();

      this.logger.log(
        `Monthly credit grants complete. Processed: ${result.processed}, ` +
        `Granted: ${result.granted}, Skipped: ${result.skipped}`,
      );

      // Emit summary event for monitoring
      this.eventEmitter.emit('scheduler.monthly-credits.completed', {
        timestamp: new Date(),
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        ...result,
      });
    } catch (error) {
      this.logger.error('Monthly credit grant processing failed', error);
      this.eventEmitter.emit('scheduler.monthly-credits.failed', {
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // Stats Aggregation
  // ============================================================================

  /**
   * Aggregate daily stats for campaigns
   * Runs every day at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async aggregateDailyStats(): Promise<void> {
    this.logger.log('Aggregating daily campaign statistics...');

    try {
      // This is a placeholder for any additional stats aggregation
      // The actual daily stats are updated in real-time by CampaignService

      this.eventEmitter.emit('scheduler.stats-aggregation.completed', {
        timestamp: new Date(),
        date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
      });

      this.logger.log('Daily stats aggregation complete');
    } catch (error) {
      this.logger.error('Daily stats aggregation failed', error);
    }
  }

  // ============================================================================
  // Health Checks
  // ============================================================================

  /**
   * Log scheduler health status
   * Runs every 6 hours
   */
  @Cron('0 */6 * * *') // Every 6 hours
  async healthCheck(): Promise<void> {
    this.logger.debug('Campaign scheduler health check - OK');
  }
}
