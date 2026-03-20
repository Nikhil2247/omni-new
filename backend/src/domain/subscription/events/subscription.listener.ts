// ============================================================================
// SUBSCRIPTION EVENT LISTENER - Subscription Domain
// ============================================================================
// Handles non-notification subscription events (analytics, state updates, etc.)
// Notification handling is delegated to SubscriptionNotificationListener
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SubscriptionEvents,
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

  // ============================================================================
  // PAYMENT EVENTS
  // ============================================================================

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
        type: NotificationType.SUBSCRIPTION_PAYMENT_FAILED,
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

  // ============================================================================
  // USAGE EVENTS
  // ============================================================================

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

  // ============================================================================
  // INVOICE EVENTS
  // ============================================================================

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
