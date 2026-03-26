// ============================================================================
// SUBSCRIPTION EMAIL LISTENER - Email Event Handlers
// ============================================================================
// Listens to subscription events and triggers appropriate email notifications
// Works alongside subscription.listener.ts for in-app notifications
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  SubscriptionEmailService,
  SubscriptionEmailContext,
  PaymentReceiptContext,
  UsageAlertContext,
  EventCreditPurchaseContext,
} from '../services/subscription-email.service';
import { SubscriptionEvents } from './subscription.events';

// Feature display names for email alerts
const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  guests_per_event: 'Guests per Event',
  memory_uploads_per_event: 'Memory Uploads',
  memory_storage_mb: 'Memory Storage',
  whatsapp_invites_per_event: 'WhatsApp Invites',
  portfolios_limit: 'Portfolio Albums',
  images_per_album: 'Images per Album',
  services_limit: 'Services',
  ad_credits_monthly: 'Ad Credits',
  search_boost: 'Search Boost',
};

// ============================================================================
// EVENT PAYLOAD INTERFACES
// ============================================================================

interface SubscriptionActivatedPayload {
  subscriptionId: string;
  vendorProfileId: string;
  planId: string;
  userId?: string;
  email?: string;
  invoiceId?: string;
  amount?: number;
  currency?: string;
}

interface PaymentSucceededPayload {
  paymentId: string;
  invoiceId: string;
  amount: number;
  currency?: string;
  subscriptionId?: string;
}

interface PaymentFailedPayload {
  paymentId: string;
  invoiceId: string;
  error: string;
  subscriptionId?: string;
  retryDate?: Date;
}

interface SubscriptionCancelledPayload {
  subscriptionId: string;
  vendorProfileId: string;
  immediate: boolean;
  reason?: string;
}

interface SubscriptionRenewedPayload {
  subscriptionId: string;
  amount?: number;
  currency?: string;
  nextBillingDate?: Date;
}

interface RenewalReminderPayload {
  subscriptionId: string;
  userId?: string;
  email?: string;
  planName?: string;
  renewalDate: Date;
  amount?: number;
  currency?: string;
  daysRemaining?: number;
  type: 'vendor' | 'user';
}

interface TrialEndingPayload {
  subscriptionId: string;
  userId?: string;
  email?: string;
  planName?: string;
  trialEnd: Date;
  daysRemaining?: number;
  type: 'vendor' | 'user';
}

interface SubscriptionExpiredPayload {
  subscriptionId: string;
  vendorProfileId: string;
}

interface EventCreditPurchasedPayload {
  userId: string;
  tier: 'BASIC' | 'PREMIUM';
  creditCount: number;
  bundleType: string;
  amount: number;
  currency?: string;
  transactionId?: string;
  paymentId?: string;
}

// ============================================================================
// LISTENER SERVICE
// ============================================================================

@Injectable()
export class SubscriptionEmailListener {
  private readonly logger = new Logger(SubscriptionEmailListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionEmailService: SubscriptionEmailService,
  ) {}

  // ============================================================================
  // SUBSCRIPTION ACTIVATION - Welcome + Receipt
  // ============================================================================

  /**
   * Handle subscription.activated-after-payment event
   * Sends welcome email and payment receipt
   */
  @OnEvent('subscription.activated-after-payment')
  async handleSubscriptionActivatedAfterPayment(
    payload: SubscriptionActivatedPayload,
  ): Promise<void> {
    this.logger.log(
      `Subscription activated after payment: ${payload.subscriptionId}`,
    );

    try {
      const context = await this.buildSubscriptionContext(payload.subscriptionId);

      if (!context) {
        this.logger.warn(
          `Could not build context for subscription ${payload.subscriptionId}`,
        );
        return;
      }

      // Send welcome email
      const welcomeResult = await this.subscriptionEmailService.sendWelcomeEmail(
        context,
      );

      if (welcomeResult.success) {
        this.logger.log(`Welcome email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send welcome email to ${context.userEmail}: ${welcomeResult.error}`,
        );
      }

      // Send payment receipt if invoice exists
      if (payload.invoiceId) {
        await this.sendPaymentReceiptForInvoice(
          payload.invoiceId,
          context,
          payload.amount,
          payload.currency,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling subscription activation email for ${payload.subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Handle subscription.created event
   * Alternative event for subscription creation (if no payment required)
   */
  @OnEvent(SubscriptionEvents.CREATED)
  async handleSubscriptionCreated(payload: {
    subscriptionId: string;
    vendorProfileId: string;
    planId: string;
  }): Promise<void> {
    this.logger.log(`Subscription created: ${payload.subscriptionId}`);

    try {
      const context = await this.buildSubscriptionContext(payload.subscriptionId);

      if (!context) {
        this.logger.warn(
          `Could not build context for subscription ${payload.subscriptionId}`,
        );
        return;
      }

      // Send welcome email
      const result = await this.subscriptionEmailService.sendWelcomeEmail(context);

      if (result.success) {
        this.logger.log(`Welcome email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send welcome email to ${context.userEmail}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling subscription created email for ${payload.subscriptionId}:`,
        error,
      );
    }
  }

  // ============================================================================
  // PAYMENT EVENTS
  // ============================================================================

  /**
   * Handle payment.succeeded event
   * Sends payment receipt email
   */
  @OnEvent(SubscriptionEvents.PAYMENT_SUCCEEDED)
  async handlePaymentSucceeded(payload: PaymentSucceededPayload): Promise<void> {
    this.logger.log(`Payment succeeded: ${payload.paymentId}`);

    try {
      // Get invoice and subscription details
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: payload.invoiceId },
        include: {
          subscription: {
            include: {
              vendorProfile: {
                include: {
                  user: true,
                },
              },
              plan: true,
            },
          },
        },
      });

      if (!invoice?.subscription) {
        this.logger.warn(`Invoice ${payload.invoiceId} not found or no subscription`);
        return;
      }

      const user = invoice.subscription.vendorProfile?.user;
      const plan = invoice.subscription.plan;

      if (!user?.email) {
        this.logger.warn(`No user email found for invoice ${payload.invoiceId}`);
        return;
      }

      const receiptContext: PaymentReceiptContext = {
        userName: user.firstName || user.email.split('@')[0],
        userEmail: user.email,
        planName: plan?.name || 'Subscription',
        invoiceNumber: invoice.invoiceNumber || invoice.id,
        paymentDate: new Date(),
        paymentMethod: 'Card', // Would come from payment details
        totalAmount: payload.amount,
        amount: payload.amount,
        currency: payload.currency || 'INR',
        nextBillingDate: invoice.subscription.currentPeriodEnd || undefined,
        taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : undefined,
      };

      const result =
        await this.subscriptionEmailService.sendPaymentConfirmationEmail(
          receiptContext,
        );

      if (result.success) {
        this.logger.log(`Payment receipt email sent to ${user.email}`);
      } else {
        this.logger.error(
          `Failed to send payment receipt email to ${user.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling payment succeeded email for ${payload.paymentId}:`,
        error,
      );
    }
  }

  /**
   * Handle payment.failed event
   * Sends payment failed notification email
   */
  @OnEvent(SubscriptionEvents.PAYMENT_FAILED)
  async handlePaymentFailed(payload: PaymentFailedPayload): Promise<void> {
    this.logger.log(`Payment failed: ${payload.paymentId}`);

    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: payload.invoiceId },
        include: {
          subscription: {
            include: {
              vendorProfile: {
                include: {
                  user: true,
                },
              },
              plan: true,
            },
          },
        },
      });

      if (!invoice?.subscription) {
        this.logger.warn(`Invoice ${payload.invoiceId} not found or no subscription`);
        return;
      }

      const user = invoice.subscription.vendorProfile?.user;
      const plan = invoice.subscription.plan;

      if (!user?.email) {
        this.logger.warn(`No user email found for invoice ${payload.invoiceId}`);
        return;
      }

      const context: SubscriptionEmailContext = {
        userName: user.firstName || user.email.split('@')[0],
        userEmail: user.email,
        planName: plan?.name || 'Subscription',
        amount: invoice.totalAmount ? Number(invoice.totalAmount) : undefined,
        currency: invoice.currency || 'INR',
        reason: payload.error,
        retryDate: payload.retryDate,
        subscriptionId: invoice.subscription.id,
      };

      const result = await this.subscriptionEmailService.sendPaymentFailedEmail(
        context,
      );

      if (result.success) {
        this.logger.log(`Payment failed email sent to ${user.email}`);
      } else {
        this.logger.error(
          `Failed to send payment failed email to ${user.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling payment failed email for ${payload.paymentId}:`,
        error,
      );
    }
  }

  // ============================================================================
  // SUBSCRIPTION LIFECYCLE EVENTS
  // ============================================================================

  /**
   * Handle subscription.cancelled event
   * Sends cancellation confirmation email
   */
  @OnEvent(SubscriptionEvents.CANCELLED)
  async handleSubscriptionCancelled(
    payload: SubscriptionCancelledPayload,
  ): Promise<void> {
    this.logger.log(`Subscription cancelled: ${payload.subscriptionId}`);

    try {
      const context = await this.buildSubscriptionContext(payload.subscriptionId);

      if (!context) {
        this.logger.warn(
          `Could not build context for subscription ${payload.subscriptionId}`,
        );
        return;
      }

      // Add cancellation-specific details
      context.cancellationDate = new Date();
      context.reason = payload.reason;

      const result =
        await this.subscriptionEmailService.sendCancellationConfirmationEmail(
          context,
        );

      if (result.success) {
        this.logger.log(`Cancellation confirmation email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send cancellation email to ${context.userEmail}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling subscription cancelled email for ${payload.subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Handle subscription.renewed event
   * Sends renewal confirmation email
   */
  @OnEvent(SubscriptionEvents.RENEWED)
  async handleSubscriptionRenewed(payload: SubscriptionRenewedPayload): Promise<void> {
    this.logger.log(`Subscription renewed: ${payload.subscriptionId}`);

    try {
      const context = await this.buildSubscriptionContext(payload.subscriptionId);

      if (!context) {
        this.logger.warn(
          `Could not build context for subscription ${payload.subscriptionId}`,
        );
        return;
      }

      // Override with payload values if provided
      if (payload.amount) {
        context.amount = payload.amount;
      }
      if (payload.currency) {
        context.currency = payload.currency;
      }
      if (payload.nextBillingDate) {
        context.nextBillingDate = payload.nextBillingDate;
      }

      const result =
        await this.subscriptionEmailService.sendRenewalConfirmationEmail(context);

      if (result.success) {
        this.logger.log(`Renewal confirmation email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send renewal email to ${context.userEmail}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling subscription renewed email for ${payload.subscriptionId}:`,
        error,
      );
    }
  }

  /**
   * Handle subscription.expired event
   * Sends subscription expired email
   */
  @OnEvent(SubscriptionEvents.EXPIRED)
  async handleSubscriptionExpired(payload: SubscriptionExpiredPayload): Promise<void> {
    this.logger.log(`Subscription expired: ${payload.subscriptionId}`);

    try {
      const context = await this.buildSubscriptionContext(payload.subscriptionId);

      if (!context) {
        this.logger.warn(
          `Could not build context for subscription ${payload.subscriptionId}`,
        );
        return;
      }

      const result =
        await this.subscriptionEmailService.sendSubscriptionExpiredEmail(context);

      if (result.success) {
        this.logger.log(`Subscription expired email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send expired email to ${context.userEmail}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling subscription expired email for ${payload.subscriptionId}:`,
        error,
      );
    }
  }

  // ============================================================================
  // REMINDER EVENTS
  // ============================================================================

  /**
   * Handle subscription.expiring-soon / subscription.renewal-reminder event
   * Sends renewal reminder email (typically 3 days before)
   */
  @OnEvent('subscription.expiring-soon')
  async handleExpiringsSoon(payload: RenewalReminderPayload): Promise<void> {
    this.logger.log(`Subscription expiring soon: ${payload.subscriptionId}`);

    await this.sendRenewalReminderEmail(payload);
  }

  @OnEvent('subscription.renewal-reminder')
  async handleRenewalReminder(payload: RenewalReminderPayload): Promise<void> {
    this.logger.log(`Renewal reminder: ${payload.subscriptionId}`);

    await this.sendRenewalReminderEmail(payload);
  }

  private async sendRenewalReminderEmail(
    payload: RenewalReminderPayload,
  ): Promise<void> {
    try {
      // If email is provided in payload, use it
      if (payload.email) {
        const context: SubscriptionEmailContext = {
          userName: payload.userId || 'Valued Customer',
          userEmail: payload.email,
          planName: payload.planName || 'Subscription',
          nextBillingDate: payload.renewalDate,
          amount: payload.amount,
          currency: payload.currency,
          daysRemaining: payload.daysRemaining || 3,
          subscriptionId: payload.subscriptionId,
        };

        // Get user name if we have userId
        if (payload.userId) {
          const user = await this.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { firstName: true, email: true },
          });
          if (user?.firstName) {
            context.userName = user.firstName;
          }
        }

        const result =
          await this.subscriptionEmailService.sendRenewalReminderEmail(context);

        if (result.success) {
          this.logger.log(`Renewal reminder email sent to ${payload.email}`);
        } else {
          this.logger.error(
            `Failed to send renewal reminder email to ${payload.email}: ${result.error}`,
          );
        }
        return;
      }

      // Otherwise, build context from subscription
      const context = await this.buildSubscriptionContext(payload.subscriptionId);

      if (!context) {
        this.logger.warn(
          `Could not build context for subscription ${payload.subscriptionId}`,
        );
        return;
      }

      context.nextBillingDate = payload.renewalDate;
      context.daysRemaining = payload.daysRemaining || 3;

      const result =
        await this.subscriptionEmailService.sendRenewalReminderEmail(context);

      if (result.success) {
        this.logger.log(`Renewal reminder email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send renewal reminder email to ${context.userEmail}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling renewal reminder email for ${payload.subscriptionId}:`,
        error,
      );
    }
  }

  // ============================================================================
  // TRIAL EVENTS
  // ============================================================================

  /**
   * Handle trial.ending / subscription.trial-ending event
   * Sends trial ending notification email
   */
  @OnEvent('trial.ending')
  async handleTrialEnding(payload: TrialEndingPayload): Promise<void> {
    this.logger.log(`Trial ending: ${payload.subscriptionId}`);

    await this.sendTrialEndingEmail(payload);
  }

  @OnEvent(SubscriptionEvents.TRIAL_ENDING)
  async handleSubscriptionTrialEnding(payload: {
    subscriptionId: string;
    daysLeft: number;
  }): Promise<void> {
    this.logger.log(`Subscription trial ending: ${payload.subscriptionId}`);

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: payload.subscriptionId },
      select: { trialEnd: true },
    });

    await this.sendTrialEndingEmail({
      subscriptionId: payload.subscriptionId,
      trialEnd: subscription?.trialEnd || new Date(),
      daysRemaining: payload.daysLeft,
      type: 'vendor',
    });
  }

  private async sendTrialEndingEmail(payload: TrialEndingPayload): Promise<void> {
    try {
      // If email is provided in payload, use it
      if (payload.email) {
        const context: SubscriptionEmailContext = {
          userName: payload.userId || 'Valued Customer',
          userEmail: payload.email,
          planName: payload.planName || 'Trial',
          trialEndDate: payload.trialEnd,
          daysRemaining: payload.daysRemaining || 3,
          subscriptionId: payload.subscriptionId,
        };

        // Get user name if we have userId
        if (payload.userId) {
          const user = await this.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { firstName: true, email: true },
          });
          if (user?.firstName) {
            context.userName = user.firstName;
          }
        }

        const result = await this.subscriptionEmailService.sendTrialEndingEmail(
          context,
        );

        if (result.success) {
          this.logger.log(`Trial ending email sent to ${payload.email}`);
        } else {
          this.logger.error(
            `Failed to send trial ending email to ${payload.email}: ${result.error}`,
          );
        }
        return;
      }

      // Otherwise, build context from subscription
      const context = await this.buildSubscriptionContext(payload.subscriptionId);

      if (!context) {
        this.logger.warn(
          `Could not build context for subscription ${payload.subscriptionId}`,
        );
        return;
      }

      context.trialEndDate = payload.trialEnd;
      context.daysRemaining = payload.daysRemaining || 3;

      const result = await this.subscriptionEmailService.sendTrialEndingEmail(
        context,
      );

      if (result.success) {
        this.logger.log(`Trial ending email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send trial ending email to ${context.userEmail}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling trial ending email for ${payload.subscriptionId}:`,
        error,
      );
    }
  }

  // ============================================================================
  // EVENT CREDIT EVENTS
  // ============================================================================

  /**
   * Handle event-credit.purchased event
   * Sends purchase confirmation email when user buys event credits
   */
  @OnEvent('event-credit.purchased')
  async handleEventCreditPurchased(
    payload: EventCreditPurchasedPayload,
  ): Promise<void> {
    this.logger.log(
      `Event credit purchased: ${payload.creditCount} ${payload.tier} credits for user ${payload.userId}`,
    );

    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, firstName: true },
      });

      if (!user?.email) {
        this.logger.warn(`Could not find user ${payload.userId} for event credit email`);
        return;
      }

      const context: EventCreditPurchaseContext = {
        userName: user.firstName || user.email.split('@')[0],
        userEmail: user.email,
        tier: payload.tier,
        creditCount: payload.creditCount,
        bundleType: payload.bundleType,
        amount: payload.amount,
        currency: payload.currency || 'INR',
        transactionId: payload.transactionId,
      };

      const result =
        await this.subscriptionEmailService.sendEventCreditPurchaseEmail(context);

      if (result.success) {
        this.logger.log(`Event credit purchase email sent to ${user.email}`);
      } else {
        this.logger.error(
          `Failed to send event credit purchase email to ${user.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling event credit purchased email for user ${payload.userId}:`,
        error,
      );
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Build email context from subscription ID
   */
  private async buildSubscriptionContext(
    subscriptionId: string,
  ): Promise<SubscriptionEmailContext | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        vendorProfile: {
          include: {
            user: true,
          },
        },
        plan: true,
        price: true,
      },
    });

    if (!subscription) {
      return null;
    }

    const user = subscription.vendorProfile?.user;

    if (!user?.email) {
      return null;
    }

    return {
      userName: user.firstName || user.email.split('@')[0],
      userEmail: user.email,
      planName: subscription.plan?.name || 'Subscription',
      planDescription: subscription.plan?.description || undefined,
      amount: subscription.price?.amount
        ? Number(subscription.price.amount)
        : undefined,
      currency: subscription.price?.currency || 'INR',
      nextBillingDate: subscription.currentPeriodEnd || undefined,
      currentPeriodEnd: subscription.currentPeriodEnd || undefined,
      trialEndDate: subscription.trialEnd || undefined,
      subscriptionId: subscription.id,
    };
  }

  /**
   * Send payment receipt for a specific invoice
   */
  private async sendPaymentReceiptForInvoice(
    invoiceId: string,
    baseContext: SubscriptionEmailContext,
    amount?: number,
    currency?: string,
  ): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      this.logger.warn(`Invoice ${invoiceId} not found`);
      return;
    }

    const receiptContext: PaymentReceiptContext = {
      ...baseContext,
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      paymentDate: new Date(),
      paymentMethod: 'Card', // Would come from payment details
      totalAmount: amount || (invoice.totalAmount ? Number(invoice.totalAmount) : 0),
      amount: amount || (invoice.totalAmount ? Number(invoice.totalAmount) : 0),
      currency: currency || invoice.currency || 'INR',
      taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : undefined,
    };

    const result =
      await this.subscriptionEmailService.sendPaymentConfirmationEmail(
        receiptContext,
      );

    if (result.success) {
      this.logger.log(`Payment receipt email sent to ${baseContext.userEmail}`);
    } else {
      this.logger.error(
        `Failed to send payment receipt email to ${baseContext.userEmail}: ${result.error}`,
      );
    }
  }

  // ============================================================================
  // USAGE ALERT EVENTS
  // ============================================================================

  /**
   * Handle user-usage.limit-approaching event
   * Sends email when user reaches 80%+ of a feature limit
   */
  @OnEvent('user-usage.limit-approaching')
  async handleUserUsageLimitApproaching(payload: {
    userId: string;
    eventId: string;
    featureKey: string;
    currentUsage: number;
    limit: number;
    usedPercent: number;
    remaining: number;
  }): Promise<void> {
    this.logger.log(
      `User usage limit approaching: ${payload.featureKey} at ${payload.usedPercent}% for user ${payload.userId}`,
    );

    try {
      const context = await this.buildUserUsageAlertContext(payload);
      if (!context) {
        this.logger.warn(`Could not build context for user usage alert`);
        return;
      }

      const result =
        await this.subscriptionEmailService.sendUsageLimitApproachingEmail(context);

      if (result.success) {
        this.logger.log(`Usage limit approaching email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send usage limit approaching email: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling user usage limit approaching:`, error);
    }
  }

  /**
   * Handle user-usage.limit-reached event
   * Sends email when user reaches 100% of a feature limit
   */
  @OnEvent('user-usage.limit-reached')
  async handleUserUsageLimitReached(payload: {
    userId: string;
    eventId: string;
    featureKey: string;
    currentUsage: number;
    limit: number;
  }): Promise<void> {
    this.logger.log(
      `User usage limit reached: ${payload.featureKey} for user ${payload.userId}`,
    );

    try {
      const context = await this.buildUserUsageAlertContext({
        ...payload,
        usedPercent: 100,
        remaining: 0,
      });
      if (!context) {
        this.logger.warn(`Could not build context for user usage alert`);
        return;
      }

      const result =
        await this.subscriptionEmailService.sendUsageLimitReachedEmail(context);

      if (result.success) {
        this.logger.log(`Usage limit reached email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send usage limit reached email: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling user usage limit reached:`, error);
    }
  }

  /**
   * Handle user-usage.storage-limit-approaching event
   */
  @OnEvent('user-usage.storage-limit-approaching')
  async handleStorageLimitApproaching(payload: {
    userId: string;
    eventId: string;
    currentUsageMB: number;
    limitMB: number;
    remainingMB: number;
    usedPercent: number;
  }): Promise<void> {
    this.logger.log(
      `Storage limit approaching: ${payload.usedPercent}% for user ${payload.userId}`,
    );

    try {
      const context = await this.buildStorageAlertContext(payload);
      if (!context) {
        this.logger.warn(`Could not build context for storage alert`);
        return;
      }

      const result =
        await this.subscriptionEmailService.sendStorageLimitApproachingEmail(context);

      if (result.success) {
        this.logger.log(`Storage limit approaching email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send storage limit approaching email: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling storage limit approaching:`, error);
    }
  }

  /**
   * Handle user-usage.storage-limit-reached event
   */
  @OnEvent('user-usage.storage-limit-reached')
  async handleStorageLimitReached(payload: {
    userId: string;
    eventId: string;
    currentUsageMB: number;
    limitMB: number;
  }): Promise<void> {
    this.logger.log(
      `Storage limit reached for user ${payload.userId}`,
    );

    try {
      const context = await this.buildStorageAlertContext({
        ...payload,
        remainingMB: 0,
        usedPercent: 100,
      });
      if (!context) {
        this.logger.warn(`Could not build context for storage alert`);
        return;
      }

      const result =
        await this.subscriptionEmailService.sendStorageLimitReachedEmail(context);

      if (result.success) {
        this.logger.log(`Storage limit reached email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send storage limit reached email: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling storage limit reached:`, error);
    }
  }

  /**
   * Handle vendor usage.limit-approaching event
   */
  @OnEvent('usage.limit-approaching')
  async handleVendorUsageLimitApproaching(payload: {
    vendorProfileId: string;
    featureKey: string;
    currentUsage: number;
    limit: number;
    usedPercent: number;
    remaining: number;
  }): Promise<void> {
    this.logger.log(
      `Vendor usage limit approaching: ${payload.featureKey} at ${payload.usedPercent}%`,
    );

    try {
      const context = await this.buildVendorUsageAlertContext(payload);
      if (!context) {
        this.logger.warn(`Could not build context for vendor usage alert`);
        return;
      }

      const result =
        await this.subscriptionEmailService.sendUsageLimitApproachingEmail(context);

      if (result.success) {
        this.logger.log(`Vendor usage limit approaching email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send vendor usage limit approaching email: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling vendor usage limit approaching:`, error);
    }
  }

  /**
   * Handle vendor usage.limit-reached event
   */
  @OnEvent('usage.limit-reached')
  async handleVendorUsageLimitReached(payload: {
    vendorProfileId: string;
    featureKey: string;
    currentUsage: number;
    limit: number;
  }): Promise<void> {
    this.logger.log(
      `Vendor usage limit reached: ${payload.featureKey}`,
    );

    try {
      const context = await this.buildVendorUsageAlertContext({
        ...payload,
        usedPercent: 100,
        remaining: 0,
      });
      if (!context) {
        this.logger.warn(`Could not build context for vendor usage alert`);
        return;
      }

      const result =
        await this.subscriptionEmailService.sendUsageLimitReachedEmail(context);

      if (result.success) {
        this.logger.log(`Vendor usage limit reached email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send vendor usage limit reached email: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling vendor usage limit reached:`, error);
    }
  }

  /**
   * Handle subscription.auto-renew-changed event
   */
  @OnEvent('subscription.auto-renew-changed')
  async handleAutoRenewChanged(payload: {
    subscriptionId: string;
    userId: string;
    autoRenewEnabled: boolean;
    type: 'vendor' | 'user';
  }): Promise<void> {
    this.logger.log(
      `Auto-renew ${payload.autoRenewEnabled ? 'enabled' : 'disabled'} for subscription ${payload.subscriptionId}`,
    );

    try {
      let context: SubscriptionEmailContext | null = null;

      if (payload.type === 'vendor') {
        context = await this.buildSubscriptionContext(payload.subscriptionId);
      } else {
        context = await this.buildUserSubscriptionContext(payload.subscriptionId);
      }

      if (!context) {
        this.logger.warn(`Could not build context for auto-renew email`);
        return;
      }

      const result = await this.subscriptionEmailService.sendAutoRenewStatusEmail({
        ...context,
        autoRenewEnabled: payload.autoRenewEnabled,
      });

      if (result.success) {
        this.logger.log(`Auto-renew status email sent to ${context.userEmail}`);
      } else {
        this.logger.error(
          `Failed to send auto-renew status email: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling auto-renew changed:`, error);
    }
  }

  // ============================================================================
  // USAGE ALERT CONTEXT BUILDERS
  // ============================================================================

  /**
   * Build context for user usage alert emails
   */
  private async buildUserUsageAlertContext(payload: {
    userId: string;
    eventId: string;
    featureKey: string;
    currentUsage: number;
    limit: number;
    usedPercent: number;
    remaining: number;
  }): Promise<UsageAlertContext | null> {
    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, firstName: true },
    });

    if (!user?.email) {
      return null;
    }

    // Get event details if provided
    let eventName: string | undefined;
    if (payload.eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: payload.eventId },
        select: { name: true },
      });
      eventName = event?.name;
    }

    // Get user subscription plan name
    const subscription = await this.prisma.userSubscription.findFirst({
      where: { userId: payload.userId, status: 'ACTIVE' },
      include: { plan: { select: { name: true } } },
    });

    return {
      userName: user.firstName || user.email.split('@')[0],
      userEmail: user.email,
      featureName: FEATURE_DISPLAY_NAMES[payload.featureKey] || payload.featureKey,
      featureKey: payload.featureKey,
      currentUsage: payload.currentUsage,
      limit: payload.limit,
      usedPercent: payload.usedPercent,
      remaining: payload.remaining,
      planName: subscription?.plan?.name,
      eventName,
      eventId: payload.eventId,
    };
  }

  /**
   * Build context for storage alert emails
   */
  private async buildStorageAlertContext(payload: {
    userId: string;
    eventId: string;
    currentUsageMB: number;
    limitMB: number;
    remainingMB: number;
    usedPercent: number;
  }): Promise<UsageAlertContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, firstName: true },
    });

    if (!user?.email) {
      return null;
    }

    let eventName: string | undefined;
    if (payload.eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: payload.eventId },
        select: { name: true },
      });
      eventName = event?.name;
    }

    const subscription = await this.prisma.userSubscription.findFirst({
      where: { userId: payload.userId, status: 'ACTIVE' },
      include: { plan: { select: { name: true } } },
    });

    return {
      userName: user.firstName || user.email.split('@')[0],
      userEmail: user.email,
      featureName: 'Storage',
      featureKey: 'memory_storage_mb',
      currentUsage: Math.round(payload.currentUsageMB * 100) / 100,
      limit: payload.limitMB,
      usedPercent: payload.usedPercent,
      remaining: Math.round(payload.remainingMB * 100) / 100,
      planName: subscription?.plan?.name,
      eventName,
      eventId: payload.eventId,
      unit: ' MB',
    };
  }

  /**
   * Build context for vendor usage alert emails
   */
  private async buildVendorUsageAlertContext(payload: {
    vendorProfileId: string;
    featureKey: string;
    currentUsage: number;
    limit: number;
    usedPercent: number;
    remaining: number;
  }): Promise<UsageAlertContext | null> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: payload.vendorProfileId },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    if (!vendorProfile?.user?.email) {
      return null;
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { vendorProfileId: payload.vendorProfileId, status: 'ACTIVE' },
      include: { plan: { select: { name: true } } },
    });

    return {
      userName: vendorProfile.user.firstName || vendorProfile.user.email.split('@')[0],
      userEmail: vendorProfile.user.email,
      featureName: FEATURE_DISPLAY_NAMES[payload.featureKey] || payload.featureKey,
      featureKey: payload.featureKey,
      currentUsage: payload.currentUsage,
      limit: payload.limit,
      usedPercent: payload.usedPercent,
      remaining: payload.remaining,
      planName: subscription?.plan?.name,
    };
  }

  /**
   * Build email context from user subscription ID
   */
  private async buildUserSubscriptionContext(
    subscriptionId: string,
  ): Promise<SubscriptionEmailContext | null> {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: true,
        plan: true,
        price: true,
      },
    });

    if (!subscription?.user?.email) {
      return null;
    }

    return {
      userName: subscription.user.firstName || subscription.user.email.split('@')[0],
      userEmail: subscription.user.email,
      planName: subscription.plan?.name || 'Subscription',
      planDescription: subscription.plan?.description || undefined,
      amount: subscription.price?.amount
        ? Number(subscription.price.amount)
        : undefined,
      currency: subscription.price?.currency || 'INR',
      nextBillingDate: subscription.currentPeriodEnd || undefined,
      currentPeriodEnd: subscription.currentPeriodEnd || undefined,
      subscriptionId: subscription.id,
    };
  }
}
