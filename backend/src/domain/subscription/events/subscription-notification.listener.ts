// ============================================================================
// SUBSCRIPTION NOTIFICATION LISTENER - Subscription Domain
// ============================================================================
// Handles subscription events and creates in-app notifications + emits email events
// Events: subscription.created, subscription.activated-after-payment,
//         subscription.cancelled, subscription.renewed, subscription-payment.failed,
//         ad-credits.purchased
//
// Note: Email sending is handled by SubscriptionEmailListener.
// This listener focuses on in-app notifications and event forwarding.
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationType } from '@prisma/client';
import {
  SubscriptionEvents,
  SubscriptionCreatedPayload,
  SubscriptionCancelledPayload,
  SubscriptionActivatedPayload,
  SubscriptionRenewedPayload,
  SubscriptionPaymentFailedPayload,
  CreditsPurchasedPayload,
  SubscriptionExpiredPayload,
  RenewalReminderPayload,
  TrialEndingPayload,
} from './subscription.events';

// Additional event payload interfaces not exported from events file
interface TrialStartedPayload {
  subscriptionId: string;
  userId?: string;
  email?: string;
  planName?: string;
  trialEnd: Date;
}

interface TrialConvertedPayload {
  subscriptionId: string;
  planId: string;
}

interface TrialExpiredPayload {
  subscriptionId: string;
  downgradedToPlanId: string;
}

interface PaymentFailedPayload {
  subscriptionId: string;
  reason: string;
}

@Injectable()
export class SubscriptionNotificationListener {
  private readonly logger = new Logger(SubscriptionNotificationListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // HELPER METHODS - User ID lookups
  // ============================================================================

  private async getVendorUserIdBySubscription(
    subscriptionId: string,
  ): Promise<{ userId: string | null; email: string | null; planName: string | null }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        plan: { select: { name: true } },
        vendorProfile: {
          select: {
            userId: true,
            user: { select: { email: true } },
          },
        },
      },
    });
    return {
      userId: subscription?.vendorProfile?.userId ?? null,
      email: subscription?.vendorProfile?.user?.email ?? null,
      planName: subscription?.plan?.name ?? null,
    };
  }

  private async getVendorUserIdByVendorProfile(
    vendorProfileId: string,
  ): Promise<{ userId: string | null; email: string | null }> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: {
        userId: true,
        user: { select: { email: true } },
      },
    });
    return {
      userId: vendorProfile?.userId ?? null,
      email: vendorProfile?.user?.email ?? null,
    };
  }

  private async getUserById(
    userId: string,
  ): Promise<{ email: string | null; name: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });
    return {
      email: user?.email ?? null,
      name: user?.firstName ?? null,
    };
  }

  // ============================================================================
  // SUBSCRIPTION LIFECYCLE EVENTS
  // ============================================================================

  @OnEvent(SubscriptionEvents.CREATED)
  async handleSubscriptionCreated(payload: SubscriptionCreatedPayload): Promise<void> {
    this.logger.log(`Subscription created: ${payload.subscriptionId}`);

    const { userId, email, planName } = await this.getVendorUserIdByVendorProfile(
      payload.vendorProfileId,
    ).then(async (result) => {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: payload.planId },
        select: { name: true },
      });
      return { ...result, planName: plan?.name ?? 'Subscription' };
    });

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        title: 'Welcome to your subscription!',
        message: `Your ${planName} subscription has been created. Complete payment to activate your premium features.`,
        data: {
          subscriptionId: payload.subscriptionId,
          planId: payload.planId,
        },
        actionUrl: '/business/billing',
      });
    }

    // Email is handled by SubscriptionEmailListener
  }

  @OnEvent(SubscriptionEvents.ACTIVATED_AFTER_PAYMENT)
  async handleSubscriptionActivatedAfterPayment(
    payload: SubscriptionActivatedPayload,
  ): Promise<void> {
    this.logger.log(
      `Subscription activated after payment: ${payload.subscriptionId} (isUpgrade: ${payload.isUpgrade})`,
    );

    let userId: string | null = null;

    // Handle both vendor and user subscriptions
    if (payload.vendorProfileId) {
      const vendorData = await this.getVendorUserIdByVendorProfile(
        payload.vendorProfileId,
      );
      userId = vendorData.userId;
    } else if (payload.userId) {
      userId = payload.userId;
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: payload.planId },
      select: { name: true },
    });
    const planName = plan?.name ?? 'Subscription';

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        title: payload.isUpgrade
          ? 'Subscription upgraded successfully!'
          : 'Subscription activated!',
        message: payload.isUpgrade
          ? `Your subscription has been upgraded to ${planName}. Enjoy your enhanced features!`
          : `Welcome to ${planName}! Your subscription is now active.`,
        data: {
          subscriptionId: payload.subscriptionId,
          planId: payload.planId,
          isUpgrade: payload.isUpgrade,
          paymentId: payload.paymentId,
        },
        actionUrl: payload.vendorProfileId ? '/business/profile' : '/account/subscription',
        priority: 'high',
      });
    }

    // Email is handled by SubscriptionEmailListener
  }

  /**
   * Handle user subscription activation after payment
   * This handles the user-subscription.* prefix events
   */
  @OnEvent('user-subscription.activated-after-payment')
  async handleUserSubscriptionActivatedAfterPayment(
    payload: SubscriptionActivatedPayload,
  ): Promise<void> {
    this.logger.log(
      `User subscription activated after payment: ${payload.subscriptionId} (isUpgrade: ${payload.isUpgrade})`,
    );

    if (!payload.userId) {
      this.logger.warn(`No userId in user subscription payload`);
      return;
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: payload.planId },
      select: { name: true },
    });
    const planName = plan?.name ?? 'Subscription';

    await this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.SUBSCRIPTION_ACTIVATED,
      title: payload.isUpgrade
        ? 'Subscription upgraded successfully!'
        : 'Subscription activated!',
      message: payload.isUpgrade
        ? `Your subscription has been upgraded to ${planName}. Enjoy your enhanced features!`
        : `Welcome to ${planName}! Your subscription is now active.`,
      data: {
        subscriptionId: payload.subscriptionId,
        planId: payload.planId,
        isUpgrade: payload.isUpgrade,
        paymentId: payload.paymentId,
      },
      actionUrl: '/settings/subscription',
      priority: 'high',
    });

    // Emit email event for the email listener
    const user = await this.getUserById(payload.userId);
    if (user.email) {
      this.eventEmitter.emit('subscription.activated-after-payment', {
        ...payload,
        email: user.email,
      });
    }
  }

  @OnEvent(SubscriptionEvents.CANCELLED)
  async handleSubscriptionCancelled(payload: SubscriptionCancelledPayload): Promise<void> {
    this.logger.log(`Subscription cancelled: ${payload.subscriptionId}`);

    const { userId, planName } = await this.getVendorUserIdByVendorProfile(
      payload.vendorProfileId,
    ).then(async (result) => {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: payload.subscriptionId },
        select: { plan: { select: { name: true } } },
      });
      return { ...result, planName: subscription?.plan?.name ?? 'Subscription' };
    });

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_CANCELLED,
        title: 'Subscription cancelled',
        message: payload.immediate
          ? `Your ${planName} subscription has been cancelled and access has ended.`
          : `Your ${planName} subscription has been cancelled. You'll retain access until the end of your billing period.`,
        data: {
          subscriptionId: payload.subscriptionId,
          reason: payload.reason,
          immediate: payload.immediate,
        },
        actionUrl: '/business/billing',
      });
    }

    // Email is handled by SubscriptionEmailListener
  }

  @OnEvent(SubscriptionEvents.RENEWED)
  async handleSubscriptionRenewed(payload: SubscriptionRenewedPayload): Promise<void> {
    this.logger.log(`Subscription renewed: ${payload.subscriptionId}`);

    const { userId, planName } = await this.getVendorUserIdBySubscription(
      payload.subscriptionId,
    );

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_RENEWED,
        title: 'Subscription renewed',
        message: `Your ${planName ?? 'subscription'} has been renewed successfully. Thank you for your continued support!`,
        data: {
          subscriptionId: payload.subscriptionId,
        },
        actionUrl: '/business/billing',
      });
    }

    // Email is handled by SubscriptionEmailListener
  }

  @OnEvent(SubscriptionEvents.SUBSCRIPTION_PAYMENT_FAILED)
  async handleSubscriptionPaymentFailed(
    payload: SubscriptionPaymentFailedPayload,
  ): Promise<void> {
    this.logger.warn(
      `Subscription payment failed for ${payload.subscriptionId}: ${payload.reason}`,
    );

    let userId: string | null = null;
    let planName: string | null = null;

    // Handle both vendor and user subscriptions
    if (payload.vendorProfileId) {
      const vendorData = await this.getVendorUserIdByVendorProfile(
        payload.vendorProfileId,
      );
      userId = vendorData.userId;

      const subscription = await this.prisma.subscription.findUnique({
        where: { id: payload.subscriptionId },
        select: { plan: { select: { name: true } } },
      });
      planName = subscription?.plan?.name ?? null;
    } else if (payload.userId) {
      userId = payload.userId;

      const userSubscription = await this.prisma.userSubscription.findUnique({
        where: { id: payload.subscriptionId },
        select: { plan: { select: { name: true } } },
      });
      planName = userSubscription?.plan?.name ?? null;
    } else {
      // Try to get from subscription
      const subscriptionData = await this.getVendorUserIdBySubscription(
        payload.subscriptionId,
      );
      userId = subscriptionData.userId;
      planName = subscriptionData.planName;
    }

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
        title: 'Payment failed',
        message: `We couldn't process your payment for ${planName ?? 'your subscription'}. Please update your payment method to avoid service interruption.`,
        data: {
          subscriptionId: payload.subscriptionId,
          reason: payload.reason,
          attemptCount: payload.attemptCount,
        },
        actionUrl: '/account/payment-methods',
        priority: 'high',
      });
    }

    // Emit email event for the email listener to handle
    this.eventEmitter.emit('email.subscription.payment-failed', {
      subscriptionId: payload.subscriptionId,
      reason: payload.reason,
      attemptCount: payload.attemptCount,
    });
  }

  // ============================================================================
  // AD CREDITS EVENTS
  // ============================================================================

  @OnEvent(SubscriptionEvents.CREDITS_PURCHASED)
  async handleCreditsPurchased(payload: CreditsPurchasedPayload): Promise<void> {
    this.logger.log(
      `Credits purchased: ${payload.credits} credits for vendor ${payload.vendorProfileId}`,
    );

    let userId: string | null = payload.userId ?? null;
    let email: string | null = null;

    if (!userId && payload.vendorProfileId) {
      const vendorData = await this.getVendorUserIdByVendorProfile(
        payload.vendorProfileId,
      );
      userId = vendorData.userId;
      email = vendorData.email;
    } else if (userId) {
      const userData = await this.getUserById(userId);
      email = userData.email;
    }

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.CREDITS_PURCHASED,
        title: 'Ad credits purchased',
        message: `You have successfully purchased ${payload.credits.toLocaleString()} ad credits for ${this.formatCurrency(payload.amount)}.`,
        data: {
          vendorProfileId: payload.vendorProfileId,
          credits: payload.credits,
          amount: payload.amount,
          transactionId: payload.transactionId,
        },
        actionUrl: '/business/campaigns',
      });
    }

    // Emit email event for credits purchase confirmation
    if (email) {
      this.eventEmitter.emit('email.credits.purchased', {
        email,
        vendorProfileId: payload.vendorProfileId,
        credits: payload.credits,
        amount: payload.amount,
        transactionId: payload.transactionId,
      });
    }
  }

  // ============================================================================
  // RENEWAL REMINDER EVENTS (Scheduler-emitted)
  // ============================================================================

  @OnEvent(SubscriptionEvents.RENEWAL_REMINDER)
  async handleRenewalReminder(payload: RenewalReminderPayload): Promise<void> {
    this.logger.log(`Sending renewal reminder for subscription ${payload.subscriptionId}`);

    // Send in-app notification
    if (payload.userId) {
      await this.notificationService.createNotification({
        userId: payload.userId,
        type: NotificationType.SUBSCRIPTION_EXPIRING_SOON,
        title: 'Subscription renewing soon',
        message: `Your ${payload.planName || 'subscription'} will renew on ${this.formatDate(payload.renewalDate)}.`,
        data: {
          subscriptionId: payload.subscriptionId,
          renewalDate: payload.renewalDate.toISOString(),
          type: payload.type,
        },
        actionUrl: payload.type === 'vendor' ? '/business/billing' : '/account/subscription',
      });
    }

    // Email is handled by SubscriptionEmailListener which listens to same event
  }

  @OnEvent('subscription.payment-failed')
  async handlePaymentFailed(payload: PaymentFailedPayload): Promise<void> {
    this.logger.warn(
      `Payment failed for subscription ${payload.subscriptionId}: ${payload.reason}`,
    );

    // Forward to the main payment failed handler with proper structure
    await this.handleSubscriptionPaymentFailed({
      subscriptionId: payload.subscriptionId,
      reason: payload.reason,
    });
  }

  // ============================================================================
  // TRIAL EVENTS
  // ============================================================================

  @OnEvent('trial.ending')
  async handleTrialEnding(payload: TrialEndingPayload): Promise<void> {
    this.logger.log(`Sending trial ending reminder for subscription ${payload.subscriptionId}`);

    // Send in-app notification
    if (payload.userId) {
      await this.notificationService.createNotification({
        userId: payload.userId,
        type: NotificationType.SUBSCRIPTION_EXPIRING_SOON,
        title: 'Your trial is ending soon',
        message: `Your ${payload.planName || 'trial'} ends on ${this.formatDate(payload.trialEnd)}. Upgrade now to keep access.`,
        data: {
          subscriptionId: payload.subscriptionId,
          trialEnd: payload.trialEnd.toISOString(),
          type: payload.type,
        },
        actionUrl: payload.type === 'vendor' ? '/business/upgrade' : '/account/upgrade',
        priority: 'high',
      });
    }

    // Email is handled by SubscriptionEmailListener which listens to same event
  }

  @OnEvent('trial.started')
  async handleTrialStarted(payload: TrialStartedPayload): Promise<void> {
    this.logger.log(`Sending trial welcome for subscription ${payload.subscriptionId}`);

    // Send in-app notification
    if (payload.userId) {
      await this.notificationService.createNotification({
        userId: payload.userId,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        title: 'Welcome to your trial!',
        message: `Your ${payload.planName || 'trial'} has started. Explore all premium features until ${this.formatDate(payload.trialEnd)}.`,
        data: {
          subscriptionId: payload.subscriptionId,
          trialEnd: payload.trialEnd.toISOString(),
        },
        actionUrl: '/getting-started',
      });
    }

    // Emit email event for trial welcome
    if (payload.email) {
      this.eventEmitter.emit('email.trial.welcome', {
        email: payload.email,
        subscriptionId: payload.subscriptionId,
        planName: payload.planName,
        trialEnd: payload.trialEnd,
      });
    }
  }

  @OnEvent('trial.converted')
  async handleTrialConverted(payload: TrialConvertedPayload): Promise<void> {
    this.logger.log(`Trial ${payload.subscriptionId} converted to paid`);

    // Get subscription details
    const { userId, email, planName } = await this.getVendorUserIdBySubscription(
      payload.subscriptionId,
    );

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        title: 'Trial converted to paid subscription',
        message: `Congratulations! Your trial has been converted to a full ${planName ?? 'subscription'}.`,
        data: {
          subscriptionId: payload.subscriptionId,
          planId: payload.planId,
        },
        actionUrl: '/business/profile',
      });
    }

    // Emit email event
    if (email) {
      this.eventEmitter.emit('email.trial.converted', {
        email,
        subscriptionId: payload.subscriptionId,
        planName,
      });
    }
  }

  @OnEvent('trial.expired')
  async handleTrialExpired(payload: TrialExpiredPayload): Promise<void> {
    this.logger.log(
      `Trial ${payload.subscriptionId} expired, downgraded to plan ${payload.downgradedToPlanId}`,
    );

    const { userId, email, planName } = await this.getVendorUserIdBySubscription(
      payload.subscriptionId,
    );

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_CANCELLED,
        title: 'Trial expired',
        message: `Your ${planName ?? 'trial'} has expired. Your account has been downgraded to the free plan.`,
        data: {
          subscriptionId: payload.subscriptionId,
          downgradedToPlanId: payload.downgradedToPlanId,
        },
        actionUrl: '/business/upgrade',
        priority: 'high',
      });
    }

    // Emit email event
    if (email) {
      this.eventEmitter.emit('email.trial.expired', {
        email,
        subscriptionId: payload.subscriptionId,
        planName,
        downgradedToPlanId: payload.downgradedToPlanId,
      });
    }
  }

  // ============================================================================
  // SUBSCRIPTION LIFECYCLE EVENTS (Additional)
  // ============================================================================

  @OnEvent('subscription.expired')
  async handleSubscriptionExpired(payload: SubscriptionExpiredPayload): Promise<void> {
    this.logger.log(`Subscription ${payload.subscriptionId} expired`);

    const { userId, planName } = await this.getVendorUserIdByVendorProfile(
      payload.vendorProfileId,
    ).then(async (result) => {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: payload.subscriptionId },
        select: { plan: { select: { name: true } } },
      });
      return { ...result, planName: subscription?.plan?.name ?? 'Subscription' };
    });

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SUBSCRIPTION_CANCELLED,
        title: 'Subscription expired',
        message: `Your ${planName} has expired. Renew now to restore your premium features.`,
        data: {
          subscriptionId: payload.subscriptionId,
          vendorProfileId: payload.vendorProfileId,
        },
        actionUrl: '/business/billing',
        priority: 'high',
      });
    }

    // Email is handled by SubscriptionEmailListener which listens to same event
  }

  // ============================================================================
  // SCHEDULER MONITORING EVENTS
  // ============================================================================

  @OnEvent('scheduler.renewals.completed')
  async handleRenewalsCompleted(payload: {
    renewed: number;
    failed: number;
    total: number;
  }): Promise<void> {
    this.logger.log(
      `Renewal scheduler completed: ${payload.renewed}/${payload.total} renewed, ${payload.failed} failed`,
    );

    // Send admin notification if failure rate is high
    if (payload.failed > 0 && payload.total > 0 && payload.failed / payload.total > 0.1) {
      this.logger.warn(
        `High renewal failure rate: ${((payload.failed / payload.total) * 100).toFixed(1)}%`,
      );

      // Emit admin alert event
      this.eventEmitter.emit('admin.alert.renewal-failures', {
        renewed: payload.renewed,
        failed: payload.failed,
        total: payload.total,
        failureRate: payload.failed / payload.total,
      });
    }
  }

  @OnEvent('scheduler.renewals.failed')
  async handleRenewalsFailed(payload: { error: string }): Promise<void> {
    this.logger.error(`Renewal scheduler failed: ${payload.error}`);

    // Emit urgent admin alert
    this.eventEmitter.emit('admin.alert.scheduler-failure', {
      scheduler: 'renewals',
      error: payload.error,
    });
  }

  @OnEvent('scheduler.trials.completed')
  async handleTrialsCompleted(payload: {
    converted: number;
    downgraded: number;
    total: number;
  }): Promise<void> {
    this.logger.log(
      `Trial scheduler completed: ${payload.converted} converted, ${payload.downgraded} downgraded, ${payload.total} total`,
    );
  }

  @OnEvent('scheduler.trials.failed')
  async handleTrialsFailed(payload: { error: string }): Promise<void> {
    this.logger.error(`Trial scheduler failed: ${payload.error}`);

    // Emit admin alert
    this.eventEmitter.emit('admin.alert.scheduler-failure', {
      scheduler: 'trials',
      error: payload.error,
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  private formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  }
}
