// ============================================================================
// SUBSCRIPTION EVENT LISTENER - Subscription Domain
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SubscriptionEvents,
  SubscriptionCreatedPayload,
  SubscriptionCancelledPayload,
  PaymentSucceededPayload,
  PaymentFailedPayload,
  UsageLimitReachedPayload,
} from './subscription.events';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SubscriptionEventListener {
  private readonly logger = new Logger(SubscriptionEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private async getVendorUserIdBySubscription(
    subscriptionId: string,
  ): Promise<string | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { vendorProfile: { select: { userId: true } } },
    });
    return subscription?.vendorProfile?.userId ?? null;
  }

  private async getVendorUserIdByVendorProfile(
    vendorProfileId: string,
  ): Promise<string | null> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: { userId: true },
    });
    return vendorProfile?.userId ?? null;
  }

  @OnEvent(SubscriptionEvents.CREATED)
  async handleSubscriptionCreated(payload: SubscriptionCreatedPayload) {
    this.logger.log(`Subscription created: ${payload.subscriptionId}`);

    const userId = await this.getVendorUserIdByVendorProfile(
      payload.vendorProfileId,
    );

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Subscription activated',
        message:
          'Your subscription is now active. Enjoy your premium features!',
        data: {
          subscriptionId: payload.subscriptionId,
          planId: payload.planId,
        },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(SubscriptionEvents.CANCELLED)
  async handleSubscriptionCancelled(payload: SubscriptionCancelledPayload) {
    this.logger.log(`Subscription cancelled: ${payload.subscriptionId}`);

    const userId = await this.getVendorUserIdByVendorProfile(
      payload.vendorProfileId,
    );

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Subscription cancelled',
        message: payload.immediate
          ? 'Your subscription has been cancelled and access is ending immediately.'
          : 'Your subscription will end at the close of your billing period.',
        data: {
          subscriptionId: payload.subscriptionId,
          reason: payload.reason,
        },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(SubscriptionEvents.RENEWED)
  async handleSubscriptionRenewed(payload: { subscriptionId: string }) {
    this.logger.log(`Subscription renewed: ${payload.subscriptionId}`);

    const userId = await this.getVendorUserIdBySubscription(
      payload.subscriptionId,
    );
    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Subscription renewed',
        message: 'Your subscription has been renewed successfully.',
        data: { subscriptionId: payload.subscriptionId },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(SubscriptionEvents.PAYMENT_SUCCEEDED)
  async handlePaymentSucceeded(payload: PaymentSucceededPayload) {
    this.logger.log(`Payment succeeded: ${payload.paymentId}`);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
      select: { subscriptionId: true },
    });
    const userId = invoice?.subscriptionId
      ? await this.getVendorUserIdBySubscription(invoice.subscriptionId)
      : null;

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Payment received',
        message: `We received your payment of ${payload.amount}.`,
        data: { paymentId: payload.paymentId, invoiceId: payload.invoiceId },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(SubscriptionEvents.PAYMENT_FAILED)
  async handlePaymentFailed(payload: PaymentFailedPayload) {
    this.logger.error(
      `Payment failed: ${payload.paymentId} - ${payload.error}`,
    );

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
      select: { subscriptionId: true },
    });
    const userId = invoice?.subscriptionId
      ? await this.getVendorUserIdBySubscription(invoice.subscriptionId)
      : null;

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Payment failed',
        message:
          'We could not process your recent payment. Please update your billing details.',
        data: {
          paymentId: payload.paymentId,
          invoiceId: payload.invoiceId,
          error: payload.error,
        },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(SubscriptionEvents.USAGE_LIMIT_REACHED)
  async handleUsageLimitReached(payload: UsageLimitReachedPayload) {
    this.logger.warn(
      `Usage limit reached: ${payload.featureType} for vendor ${payload.vendorProfileId}`,
    );

    const userId = await this.getVendorUserIdByVendorProfile(
      payload.vendorProfileId,
    );

    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Usage limit reached',
        message: `You've reached the limit for ${payload.featureType}. Consider upgrading your plan.`,
        data: {
          featureType: payload.featureType,
          subscriptionId: payload.subscriptionId,
        },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(SubscriptionEvents.TRIAL_ENDING)
  async handleTrialEnding(payload: {
    subscriptionId: string;
    daysLeft: number;
  }) {
    this.logger.log(
      `Trial ending: ${payload.subscriptionId} (${payload.daysLeft} days left)`,
    );

    const userId = await this.getVendorUserIdBySubscription(
      payload.subscriptionId,
    );
    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Trial ending soon',
        message: `Your trial ends in ${payload.daysLeft} days. Upgrade to keep access.`,
        data: {
          subscriptionId: payload.subscriptionId,
          daysLeft: payload.daysLeft,
        },
        actionUrl: '/business/profile',
      });
    }
  }

  @OnEvent(SubscriptionEvents.INVOICE_OVERDUE)
  async handleInvoiceOverdue(payload: {
    invoiceId: string;
    subscriptionId: string;
  }) {
    this.logger.warn(`Invoice overdue: ${payload.invoiceId}`);

    const userId = await this.getVendorUserIdBySubscription(
      payload.subscriptionId,
    );
    if (userId) {
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Invoice overdue',
        message: 'Your invoice is overdue. Please update your payment method.',
        data: {
          invoiceId: payload.invoiceId,
          subscriptionId: payload.subscriptionId,
        },
        actionUrl: '/business/profile',
      });
    }
  }
}
