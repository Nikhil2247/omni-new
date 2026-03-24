// ============================================================================
// PAYMENT RETRY SERVICE - Subscription Domain
// ============================================================================
// Handles payment retry logic with exponential backoff strategy
// Manages dunning workflow for failed payments and PAST_DUE subscriptions
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentMethodRepository } from '../repositories/payment-method.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { RazorpayService } from './razorpay.service';
import { SubscriptionEmailService } from './subscription-email.service';
import { PaymentPurpose } from '../dto/razorpay.dto';
import { addHours, addDays, differenceInHours, differenceInDays } from 'date-fns';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Retry strategy configuration
 * Defines delays between retry attempts using exponential backoff
 */
export interface RetryStrategy {
  /** Delay in hours before each retry attempt */
  delays: number[];
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Grace period in days after max retries before subscription is cancelled */
  gracePeriodDays: number;
}

/**
 * Default retry strategy: 1h, 6h, 24h, 3 days (72h)
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  delays: [1, 6, 24, 72], // 1 hour, 6 hours, 24 hours, 3 days
  maxRetries: 4,
  gracePeriodDays: 7,
};

/**
 * Result of a single payment retry attempt
 */
export interface PaymentRetryAttemptResult {
  paymentId: string;
  subscriptionId: string | null;
  success: boolean;
  retryCount: number;
  nextRetryAt: Date | null;
  error?: string;
  newPaymentId?: string;
  gatewayOrderId?: string;
}

/**
 * Dunning email type based on retry stage
 */
export enum DunningEmailType {
  FIRST_ATTEMPT_FAILED = 'FIRST_ATTEMPT_FAILED',
  SECOND_ATTEMPT_FAILED = 'SECOND_ATTEMPT_FAILED',
  THIRD_ATTEMPT_FAILED = 'THIRD_ATTEMPT_FAILED',
  FINAL_ATTEMPT_FAILED = 'FINAL_ATTEMPT_FAILED',
  PAST_DUE_WARNING = 'PAST_DUE_WARNING',
  GRACE_PERIOD_ENDING = 'GRACE_PERIOD_ENDING',
  SUBSCRIPTION_SUSPENDED = 'SUBSCRIPTION_SUSPENDED',
}

/**
 * Payment with retry metadata
 */
export interface PaymentWithRetryInfo {
  id: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  retryCount: number;
  lastRetryAt: Date | null;
  nextRetryAt: Date | null;
  subscription?: {
    id: string;
    status: string;
    vendorProfile?: {
      id: string;
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    };
    plan?: {
      name: string;
    };
    paymentMethods?: Array<{
      id: string;
      isDefault: boolean;
      type: string;
    }>;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class PaymentRetryService {
  private readonly logger = new Logger(PaymentRetryService.name);
  private readonly retryStrategy: RetryStrategy;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly razorpayService: RazorpayService,
    private readonly emailService: SubscriptionEmailService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    // Load retry strategy from config or use defaults
    const delaysConfig = this.configService.get<string>('PAYMENT_RETRY_DELAYS');
    const maxRetries = this.configService.get<number>('PAYMENT_RETRY_MAX_ATTEMPTS', 4);
    const gracePeriodDays = this.configService.get<number>('PAYMENT_RETRY_GRACE_PERIOD_DAYS', 7);

    this.retryStrategy = {
      delays: delaysConfig
        ? delaysConfig.split(',').map(d => parseInt(d.trim(), 10))
        : DEFAULT_RETRY_STRATEGY.delays,
      maxRetries,
      gracePeriodDays,
    };

    this.logger.log(
      `Payment retry strategy configured: delays=[${this.retryStrategy.delays.join(', ')}]h, ` +
      `maxRetries=${this.retryStrategy.maxRetries}, gracePeriodDays=${this.retryStrategy.gracePeriodDays}`,
    );
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get the configured retry strategy
   */
  getRetryStrategy(): RetryStrategy {
    return { ...this.retryStrategy };
  }

  /**
   * Calculate the next retry time based on current retry count
   * @param currentRetryCount - Current number of retry attempts
   * @param lastAttemptAt - Timestamp of last attempt
   * @returns Next retry timestamp or null if max retries reached
   */
  calculateNextRetryTime(currentRetryCount: number, lastAttemptAt: Date = new Date()): Date | null {
    if (currentRetryCount >= this.retryStrategy.maxRetries) {
      return null;
    }

    const delayIndex = Math.min(currentRetryCount, this.retryStrategy.delays.length - 1);
    const delayHours = this.retryStrategy.delays[delayIndex];

    return addHours(lastAttemptAt, delayHours);
  }

  /**
   * Check if a payment is eligible for retry
   * @param payment - Payment with retry metadata
   * @returns Whether the payment can be retried
   */
  isEligibleForRetry(payment: PaymentWithRetryInfo): boolean {
    // Check retry count
    if (payment.retryCount >= this.retryStrategy.maxRetries) {
      return false;
    }

    // Check if enough time has passed since last retry
    if (payment.lastRetryAt) {
      const nextRetryTime = this.calculateNextRetryTime(payment.retryCount - 1, payment.lastRetryAt);
      if (nextRetryTime && new Date() < nextRetryTime) {
        return false;
      }
    }

    // Check subscription status
    const validStatuses = ['ACTIVE', 'PAST_DUE', 'TRIALING'];
    if (payment.subscription && !validStatuses.includes(payment.subscription.status)) {
      return false;
    }

    return true;
  }

  /**
   * Find all payments that are due for retry
   * @param lookbackDays - How many days back to look for failed payments
   * @returns Array of payments ready for retry
   */
  async findPaymentsDueForRetry(lookbackDays: number = 14): Promise<PaymentWithRetryInfo[]> {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const failedPayments = await this.prisma.payment.findMany({
      where: {
        status: 'FAILED',
        createdAt: { gte: lookbackDate },
        subscription: {
          status: { in: ['ACTIVE', 'PAST_DUE', 'TRIALING'] },
        },
      },
      include: {
        subscription: {
          include: {
            vendorProfile: {
              include: { user: true },
            },
            plan: true,
            paymentMethods: {
              where: { isDefault: true, isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const eligiblePayments: PaymentWithRetryInfo[] = [];

    for (const payment of failedPayments) {
      const metadata = payment.metadata as Record<string, unknown> || {};
      const retryCount = typeof metadata.retryCount === 'number' ? metadata.retryCount : 0;
      const lastRetryAt = metadata.lastRetryAt
        ? new Date(metadata.lastRetryAt as string)
        : null;

      // Calculate next retry time
      const nextRetryAt = this.calculateNextRetryTime(
        retryCount,
        lastRetryAt || payment.createdAt,
      );

      // Check if payment is due for retry
      if (retryCount >= this.retryStrategy.maxRetries) {
        continue; // Max retries reached
      }

      if (nextRetryAt && now < nextRetryAt) {
        continue; // Not yet time for retry
      }

      eligiblePayments.push({
        id: payment.id,
        subscriptionId: payment.subscriptionId,
        amount: Number(payment.amount),
        currency: payment.currency,
        retryCount,
        lastRetryAt,
        nextRetryAt,
        subscription: payment.subscription ? {
          id: payment.subscription.id,
          status: payment.subscription.status,
          vendorProfile: payment.subscription.vendorProfile ? {
            id: payment.subscription.vendorProfile.id,
            user: payment.subscription.vendorProfile.user ? {
              id: payment.subscription.vendorProfile.user.id,
              email: payment.subscription.vendorProfile.user.email,
              name: payment.subscription.vendorProfile.user.firstName || undefined,
            } : undefined,
          } : undefined,
          plan: payment.subscription.plan ? {
            name: payment.subscription.plan.name,
          } : undefined,
          paymentMethods: payment.subscription.paymentMethods,
        } : undefined,
      });
    }

    return eligiblePayments;
  }

  /**
   * Attempt to retry a single payment
   * @param paymentId - ID of the payment to retry
   * @returns Result of the retry attempt
   */
  async retryPayment(paymentId: string): Promise<PaymentRetryAttemptResult> {
    this.logger.log(`Attempting to retry payment: ${paymentId}`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            vendorProfile: {
              include: { user: true },
            },
            plan: true,
            paymentMethods: {
              where: { isDefault: true, isActive: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return {
        paymentId,
        subscriptionId: null,
        success: false,
        retryCount: 0,
        nextRetryAt: null,
        error: 'Payment not found',
      };
    }

    const metadata = payment.metadata as Record<string, unknown> || {};
    const currentRetryCount = typeof metadata.retryCount === 'number' ? metadata.retryCount : 0;
    const newRetryCount = currentRetryCount + 1;

    // Validate retry eligibility
    if (currentRetryCount >= this.retryStrategy.maxRetries) {
      return {
        paymentId,
        subscriptionId: payment.subscriptionId,
        success: false,
        retryCount: currentRetryCount,
        nextRetryAt: null,
        error: 'Maximum retries reached',
      };
    }

    // Check for valid payment method
    const paymentMethod = payment.subscription?.paymentMethods?.[0];
    if (!paymentMethod) {
      await this.updatePaymentRetryMetadata(paymentId, newRetryCount, 'No payment method available');

      // Send notification about missing payment method
      await this.sendDunningNotification(payment, newRetryCount, 'no_payment_method');

      return {
        paymentId,
        subscriptionId: payment.subscriptionId,
        success: false,
        retryCount: newRetryCount,
        nextRetryAt: this.calculateNextRetryTime(newRetryCount),
        error: 'No payment method available',
      };
    }

    // Check if Razorpay is configured
    if (!this.razorpayService.isConfigured()) {
      this.logger.error('Razorpay is not configured');
      return {
        paymentId,
        subscriptionId: payment.subscriptionId,
        success: false,
        retryCount: currentRetryCount,
        nextRetryAt: null,
        error: 'Payment gateway not configured',
      };
    }

    try {
      // Create a new order for the retry
      const amountInPaise = Number(payment.amount) * 100;
      const orderResponse = await this.razorpayService.createOrder(
        {
          amount: amountInPaise,
          currency: payment.currency || 'INR',
          purpose: PaymentPurpose.SUBSCRIPTION,
          metadata: {
            originalPaymentId: paymentId,
            retryAttempt: newRetryCount,
            subscriptionId: payment.subscriptionId,
          },
        },
        payment.subscription?.vendorProfile?.user?.id || payment.userId || '',
        payment.subscription?.vendorProfileId || payment.vendorProfileId || '',
        `retry_${paymentId}_${newRetryCount}_${Date.now()}`,
      );

      // Update original payment metadata
      await this.updatePaymentRetryMetadata(paymentId, newRetryCount);

      // Create a new payment record for this retry
      const newPayment = await this.prisma.payment.create({
        data: {
          invoiceId: payment.invoiceId,
          paymentMethodId: paymentMethod.id,
          userId: payment.userId,
          vendorProfileId: payment.vendorProfileId,
          subscriptionId: payment.subscriptionId,
          amount: payment.amount,
          currency: payment.currency,
          status: 'PENDING',
          gatewayProvider: 'razorpay',
          gatewayOrderId: orderResponse.orderId,
          metadata: {
            originalPaymentId: paymentId,
            retryAttempt: newRetryCount,
            retryScheduledAt: new Date().toISOString(),
            autoRetry: true,
          },
        },
      });

      this.logger.log(
        `Created retry payment ${newPayment.id} for original payment ${paymentId} (attempt ${newRetryCount})`,
      );

      // Emit event for retry initiation
      this.eventEmitter.emit('payment.retry-initiated', {
        originalPaymentId: paymentId,
        newPaymentId: newPayment.id,
        orderId: orderResponse.orderId,
        subscriptionId: payment.subscriptionId,
        retryCount: newRetryCount,
        amount: Number(payment.amount),
        currency: payment.currency,
      });

      return {
        paymentId,
        subscriptionId: payment.subscriptionId,
        success: true,
        retryCount: newRetryCount,
        nextRetryAt: null, // Will be set if this retry fails
        newPaymentId: newPayment.id,
        gatewayOrderId: orderResponse.orderId,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(`Failed to retry payment ${paymentId}: ${errorMessage}`);

      // Update metadata with failure info
      await this.updatePaymentRetryMetadata(paymentId, newRetryCount, errorMessage);

      // Calculate next retry time
      const nextRetryAt = this.calculateNextRetryTime(newRetryCount);

      // Handle max retries reached
      if (newRetryCount >= this.retryStrategy.maxRetries) {
        await this.handleMaxRetriesReached(payment, newRetryCount);
      } else {
        // Send dunning notification for failed attempt
        await this.sendDunningNotification(payment, newRetryCount, errorMessage);
      }

      // Emit failure event
      this.eventEmitter.emit('payment.retry-failed', {
        paymentId,
        subscriptionId: payment.subscriptionId,
        error: errorMessage,
        retryCount: newRetryCount,
        nextRetryAt,
        willRetryAgain: newRetryCount < this.retryStrategy.maxRetries,
      });

      return {
        paymentId,
        subscriptionId: payment.subscriptionId,
        success: false,
        retryCount: newRetryCount,
        nextRetryAt,
        error: errorMessage,
      };
    }
  }

  /**
   * Process all payments due for retry in batch
   * @returns Summary of batch processing
   */
  async processBatchRetries(): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    maxRetriesReachedCount: number;
    results: PaymentRetryAttemptResult[];
  }> {
    this.logger.log('Starting batch payment retry processing...');
    const startTime = Date.now();

    const paymentsDue = await this.findPaymentsDueForRetry();
    this.logger.log(`Found ${paymentsDue.length} payments due for retry`);

    const results: PaymentRetryAttemptResult[] = [];
    let successCount = 0;
    let failureCount = 0;
    let maxRetriesReachedCount = 0;

    for (const payment of paymentsDue) {
      const result = await this.retryPayment(payment.id);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        if (result.retryCount >= this.retryStrategy.maxRetries) {
          maxRetriesReachedCount++;
        }
      }

      // Add small delay between retries to avoid rate limiting
      await this.delay(500);
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Batch retry completed in ${duration}ms: ` +
      `${successCount} succeeded, ${failureCount} failed, ${maxRetriesReachedCount} max retries reached`,
    );

    // Emit batch completion event
    this.eventEmitter.emit('payment.retry-batch-completed', {
      totalProcessed: paymentsDue.length,
      successCount,
      failureCount,
      maxRetriesReachedCount,
      duration,
    });

    return {
      totalProcessed: paymentsDue.length,
      successCount,
      failureCount,
      maxRetriesReachedCount,
      results,
    };
  }

  /**
   * Mark a payment as failed after webhook notification
   * Triggers retry scheduling based on retry strategy
   * @param paymentId - Payment ID (internal or gateway ID)
   * @param errorCode - Error code from gateway
   * @param errorMessage - Error message from gateway
   */
  async handlePaymentFailure(
    paymentId: string,
    errorCode?: string,
    errorMessage?: string,
  ): Promise<void> {
    this.logger.log(`Handling payment failure for: ${paymentId}`);

    // Try to find payment by internal ID first, then by gateway ID
    let payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            vendorProfile: { include: { user: true } },
            plan: true,
          },
        },
      },
    });

    if (!payment) {
      payment = await this.prisma.payment.findFirst({
        where: { gatewayPaymentId: paymentId },
        include: {
          subscription: {
            include: {
              vendorProfile: { include: { user: true } },
              plan: true,
            },
          },
        },
      });
    }

    if (!payment) {
      this.logger.warn(`Payment not found for failure handling: ${paymentId}`);
      return;
    }

    // Update payment status
    const metadata = payment.metadata as Record<string, unknown> || {};
    const retryCount = typeof metadata.retryCount === 'number' ? metadata.retryCount : 0;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureCode: errorCode,
        failureMessage: errorMessage,
        metadata: {
          ...metadata,
          failedAt: new Date().toISOString(),
          lastFailureCode: errorCode,
          lastFailureMessage: errorMessage,
        },
      },
    });

    // Calculate next retry time
    const nextRetryAt = this.calculateNextRetryTime(retryCount);

    if (nextRetryAt) {
      this.logger.log(
        `Payment ${payment.id} scheduled for retry at ${nextRetryAt.toISOString()} (attempt ${retryCount + 1})`,
      );

      // Send dunning notification
      await this.sendDunningNotification(payment, retryCount, errorMessage || 'Payment failed');
    } else {
      // Max retries will be reached on next attempt, handle accordingly
      await this.handleMaxRetriesReached(payment, retryCount);
    }

    // Emit failure event
    this.eventEmitter.emit('payment.failed', {
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      errorCode,
      errorMessage,
      retryCount,
      nextRetryAt,
    });
  }

  // ============================================================================
  // DUNNING MANAGEMENT
  // ============================================================================

  /**
   * Find all subscriptions that are past due and need dunning attention
   */
  async findPastDueSubscriptions(): Promise<Array<{
    subscriptionId: string;
    vendorProfileId: string;
    userId: string | null;
    email: string | null;
    planName: string | null;
    daysPastDue: number;
    outstandingAmount: number;
    currency: string;
    gracePeriodEndsAt: Date;
  }>> {
    const pastDueSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'PAST_DUE' },
      include: {
        vendorProfile: {
          include: { user: true },
        },
        plan: true,
        payments: {
          where: { status: 'FAILED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();

    return pastDueSubscriptions.map(sub => {
      const daysPastDue = differenceInDays(now, sub.currentPeriodEnd);
      const lastFailedPayment = sub.payments[0];
      const gracePeriodEndsAt = addDays(sub.currentPeriodEnd, this.retryStrategy.gracePeriodDays);

      return {
        subscriptionId: sub.id,
        vendorProfileId: sub.vendorProfileId,
        userId: sub.vendorProfile?.user?.id || null,
        email: sub.vendorProfile?.user?.email || null,
        planName: sub.plan?.name || null,
        daysPastDue: Math.max(0, daysPastDue),
        outstandingAmount: lastFailedPayment ? Number(lastFailedPayment.amount) : 0,
        currency: lastFailedPayment?.currency || 'INR',
        gracePeriodEndsAt,
      };
    });
  }

  /**
   * Process dunning for all past due subscriptions
   * Sends appropriate notifications based on days past due
   */
  async processDunning(): Promise<{
    processed: number;
    warningsSent: number;
    gracePeriodWarningsSent: number;
    subscriptionsSuspended: number;
  }> {
    this.logger.log('Processing dunning for past due subscriptions...');

    const pastDueSubscriptions = await this.findPastDueSubscriptions();
    let warningsSent = 0;
    let gracePeriodWarningsSent = 0;
    let subscriptionsSuspended = 0;

    const now = new Date();

    for (const sub of pastDueSubscriptions) {
      const daysUntilGraceEnds = differenceInDays(sub.gracePeriodEndsAt, now);

      if (daysUntilGraceEnds <= 0) {
        // Grace period expired - suspend subscription
        await this.suspendSubscription(sub.subscriptionId, 'Grace period expired after payment failures');
        subscriptionsSuspended++;
      } else if (daysUntilGraceEnds <= 2) {
        // Grace period ending soon - send urgent warning
        await this.sendGracePeriodEndingNotification(sub);
        gracePeriodWarningsSent++;
      } else if (sub.daysPastDue > 0 && sub.daysPastDue % 3 === 0) {
        // Send periodic reminders every 3 days
        await this.sendPastDueReminderNotification(sub);
        warningsSent++;
      }
    }

    this.logger.log(
      `Dunning completed: ${pastDueSubscriptions.length} processed, ` +
      `${warningsSent} warnings, ${gracePeriodWarningsSent} grace warnings, ` +
      `${subscriptionsSuspended} suspended`,
    );

    this.eventEmitter.emit('dunning.processed', {
      processed: pastDueSubscriptions.length,
      warningsSent,
      gracePeriodWarningsSent,
      subscriptionsSuspended,
    });

    return {
      processed: pastDueSubscriptions.length,
      warningsSent,
      gracePeriodWarningsSent,
      subscriptionsSuspended,
    };
  }

  /**
   * Suspend a subscription after grace period expires
   */
  async suspendSubscription(subscriptionId: string, reason: string): Promise<void> {
    this.logger.warn(`Suspending subscription ${subscriptionId}: ${reason}`);

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        vendorProfile: { include: { user: true } },
        plan: true,
      },
    });

    if (!subscription) {
      this.logger.error(`Subscription not found: ${subscriptionId}`);
      return;
    }

    // Update subscription status to EXPIRED (or you could use CANCELLED)
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'EXPIRED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Record status change
    await this.subscriptionRepository.createStatusHistory(subscriptionId, {
      fromStatus: subscription.status,
      toStatus: 'EXPIRED',
      reason,
    });

    // Send notification
    if (subscription.vendorProfile?.user?.email) {
      try {
        await this.emailService.sendSubscriptionExpiredEmail({
          userName: subscription.vendorProfile.user.firstName || 'Customer',
          userEmail: subscription.vendorProfile.user.email,
          planName: subscription.plan?.name || 'Subscription',
          reason,
        });
      } catch (error) {
        this.logger.error(`Failed to send suspension email: ${(error as Error).message}`);
      }
    }

    // Emit suspension event
    this.eventEmitter.emit('subscription.suspended', {
      subscriptionId,
      vendorProfileId: subscription.vendorProfileId,
      userId: subscription.vendorProfile?.user?.id,
      reason,
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Update payment metadata after a retry attempt
   */
  private async updatePaymentRetryMetadata(
    paymentId: string,
    newRetryCount: number,
    error?: string,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return;

    const currentMetadata = (payment.metadata as Record<string, unknown>) || {};
    const retryHistory = (currentMetadata.retryHistory as string[]) || [];

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...currentMetadata,
          retryCount: newRetryCount,
          lastRetryAt: new Date().toISOString(),
          retryHistory: [
            ...retryHistory,
            JSON.stringify({
              attempt: newRetryCount,
              timestamp: new Date().toISOString(),
              error: error || null,
            }),
          ],
          nextRetryAt: this.calculateNextRetryTime(newRetryCount)?.toISOString() || null,
        },
      },
    });
  }

  /**
   * Handle when maximum retries have been reached
   */
  private async handleMaxRetriesReached(payment: any, retryCount: number): Promise<void> {
    this.logger.warn(`Payment ${payment.id} has reached maximum retries (${retryCount})`);

    // Update subscription to PAST_DUE if not already
    if (payment.subscription && payment.subscription.status === 'ACTIVE') {
      await this.prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: 'PAST_DUE' },
      });

      // Record status change
      await this.subscriptionRepository.createStatusHistory(payment.subscriptionId, {
        fromStatus: 'ACTIVE',
        toStatus: 'PAST_DUE',
        reason: `Payment failed after ${retryCount} retry attempts`,
      });

      this.logger.log(`Subscription ${payment.subscriptionId} marked as PAST_DUE`);
    }

    // Send final failure notification
    await this.sendDunningNotification(payment, retryCount, 'max_retries_reached');

    // Emit max retries event
    this.eventEmitter.emit('payment.max-retries-reached', {
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      retryCount,
      gracePeriodEndsAt: addDays(new Date(), this.retryStrategy.gracePeriodDays),
    });
  }

  /**
   * Send dunning notification based on retry stage
   */
  private async sendDunningNotification(
    payment: any,
    retryCount: number,
    failureReason?: string,
  ): Promise<void> {
    const user = payment.subscription?.vendorProfile?.user;
    if (!user?.email) {
      this.logger.debug(`No email for dunning notification: payment ${payment.id}`);
      return;
    }

    const nextRetryAt = this.calculateNextRetryTime(retryCount);
    const emailType = this.getDunningEmailType(retryCount);

    try {
      await this.emailService.sendPaymentFailedEmail({
        userName: user.firstName || 'Customer',
        userEmail: user.email,
        planName: payment.subscription?.plan?.name || 'Subscription',
        amount: Number(payment.amount),
        currency: payment.currency,
        reason: failureReason,
        retryDate: nextRetryAt || undefined,
        daysRemaining: nextRetryAt
          ? undefined
          : this.retryStrategy.gracePeriodDays,
      });

      this.logger.log(`Sent ${emailType} dunning email to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send dunning email: ${(error as Error).message}`);
    }

    // Emit dunning notification event
    this.eventEmitter.emit('dunning.notification-sent', {
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      email: user.email,
      emailType,
      retryCount,
      nextRetryAt,
    });
  }

  /**
   * Send grace period ending notification
   */
  private async sendGracePeriodEndingNotification(sub: {
    subscriptionId: string;
    email: string | null;
    planName: string | null;
    gracePeriodEndsAt: Date;
    outstandingAmount: number;
    currency: string;
  }): Promise<void> {
    if (!sub.email) return;

    try {
      await this.emailService.sendPaymentFailedEmail({
        userName: 'Customer',
        userEmail: sub.email,
        planName: sub.planName || 'Subscription',
        amount: sub.outstandingAmount,
        currency: sub.currency,
        reason: 'Your subscription will be suspended soon due to payment failure',
        daysRemaining: differenceInDays(sub.gracePeriodEndsAt, new Date()),
      });

      this.logger.log(`Sent grace period ending notification to ${sub.email}`);
    } catch (error) {
      this.logger.error(`Failed to send grace period notification: ${(error as Error).message}`);
    }
  }

  /**
   * Send past due reminder notification
   */
  private async sendPastDueReminderNotification(sub: {
    subscriptionId: string;
    email: string | null;
    planName: string | null;
    daysPastDue: number;
    outstandingAmount: number;
    currency: string;
    gracePeriodEndsAt: Date;
  }): Promise<void> {
    if (!sub.email) return;

    const daysRemaining = differenceInDays(sub.gracePeriodEndsAt, new Date());

    try {
      await this.emailService.sendPaymentFailedEmail({
        userName: 'Customer',
        userEmail: sub.email,
        planName: sub.planName || 'Subscription',
        amount: sub.outstandingAmount,
        currency: sub.currency,
        reason: `Your payment is ${sub.daysPastDue} days past due`,
        daysRemaining: Math.max(0, daysRemaining),
      });

      this.logger.log(`Sent past due reminder to ${sub.email}`);
    } catch (error) {
      this.logger.error(`Failed to send past due reminder: ${(error as Error).message}`);
    }
  }

  /**
   * Get the dunning email type based on retry count
   */
  private getDunningEmailType(retryCount: number): DunningEmailType {
    switch (retryCount) {
      case 1:
        return DunningEmailType.FIRST_ATTEMPT_FAILED;
      case 2:
        return DunningEmailType.SECOND_ATTEMPT_FAILED;
      case 3:
        return DunningEmailType.THIRD_ATTEMPT_FAILED;
      default:
        return retryCount >= this.retryStrategy.maxRetries
          ? DunningEmailType.FINAL_ATTEMPT_FAILED
          : DunningEmailType.PAST_DUE_WARNING;
    }
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
