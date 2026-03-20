// ============================================================================
// PAYMENT RETRY SCHEDULER - Subscription Domain
// ============================================================================
// Scheduled tasks for automatic payment retry and failure notifications
// Handles retrying failed payments and sending payment failure reminders
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentMethodRepository } from '../repositories/payment-method.repository';
import { RazorpayService } from '../services/razorpay.service';
import { SubscriptionService } from '../services/subscription.service';
import {
  PaymentRetryResultDto,
  PaymentRetryBatchResultDto,
  DEFAULT_RETRY_CONFIG,
} from '../dto/payment-retry.dto';
import { PaymentPurpose } from '../dto/razorpay.dto';
import { differenceInDays } from 'date-fns';

@Injectable()
export class PaymentRetryScheduler {
  private readonly logger = new Logger(PaymentRetryScheduler.name);
  private readonly maxRetries: number;
  private readonly lookbackDays: number;
  private readonly minRetryDelayHours: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly razorpayService: RazorpayService,
    private readonly subscriptionService: SubscriptionService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    // Load configuration with defaults
    this.maxRetries = this.configService.get<number>(
      'PAYMENT_RETRY_MAX_RETRIES',
      DEFAULT_RETRY_CONFIG.maxRetries,
    );
    this.lookbackDays = this.configService.get<number>(
      'PAYMENT_RETRY_LOOKBACK_DAYS',
      DEFAULT_RETRY_CONFIG.lookbackDays,
    );
    this.minRetryDelayHours = this.configService.get<number>(
      'PAYMENT_RETRY_MIN_DELAY_HOURS',
      DEFAULT_RETRY_CONFIG.minRetryDelayHours,
    );
  }

  // ============================================================================
  // AUTOMATIC PAYMENT RETRY
  // ============================================================================

  /**
   * Automatically retry failed payments
   * Runs every 4 hours
   *
   * Finds payments with status FAILED that:
   * - Failed within the last 7 days (configurable)
   * - Have retry_count < 3 (configurable)
   * - Associated subscription is still active/past_due
   *
   * For each payment:
   * 1. Check if payment method is still valid
   * 2. Attempt to charge via RazorpayService
   * 3. Update payment status
   * 4. Increment retry_count in metadata
   * 5. Emit success/failure events
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async retryFailedPayments(): Promise<PaymentRetryBatchResultDto> {
    this.logger.log('Starting automatic payment retry process...');
    const startedAt = new Date();

    const results: PaymentRetryResultDto[] = [];
    let successCount = 0;
    let failureCount = 0;
    let maxRetriesReachedCount = 0;

    try {
      // Find all retryable payments
      const retryablePayments = await this.paymentRepository.findRetryablePayments(
        this.maxRetries,
        this.lookbackDays,
        this.minRetryDelayHours,
      );

      this.logger.log(`Found ${retryablePayments.length} payments eligible for retry`);

      for (const payment of retryablePayments) {
        const result = await this.processPaymentRetry(payment);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          if (result.retryCount >= this.maxRetries) {
            maxRetriesReachedCount++;
          }
        }
      }

      const completedAt = new Date();
      const batchResult: PaymentRetryBatchResultDto = {
        totalProcessed: retryablePayments.length,
        successCount,
        failureCount,
        maxRetriesReachedCount,
        results,
        startedAt,
        completedAt,
      };

      this.logger.log(
        `Payment retry completed: ${successCount} succeeded, ${failureCount} failed, ${maxRetriesReachedCount} reached max retries`,
      );

      // Emit batch completion event
      this.eventEmitter.emit('payment.retry-batch-completed', batchResult);

      return batchResult;
    } catch (error) {
      this.logger.error('Failed to process payment retries', error);
      this.eventEmitter.emit('scheduler.payment-retry.failed', {
        error: (error as Error).message,
      });

      return {
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
        maxRetriesReachedCount: 0,
        results: [],
        startedAt,
        completedAt: new Date(),
      };
    }
  }

  /**
   * Process a single payment retry
   */
  private async processPaymentRetry(payment: any): Promise<PaymentRetryResultDto> {
    const paymentId = payment.id;
    const currentRetryCount = this.paymentRepository.getRetryCount(payment);
    const newRetryCount = currentRetryCount + 1;

    this.logger.debug(
      `Processing retry #${newRetryCount} for payment ${paymentId}`,
    );

    try {
      // Step 1: Check if we should skip this payment
      const lastRetryAt = this.paymentRepository.getLastRetryAt(payment);
      if (lastRetryAt) {
        const hoursSinceLastRetry =
          (Date.now() - lastRetryAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRetry < this.minRetryDelayHours) {
          this.logger.debug(
            `Skipping payment ${paymentId}: too soon since last retry (${hoursSinceLastRetry.toFixed(1)}h < ${this.minRetryDelayHours}h)`,
          );
          return {
            paymentId,
            success: false,
            error: 'Too soon since last retry',
            retryCount: currentRetryCount,
          };
        }
      }

      // Step 2: Get the subscription and check payment method
      const subscription = payment.subscription;
      if (!subscription) {
        this.logger.warn(`Payment ${paymentId} has no associated subscription`);
        return {
          paymentId,
          success: false,
          error: 'No associated subscription',
          retryCount: currentRetryCount,
        };
      }

      // Step 3: Find a valid payment method
      const defaultPaymentMethod = subscription.paymentMethods?.[0];
      if (!defaultPaymentMethod) {
        this.logger.warn(
          `No default payment method for subscription ${subscription.id}`,
        );

        // Emit event for no payment method
        this.eventEmitter.emit('payment.retry-failed', {
          paymentId,
          subscriptionId: subscription.id,
          error: 'No payment method available',
          retryCount: newRetryCount,
        });

        // Increment retry count even for this failure
        await this.paymentRepository.incrementRetryCount(paymentId);

        return {
          paymentId,
          success: false,
          error: 'No payment method available',
          retryCount: newRetryCount,
        };
      }

      // Step 4: Check if Razorpay is configured
      if (!this.razorpayService.isConfigured()) {
        this.logger.error('Razorpay is not configured, cannot retry payment');
        return {
          paymentId,
          success: false,
          error: 'Payment gateway not configured',
          retryCount: currentRetryCount,
        };
      }

      // Step 5: Attempt to create a new payment order
      const amount = Number(payment.amount) * 100; // Convert to paise
      const currency = payment.currency || 'INR';

      const orderResponse = await this.razorpayService.createOrder(
        {
          amount,
          currency,
          purpose: PaymentPurpose.SUBSCRIPTION,
          metadata: {
            originalPaymentId: paymentId,
            retryAttempt: newRetryCount,
            subscriptionId: subscription.id,
          },
        },
        subscription.vendorProfile?.user?.id || payment.userId,
        subscription.vendorProfileId || payment.vendorProfileId,
        `retry_${paymentId}_${newRetryCount}`, // Idempotency key
      );

      // Step 6: Update the original payment metadata
      await this.paymentRepository.incrementRetryCount(paymentId);

      // Step 7: Create a new payment record for this retry attempt
      const newPayment = await this.prisma.payment.create({
        data: {
          invoiceId: payment.invoiceId,
          paymentMethodId: defaultPaymentMethod.id,
          userId: payment.userId,
          vendorProfileId: payment.vendorProfileId,
          subscriptionId: subscription.id,
          amount: payment.amount,
          currency,
          status: 'PENDING',
          gatewayProvider: 'razorpay',
          gatewayOrderId: orderResponse.orderId,
          metadata: {
            originalPaymentId: paymentId,
            retryAttempt: newRetryCount,
            retryScheduledAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `Created retry payment ${newPayment.id} for original payment ${paymentId}`,
      );

      // Step 8: Emit event for successful order creation
      // Note: Actual payment capture happens via webhook when customer completes payment
      this.eventEmitter.emit('payment.retry-initiated', {
        originalPaymentId: paymentId,
        newPaymentId: newPayment.id,
        orderId: orderResponse.orderId,
        subscriptionId: subscription.id,
        retryCount: newRetryCount,
        amount: payment.amount,
        currency,
      });

      return {
        paymentId,
        success: true,
        retryCount: newRetryCount,
        newPaymentId: newPayment.id,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(
        `Failed to retry payment ${paymentId}: ${errorMessage}`,
      );

      // Increment retry count
      await this.paymentRepository.incrementRetryCount(paymentId);
      await this.paymentRepository.updateRetryStatus(
        paymentId,
        false,
        undefined,
        'RETRY_FAILED',
        errorMessage,
      );

      // Check if max retries reached
      if (newRetryCount >= this.maxRetries) {
        this.logger.warn(
          `Payment ${paymentId} has reached max retries (${this.maxRetries})`,
        );

        this.eventEmitter.emit('payment.max-retries-reached', {
          paymentId,
          subscriptionId: payment.subscriptionId,
          retryCount: newRetryCount,
          finalError: errorMessage,
        });

        // Update subscription to past_due if not already
        if (payment.subscription?.status === 'ACTIVE') {
          await this.prisma.subscription.update({
            where: { id: payment.subscriptionId! },
            data: { status: 'PAST_DUE' },
          });
        }
      } else {
        this.eventEmitter.emit('payment.retry-failed', {
          paymentId,
          subscriptionId: payment.subscriptionId,
          error: errorMessage,
          retryCount: newRetryCount,
          willRetryAgain: true,
        });
      }

      return {
        paymentId,
        success: false,
        error: errorMessage,
        retryCount: newRetryCount,
      };
    }
  }

  // ============================================================================
  // PAYMENT FAILURE REMINDERS
  // ============================================================================

  /**
   * Send payment failure notifications to users with past due subscriptions
   * Runs daily at 10:00 AM
   *
   * Finds subscriptions with PAST_DUE status and sends reminder emails
   * with a link to retry payment
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendPaymentFailureReminders(): Promise<void> {
    this.logger.log('Processing payment failure reminders...');

    try {
      const pastDueSubscriptions =
        await this.paymentRepository.findPastDueSubscriptionsWithFailedPayments();

      this.logger.log(
        `Found ${pastDueSubscriptions.length} past due subscriptions`,
      );

      let remindersSent = 0;

      for (const subscription of pastDueSubscriptions) {
        if (!subscription.email) {
          this.logger.debug(
            `Skipping subscription ${subscription.subscriptionId}: no email`,
          );
          continue;
        }

        const daysUntilExpiry = differenceInDays(
          subscription.currentPeriodEnd,
          new Date(),
        );

        // Generate retry link (this would be configured in your frontend)
        const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
        const retryLink = `${baseUrl}/billing/retry-payment?subscription=${subscription.subscriptionId}`;

        this.eventEmitter.emit('payment.failure-reminder', {
          subscriptionId: subscription.subscriptionId,
          userId: subscription.userId,
          vendorProfileId: subscription.vendorProfileId,
          email: subscription.email,
          amount: subscription.outstandingAmount,
          currency: subscription.currency,
          planName: subscription.planName,
          daysUntilExpiry: Math.max(0, daysUntilExpiry),
          retryLink,
        });

        remindersSent++;
      }

      this.logger.log(`Sent ${remindersSent} payment failure reminders`);

      this.eventEmitter.emit('scheduler.payment-reminders.completed', {
        remindersSent,
        totalPastDue: pastDueSubscriptions.length,
      });
    } catch (error) {
      this.logger.error('Failed to send payment failure reminders', error);
      this.eventEmitter.emit('scheduler.payment-reminders.failed', {
        error: (error as Error).message,
      });
    }
  }

  // ============================================================================
  // ESCALATION FOR LONG-TERM PAST DUE
  // ============================================================================

  /**
   * Escalate subscriptions that have been past due for too long
   * Runs daily at 2:00 AM
   *
   * For subscriptions past due for more than 7 days:
   * - Send final warning notification
   * - Mark for potential downgrade/cancellation
   */
  @Cron('0 2 * * *')
  async escalateLongTermPastDue(): Promise<void> {
    this.logger.log('Processing long-term past due escalations...');

    const gracePeriodDays = this.configService.get<number>(
      'SUBSCRIPTION_GRACE_PERIOD_DAYS',
      7,
    );

    try {
      const escalationThreshold = new Date();
      escalationThreshold.setDate(
        escalationThreshold.getDate() - gracePeriodDays,
      );

      const longTermPastDue = await this.prisma.subscription.findMany({
        where: {
          status: 'PAST_DUE',
          currentPeriodEnd: {
            lt: escalationThreshold,
          },
        },
        include: {
          vendorProfile: {
            include: { user: true },
          },
          plan: true,
        },
      });

      this.logger.log(
        `Found ${longTermPastDue.length} subscriptions past grace period`,
      );

      for (const subscription of longTermPastDue) {
        const daysPastDue = differenceInDays(
          new Date(),
          subscription.currentPeriodEnd,
        );

        this.eventEmitter.emit('subscription.grace-period-expired', {
          subscriptionId: subscription.id,
          vendorProfileId: subscription.vendorProfileId,
          userId: subscription.vendorProfile?.user?.id,
          email: subscription.vendorProfile?.user?.email,
          planName: subscription.plan?.name,
          daysPastDue,
        });
      }

      this.logger.log(
        `Processed ${longTermPastDue.length} grace period expirations`,
      );
    } catch (error) {
      this.logger.error('Failed to process long-term past due escalations', error);
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
    this.logger.debug('Payment retry scheduler health check - OK');

    // Log current configuration
    this.logger.debug(
      `Configuration: maxRetries=${this.maxRetries}, lookbackDays=${this.lookbackDays}, minRetryDelayHours=${this.minRetryDelayHours}`,
    );
  }
}
