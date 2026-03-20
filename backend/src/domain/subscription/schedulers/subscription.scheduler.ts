// ============================================================================
// SUBSCRIPTION SCHEDULER - Subscription Domain
// ============================================================================
// Scheduled tasks for subscription renewals, reminders, and expiration handling
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';
import { SubscriptionService } from '../services/subscription.service';
import { UserSubscriptionService } from '../services/user-subscription.service';
import { BillingService } from '../services/billing.service';
import { RazorpayService } from '../services/razorpay.service';
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly billingService: BillingService,
    private readonly razorpayService: RazorpayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // RENEWAL REMINDERS
  // ============================================================================

  /**
   * Send renewal reminders 3 days before subscription ends
   * Runs daily at 9:00 AM
   */
  @Cron('0 9 * * *')
  async sendRenewalReminders(): Promise<void> {
    this.logger.log('Processing renewal reminders...');

    const threeDaysFromNow = addDays(new Date(), 3);
    const startOfTargetDay = startOfDay(threeDaysFromNow);
    const endOfTargetDay = endOfDay(threeDaysFromNow);

    try {
      // Find vendor subscriptions ending in 3 days
      const vendorSubscriptions = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: startOfTargetDay,
            lte: endOfTargetDay,
          },
          cancelAtPeriodEnd: false,
        },
        include: {
          vendorProfile: {
            include: { user: true },
          },
          plan: true,
        },
      });

      for (const subscription of vendorSubscriptions) {
        this.eventEmitter.emit('subscription.renewal-reminder', {
          subscriptionId: subscription.id,
          userId: subscription.vendorProfile?.user?.id,
          email: subscription.vendorProfile?.user?.email,
          planName: subscription.plan?.name,
          renewalDate: subscription.currentPeriodEnd,
          type: 'vendor',
        });
      }

      // Find user subscriptions ending in 3 days
      const userSubscriptions = await this.prisma.userSubscription.findMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: startOfTargetDay,
            lte: endOfTargetDay,
          },
          cancelAtPeriodEnd: false,
        },
        include: {
          user: true,
          plan: true,
        },
      });

      for (const subscription of userSubscriptions) {
        this.eventEmitter.emit('subscription.renewal-reminder', {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          email: subscription.user?.email,
          planName: subscription.plan?.name,
          renewalDate: subscription.currentPeriodEnd,
          type: 'user',
        });
      }

      this.logger.log(
        `Sent ${vendorSubscriptions.length + userSubscriptions.length} renewal reminders`,
      );
    } catch (error) {
      this.logger.error('Failed to process renewal reminders', error);
    }
  }

  // ============================================================================
  // SUBSCRIPTION RENEWALS
  // ============================================================================

  /**
   * Process subscription renewals
   * Runs daily at 1:00 AM
   */
  @Cron('0 1 * * *')
  async processRenewals(): Promise<void> {
    this.logger.log('Processing subscription renewals...');

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    try {
      // Find vendor subscriptions that need renewal
      const vendorRenewals = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: startOfToday,
            lte: endOfToday,
          },
          cancelAtPeriodEnd: false,
        },
        include: {
          vendorProfile: {
            include: { user: true },
          },
          plan: {
            include: { prices: true },
          },
        },
      });

      let renewed = 0;
      let failed = 0;

      for (const subscription of vendorRenewals) {
        try {
          // Get the price for renewal
          const price = subscription.plan?.prices?.find(
            (p) => p.billingCycle === (subscription as any).billingCycle,
          );

          if (!price) {
            this.logger.warn(`No price found for subscription ${subscription.id}`);
            continue;
          }

          // Check if subscription has a saved payment method
          const paymentMethods = await this.prisma.paymentMethod.findMany({
            where: {
              subscriptionId: subscription.id,
              isDefault: true,
            },
          });

          if (paymentMethods.length === 0) {
            // No payment method - mark as past due
            await this.prisma.subscription.update({
              where: { id: subscription.id },
              data: { status: 'PAST_DUE' },
            });

            this.eventEmitter.emit('subscription.payment-failed', {
              subscriptionId: subscription.id,
              reason: 'No payment method',
            });

            failed++;
            continue;
          }

          // For now, just renew the subscription period
          // In production, you would charge the saved payment method via Razorpay
          await this.subscriptionService.renewSubscription(subscription.id);
          renewed++;

          this.eventEmitter.emit('subscription.renewed', {
            subscriptionId: subscription.id,
            userId: subscription.vendorProfile?.user?.id,
          });
        } catch (error) {
          this.logger.error(
            `Failed to renew subscription ${subscription.id}: ${(error as Error).message}`,
          );
          failed++;
        }
      }

      // Process user subscription renewals similarly
      const userRenewals = await this.prisma.userSubscription.findMany({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: {
            gte: startOfToday,
            lte: endOfToday,
          },
          cancelAtPeriodEnd: false,
        },
        include: {
          user: true,
          plan: {
            include: { prices: true },
          },
        },
      });

      for (const subscription of userRenewals) {
        try {
          await this.userSubscriptionService.renewSubscription(subscription.id);
          renewed++;
        } catch (error) {
          this.logger.error(
            `Failed to renew user subscription ${subscription.id}: ${(error as Error).message}`,
          );
          failed++;
        }
      }

      this.logger.log(`Renewals processed: ${renewed} renewed, ${failed} failed`);

      this.eventEmitter.emit('scheduler.renewals.completed', {
        renewed,
        failed,
        total: vendorRenewals.length + userRenewals.length,
      });
    } catch (error) {
      this.logger.error('Failed to process renewals', error);
      this.eventEmitter.emit('scheduler.renewals.failed', {
        error: (error as Error).message,
      });
    }
  }

  // ============================================================================
  // EXPIRED SUBSCRIPTIONS
  // ============================================================================

  /**
   * Handle expired subscriptions (past grace period)
   * Runs daily at 2:00 AM
   */
  @Cron('0 2 * * *')
  async handleExpiredSubscriptions(): Promise<void> {
    this.logger.log('Processing expired subscriptions...');

    const gracePeriodDays = 7;
    const expiryThreshold = subDays(new Date(), gracePeriodDays);

    try {
      // Find past-due vendor subscriptions past grace period
      const expiredVendorSubs = await this.prisma.subscription.findMany({
        where: {
          status: 'PAST_DUE',
          currentPeriodEnd: {
            lt: expiryThreshold,
          },
        },
        include: {
          vendorProfile: true,
        },
      });

      for (const subscription of expiredVendorSubs) {
        // Downgrade to free plan
        const freePlan = await this.prisma.subscriptionPlan.findFirst({
          where: { tier: 'FREE' },
        });

        if (freePlan) {
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'EXPIRED',
              planId: freePlan.id,
            },
          });

          this.eventEmitter.emit('subscription.expired', {
            subscriptionId: subscription.id,
            vendorProfileId: subscription.vendorProfileId,
          });
        }
      }

      // Handle cancelled subscriptions at period end
      const cancelledSubs = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: {
            lt: new Date(),
          },
        },
      });

      for (const subscription of cancelledSubs) {
        await this.subscriptionService.cancel(subscription.id, { immediate: true });
      }

      this.logger.log(
        `Processed ${expiredVendorSubs.length} expired, ${cancelledSubs.length} cancelled subscriptions`,
      );
    } catch (error) {
      this.logger.error('Failed to handle expired subscriptions', error);
    }
  }

  // ============================================================================
  // SCHEDULED PLAN CHANGES
  // ============================================================================

  /**
   * Process scheduled plan changes (downgrades)
   * Runs daily at 3:00 AM
   */
  @Cron('0 3 * * *')
  async processScheduledPlanChanges(): Promise<void> {
    this.logger.log('Processing scheduled plan changes...');

    try {
      // Find subscriptions with scheduled plan changes
      const subscriptionsWithChanges = await this.prisma.userSubscription.findMany({
        where: {
          scheduledPlanId: { not: null },
          currentPeriodEnd: {
            lte: new Date(),
          },
        },
      });

      for (const subscription of subscriptionsWithChanges) {
        if (subscription.scheduledPlanId) {
          await this.prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              planId: subscription.scheduledPlanId,
              scheduledPlanId: null,
              currentPeriodStart: new Date(),
              currentPeriodEnd: addDays(new Date(), 30), // Assuming monthly
            },
          });

          this.eventEmitter.emit('subscription.plan-changed', {
            subscriptionId: subscription.id,
            newPlanId: subscription.scheduledPlanId,
          });
        }
      }

      this.logger.log(`Processed ${subscriptionsWithChanges.length} scheduled plan changes`);
    } catch (error) {
      this.logger.error('Failed to process scheduled plan changes', error);
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
    this.logger.debug('Subscription scheduler health check - OK');
  }
}
