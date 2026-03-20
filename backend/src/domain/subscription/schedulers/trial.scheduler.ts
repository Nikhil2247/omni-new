// ============================================================================
// TRIAL SCHEDULER - Subscription Domain
// ============================================================================
// Scheduled tasks for trial management, reminders, and expiration handling
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class TrialScheduler {
  private readonly logger = new Logger(TrialScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // TRIAL ENDING REMINDERS
  // ============================================================================

  /**
   * Send trial ending reminders 3 days before trial ends
   * Runs daily at 10:00 AM
   */
  @Cron('0 10 * * *')
  async sendTrialEndingReminders(): Promise<void> {
    this.logger.log('Processing trial ending reminders...');

    const threeDaysFromNow = addDays(new Date(), 3);
    const startOfTargetDay = startOfDay(threeDaysFromNow);
    const endOfTargetDay = endOfDay(threeDaysFromNow);

    try {
      // Find vendor trials ending in 3 days
      const vendorTrials = await this.prisma.subscription.findMany({
        where: {
          status: 'TRIALING',
          trialEnd: {
            gte: startOfTargetDay,
            lte: endOfTargetDay,
          },
        },
        include: {
          vendorProfile: {
            include: { user: true },
          },
          plan: true,
        },
      });

      for (const subscription of vendorTrials) {
        this.eventEmitter.emit('trial.ending', {
          subscriptionId: subscription.id,
          userId: subscription.vendorProfile?.user?.id,
          email: subscription.vendorProfile?.user?.email,
          planName: subscription.plan?.name,
          trialEnd: subscription.trialEnd,
          type: 'vendor',
        });
      }

      // Find user trials ending in 3 days
      const userTrials = await this.prisma.userSubscription.findMany({
        where: {
          status: 'TRIALING',
          trialEnd: {
            gte: startOfTargetDay,
            lte: endOfTargetDay,
          },
        },
        include: {
          user: true,
          plan: true,
        },
      });

      for (const subscription of userTrials) {
        this.eventEmitter.emit('trial.ending', {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          email: subscription.user?.email,
          planName: subscription.plan?.name,
          trialEnd: subscription.trialEnd,
          type: 'user',
        });
      }

      this.logger.log(
        `Sent ${vendorTrials.length + userTrials.length} trial ending reminders`,
      );
    } catch (error) {
      this.logger.error('Failed to process trial ending reminders', error);
    }
  }

  // ============================================================================
  // EXPIRED TRIALS
  // ============================================================================

  /**
   * Convert expired trials to paid or free
   * Runs daily at 1:30 AM
   */
  @Cron('30 1 * * *')
  async processExpiredTrials(): Promise<void> {
    this.logger.log('Processing expired trials...');

    const today = new Date();

    try {
      // Find expired vendor trials
      const expiredVendorTrials = await this.prisma.subscription.findMany({
        where: {
          status: 'TRIALING',
          trialEnd: {
            lt: today,
          },
        },
        include: {
          vendorProfile: true,
          paymentMethods: {
            where: { isDefault: true },
          },
          plan: {
            include: { prices: true },
          },
        },
      });

      let converted = 0;
      let downgraded = 0;

      for (const subscription of expiredVendorTrials) {
        const hasPaymentMethod =
          (subscription.paymentMethods?.length ?? 0) > 0;

        if (hasPaymentMethod) {
          // Convert to paid subscription
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              trialEnd: null,
              currentPeriodStart: today,
              currentPeriodEnd: addDays(today, 30),
            },
          });

          this.eventEmitter.emit('trial.converted', {
            subscriptionId: subscription.id,
            planId: subscription.planId,
          });

          converted++;
        } else {
          // Downgrade to free plan
          const freePlan = await this.prisma.subscriptionPlan.findFirst({
            where: { tier: 'FREE' },
          });

          if (freePlan) {
            await this.prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'ACTIVE',
                planId: freePlan.id,
                trialEnd: null,
              },
            });

            this.eventEmitter.emit('trial.expired', {
              subscriptionId: subscription.id,
              downgradedToPlanId: freePlan.id,
            });

            downgraded++;
          }
        }
      }

      // Process user trials similarly
      const expiredUserTrials = await this.prisma.userSubscription.findMany({
        where: {
          status: 'TRIALING',
          trialEnd: {
            lt: today,
          },
        },
      });

      for (const subscription of expiredUserTrials) {
        // For now, just downgrade to free
        const freePlan = await this.prisma.userSubscriptionPlan.findFirst({
          where: { tier: 'FREE' },
        });

        if (freePlan) {
          await this.prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              planId: freePlan.id,
              trialEnd: null,
            },
          });

          downgraded++;
        }
      }

      this.logger.log(
        `Processed expired trials: ${converted} converted, ${downgraded} downgraded`,
      );

      this.eventEmitter.emit('scheduler.trials.completed', {
        converted,
        downgraded,
        total: expiredVendorTrials.length + expiredUserTrials.length,
      });
    } catch (error) {
      this.logger.error('Failed to process expired trials', error);
      this.eventEmitter.emit('scheduler.trials.failed', {
        error: (error as Error).message,
      });
    }
  }

  // ============================================================================
  // TRIAL WELCOME EMAILS
  // ============================================================================

  /**
   * Send trial welcome emails for new trials
   * Runs every hour
   */
  @Cron('0 * * * *')
  async sendTrialWelcomeEmails(): Promise<void> {
    const oneHourAgo = subDays(new Date(), 1 / 24);

    try {
      // Find recently created trials that haven't received welcome email
      const newTrials = await this.prisma.subscription.findMany({
        where: {
          status: 'TRIALING',
          createdAt: {
            gte: oneHourAgo,
          },
          // Add a flag or check to ensure we don't send duplicate emails
        },
        include: {
          vendorProfile: {
            include: { user: true },
          },
          plan: true,
        },
      });

      for (const subscription of newTrials) {
        this.eventEmitter.emit('trial.started', {
          subscriptionId: subscription.id,
          userId: subscription.vendorProfile?.user?.id,
          email: subscription.vendorProfile?.user?.email,
          planName: subscription.plan?.name,
          trialEnd: subscription.trialEnd,
        });
      }

      if (newTrials.length > 0) {
        this.logger.log(`Sent ${newTrials.length} trial welcome emails`);
      }
    } catch (error) {
      this.logger.error('Failed to send trial welcome emails', error);
    }
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Log scheduler health status
   * Runs every 6 hours
   */
  @Cron('0 */6 * * *')
  async healthCheck(): Promise<void> {
    this.logger.debug('Trial scheduler health check - OK');
  }
}
