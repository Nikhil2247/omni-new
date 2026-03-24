// ============================================================================
// SUBSCRIPTION EMAIL SERVICE - Subscription-Related Email Sending
// ============================================================================
// Provides email sending capabilities for subscription lifecycle events
// Includes templates for welcome, payment, renewal, and cancellation emails
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailService,
  EmailResult,
} from '../../../infrastructure/notifications/email.service';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SubscriptionEmailContext {
  userName: string;
  userEmail: string;
  planName: string;
  planDescription?: string;
  amount?: number;
  currency?: string;
  nextBillingDate?: Date;
  currentPeriodEnd?: Date;
  trialEndDate?: Date;
  supportEmail?: string;
  supportUrl?: string;
  billingUrl?: string;
  upgradeUrl?: string;
  dashboardUrl?: string;
  invoiceUrl?: string;
  paymentMethodUpdateUrl?: string;
  cancellationDate?: Date;
  refundAmount?: number;
  daysRemaining?: number;
  subscriptionId?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  retryDate?: Date;
  reason?: string;
}

export interface PaymentReceiptContext extends SubscriptionEmailContext {
  invoiceNumber: string;
  paymentDate: Date;
  paymentMethod: string;
  taxAmount?: number;
  totalAmount: number;
}

export interface UsageAlertContext {
  userName: string;
  userEmail: string;
  featureName: string;
  featureKey: string;
  currentUsage: number;
  limit: number;
  usedPercent: number;
  remaining: number;
  isUnlimited?: boolean;
  planName?: string;
  upgradeUrl?: string;
  dashboardUrl?: string;
  eventName?: string; // For user event-specific alerts
  eventId?: string;
  unit?: string; // e.g., "MB", "uploads", "guests"
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class SubscriptionEmailService {
  private readonly logger = new Logger(SubscriptionEmailService.name);
  private readonly supportEmail: string;
  private readonly supportUrl: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.supportEmail = this.configService.get<string>(
      'SUPPORT_EMAIL',
      'support@omnicassion.com',
    );
    this.supportUrl = this.configService.get<string>(
      'SUPPORT_URL',
      'https://omnicassion.com/support',
    );
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://omnicassion.com',
    );
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Send welcome email when subscription is activated
   */
  async sendWelcomeEmail(context: SubscriptionEmailContext): Promise<EmailResult> {
    this.logger.log(`Sending subscription welcome email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Welcome to ${context.planName} - Your Subscription is Active!`,
      html: this.renderWelcomeTemplate(context),
      text: this.renderWelcomeTextTemplate(context),
    });
  }

  /**
   * Send payment confirmation/receipt email
   */
  async sendPaymentConfirmationEmail(
    context: PaymentReceiptContext,
  ): Promise<EmailResult> {
    this.logger.log(`Sending payment confirmation email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Payment Receipt - ${context.planName} (${context.invoiceNumber})`,
      html: this.renderPaymentReceiptTemplate(context),
      text: this.renderPaymentReceiptTextTemplate(context),
    });
  }

  /**
   * Send payment failed notification email
   */
  async sendPaymentFailedEmail(context: SubscriptionEmailContext): Promise<EmailResult> {
    this.logger.log(`Sending payment failed email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Action Required: Payment Failed for ${context.planName}`,
      html: this.renderPaymentFailedTemplate(context),
      text: this.renderPaymentFailedTextTemplate(context),
    });
  }

  /**
   * Send subscription renewal confirmation email
   */
  async sendRenewalConfirmationEmail(
    context: SubscriptionEmailContext,
  ): Promise<EmailResult> {
    this.logger.log(`Sending renewal confirmation email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Subscription Renewed - ${context.planName}`,
      html: this.renderRenewalConfirmationTemplate(context),
      text: this.renderRenewalConfirmationTextTemplate(context),
    });
  }

  /**
   * Send subscription cancellation confirmation email
   */
  async sendCancellationConfirmationEmail(
    context: SubscriptionEmailContext,
  ): Promise<EmailResult> {
    this.logger.log(`Sending cancellation confirmation email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Subscription Cancelled - ${context.planName}`,
      html: this.renderCancellationConfirmationTemplate(context),
      text: this.renderCancellationConfirmationTextTemplate(context),
    });
  }

  /**
   * Send renewal reminder email (3 days before)
   */
  async sendRenewalReminderEmail(
    context: SubscriptionEmailContext,
  ): Promise<EmailResult> {
    this.logger.log(`Sending renewal reminder email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Upcoming Renewal - ${context.planName}`,
      html: this.renderRenewalReminderTemplate(context),
      text: this.renderRenewalReminderTextTemplate(context),
    });
  }

  /**
   * Send trial ending notification email
   */
  async sendTrialEndingEmail(context: SubscriptionEmailContext): Promise<EmailResult> {
    this.logger.log(`Sending trial ending email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Your ${context.planName} Trial Ends Soon`,
      html: this.renderTrialEndingTemplate(context),
      text: this.renderTrialEndingTextTemplate(context),
    });
  }

  /**
   * Send subscription expired email
   */
  async sendSubscriptionExpiredEmail(
    context: SubscriptionEmailContext,
  ): Promise<EmailResult> {
    this.logger.log(`Sending subscription expired email to ${context.userEmail}`);

    return this.emailService.send({
      to: context.userEmail,
      subject: `Your ${context.planName} Subscription Has Expired`,
      html: this.renderSubscriptionExpiredTemplate(context),
      text: this.renderSubscriptionExpiredTextTemplate(context),
    });
  }

  /**
   * Send usage limit approaching alert email (80%+ usage)
   */
  async sendUsageLimitApproachingEmail(
    context: UsageAlertContext,
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending usage limit approaching email to ${context.userEmail} for ${context.featureKey}`,
    );

    const subject = context.eventName
      ? `Usage Alert: ${context.featureName} at ${context.usedPercent}% for ${context.eventName}`
      : `Usage Alert: ${context.featureName} at ${context.usedPercent}%`;

    return this.emailService.send({
      to: context.userEmail,
      subject,
      html: this.renderUsageLimitApproachingTemplate(context),
      text: this.renderUsageLimitApproachingTextTemplate(context),
    });
  }

  /**
   * Send usage limit reached alert email (100% usage)
   */
  async sendUsageLimitReachedEmail(
    context: UsageAlertContext,
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending usage limit reached email to ${context.userEmail} for ${context.featureKey}`,
    );

    const subject = context.eventName
      ? `Limit Reached: ${context.featureName} for ${context.eventName}`
      : `Limit Reached: ${context.featureName}`;

    return this.emailService.send({
      to: context.userEmail,
      subject,
      html: this.renderUsageLimitReachedTemplate(context),
      text: this.renderUsageLimitReachedTextTemplate(context),
    });
  }

  /**
   * Send storage limit approaching alert email
   */
  async sendStorageLimitApproachingEmail(
    context: UsageAlertContext,
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending storage limit approaching email to ${context.userEmail}`,
    );

    const subject = context.eventName
      ? `Storage Alert: ${context.usedPercent}% used for ${context.eventName}`
      : `Storage Alert: ${context.usedPercent}% of storage used`;

    return this.emailService.send({
      to: context.userEmail,
      subject,
      html: this.renderStorageLimitApproachingTemplate(context),
      text: this.renderStorageLimitApproachingTextTemplate(context),
    });
  }

  /**
   * Send storage limit reached alert email
   */
  async sendStorageLimitReachedEmail(
    context: UsageAlertContext,
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending storage limit reached email to ${context.userEmail}`,
    );

    const subject = context.eventName
      ? `Storage Full: ${context.eventName}`
      : `Storage Full: Unable to upload new files`;

    return this.emailService.send({
      to: context.userEmail,
      subject,
      html: this.renderStorageLimitReachedTemplate(context),
      text: this.renderStorageLimitReachedTextTemplate(context),
    });
  }

  /**
   * Send auto-renew status changed email
   */
  async sendAutoRenewStatusEmail(
    context: SubscriptionEmailContext & { autoRenewEnabled: boolean },
  ): Promise<EmailResult> {
    this.logger.log(
      `Sending auto-renew ${context.autoRenewEnabled ? 'enabled' : 'disabled'} email to ${context.userEmail}`,
    );

    const subject = context.autoRenewEnabled
      ? `Auto-Renewal Enabled for ${context.planName}`
      : `Auto-Renewal Disabled for ${context.planName}`;

    return this.emailService.send({
      to: context.userEmail,
      subject,
      html: this.renderAutoRenewStatusTemplate(context),
      text: this.renderAutoRenewStatusTextTemplate(context),
    });
  }

  // ============================================================================
  // PRIVATE TEMPLATE METHODS - HTML
  // ============================================================================

  private getBaseStyles(): string {
    return `
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
      .content { padding: 32px 24px; }
      .content p { color: #374151; line-height: 1.6; margin: 0 0 16px 0; }
      .highlight-box { background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
      .highlight-box p { margin: 0; }
      .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
      .detail-label { color: #6b7280; }
      .detail-value { color: #111827; font-weight: 500; }
      .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0; }
      .button-secondary { background: #ffffff; color: #8b5cf6; border: 2px solid #8b5cf6; }
      .footer { background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
      .footer p { color: #6b7280; font-size: 14px; margin: 0 0 8px 0; }
      .footer a { color: #8b5cf6; text-decoration: none; }
      .amount { font-size: 32px; font-weight: 700; color: #111827; }
      .currency { font-size: 16px; color: #6b7280; }
      .warning-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
      .warning-box p { color: #991b1b; margin: 0; }
      .success-box { background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; }
      .success-box p { color: #065f46; margin: 0; }
    `;
  }

  private wrapInLayout(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${this.getBaseStyles()}</style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Need help? <a href="${this.supportUrl}">Contact Support</a> or email us at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a></p>
      <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">Omnicassion Inc.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  private renderWelcomeTemplate(context: SubscriptionEmailContext): string {
    const dashboardUrl = context.dashboardUrl || `${this.frontendUrl}/dashboard`;

    const content = `
    <div class="header">
      <h1>Welcome to ${context.planName}!</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>Thank you for subscribing to <strong>${context.planName}</strong>! Your subscription is now active and you have full access to all premium features.</p>

      <div class="highlight-box">
        <p><strong>Plan Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        ${context.amount ? `
        <div class="detail-row">
          <span class="detail-label">Amount</span>
          <span class="detail-value">${this.formatCurrency(context.amount, context.currency)}</span>
        </div>
        ` : ''}
        ${context.nextBillingDate ? `
        <div class="detail-row">
          <span class="detail-label">Next Billing Date</span>
          <span class="detail-value">${this.formatDate(context.nextBillingDate)}</span>
        </div>
        ` : ''}
      </div>

      <p>Get started by exploring your dashboard:</p>
      <p><a href="${dashboardUrl}" class="button">Go to Dashboard</a></p>

      <p>If you have any questions, our support team is here to help.</p>
      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, `Welcome to ${context.planName}`);
  }

  private renderPaymentReceiptTemplate(context: PaymentReceiptContext): string {
    const invoiceUrl = context.invoiceUrl || `${this.frontendUrl}/billing/invoices`;

    const content = `
    <div class="header">
      <h1>Payment Receipt</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>We've received your payment. Thank you for your continued subscription!</p>

      <div class="success-box">
        <p>Payment successful!</p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <span class="currency">${context.currency || 'INR'}</span>
        <span class="amount">${context.totalAmount.toFixed(2)}</span>
      </div>

      <div class="highlight-box">
        <p><strong>Payment Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Invoice Number</span>
          <span class="detail-value">${context.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Date</span>
          <span class="detail-value">${this.formatDate(context.paymentDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Method</span>
          <span class="detail-value">${context.paymentMethod}</span>
        </div>
        ${context.taxAmount ? `
        <div class="detail-row">
          <span class="detail-label">Tax</span>
          <span class="detail-value">${this.formatCurrency(context.taxAmount, context.currency)}</span>
        </div>
        ` : ''}
        ${context.nextBillingDate ? `
        <div class="detail-row">
          <span class="detail-label">Next Billing Date</span>
          <span class="detail-value">${this.formatDate(context.nextBillingDate)}</span>
        </div>
        ` : ''}
      </div>

      <p><a href="${invoiceUrl}" class="button">View Invoice</a></p>

      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Payment Receipt');
  }

  private renderPaymentFailedTemplate(context: SubscriptionEmailContext): string {
    const billingUrl = context.billingUrl || `${this.frontendUrl}/billing`;
    const paymentMethodUrl =
      context.paymentMethodUpdateUrl || `${this.frontendUrl}/billing/payment-methods`;

    const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>We were unable to process your payment for <strong>${context.planName}</strong>.</p>

      <div class="warning-box">
        <p><strong>Action Required:</strong> Please update your payment method to avoid service interruption.</p>
      </div>

      <div class="highlight-box">
        <p><strong>What happened?</strong></p>
        <p style="margin-top: 8px;">${context.reason || 'Your payment method was declined. This can happen due to insufficient funds, expired card, or bank restrictions.'}</p>
      </div>

      ${context.retryDate ? `
      <p>We will automatically retry the payment on <strong>${this.formatDate(context.retryDate)}</strong>.</p>
      ` : ''}

      <p><strong>To avoid interruption to your service:</strong></p>
      <ol style="color: #374151; line-height: 1.8;">
        <li>Update your payment method</li>
        <li>Ensure sufficient funds are available</li>
        <li>Contact your bank if the issue persists</li>
      </ol>

      <p><a href="${paymentMethodUrl}" class="button">Update Payment Method</a></p>
      <p><a href="${billingUrl}" class="button button-secondary">View Billing</a></p>

      <p>If you need assistance, please contact our support team.</p>
      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Payment Failed');
  }

  private renderRenewalConfirmationTemplate(context: SubscriptionEmailContext): string {
    const content = `
    <div class="header">
      <h1>Subscription Renewed</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>Great news! Your <strong>${context.planName}</strong> subscription has been successfully renewed.</p>

      <div class="success-box">
        <p>Your subscription is active!</p>
      </div>

      <div class="highlight-box">
        <p><strong>Renewal Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        ${context.amount ? `
        <div class="detail-row">
          <span class="detail-label">Amount Charged</span>
          <span class="detail-value">${this.formatCurrency(context.amount, context.currency)}</span>
        </div>
        ` : ''}
        ${context.nextBillingDate ? `
        <div class="detail-row">
          <span class="detail-label">Next Billing Date</span>
          <span class="detail-value">${this.formatDate(context.nextBillingDate)}</span>
        </div>
        ` : ''}
      </div>

      <p>Thank you for continuing to be a valued subscriber!</p>
      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Subscription Renewed');
  }

  private renderCancellationConfirmationTemplate(
    context: SubscriptionEmailContext,
  ): string {
    const upgradeUrl = context.upgradeUrl || `${this.frontendUrl}/pricing`;

    const content = `
    <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
      <h1>Subscription Cancelled</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>We're sorry to see you go. Your <strong>${context.planName}</strong> subscription has been cancelled.</p>

      <div class="highlight-box">
        <p><strong>Cancellation Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        ${context.currentPeriodEnd ? `
        <div class="detail-row">
          <span class="detail-label">Access Until</span>
          <span class="detail-value">${this.formatDate(context.currentPeriodEnd)}</span>
        </div>
        ` : ''}
        ${context.cancellationDate ? `
        <div class="detail-row">
          <span class="detail-label">Cancelled On</span>
          <span class="detail-value">${this.formatDate(context.cancellationDate)}</span>
        </div>
        ` : ''}
      </div>

      ${context.currentPeriodEnd ? `
      <p>You will continue to have access to your premium features until <strong>${this.formatDate(context.currentPeriodEnd)}</strong>.</p>
      ` : ''}

      <p>Changed your mind? You can resubscribe at any time:</p>
      <p><a href="${upgradeUrl}" class="button">Resubscribe</a></p>

      <p>We'd love to know why you cancelled. Your feedback helps us improve. Feel free to reach out to our support team.</p>
      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Subscription Cancelled');
  }

  private renderRenewalReminderTemplate(context: SubscriptionEmailContext): string {
    const billingUrl = context.billingUrl || `${this.frontendUrl}/billing`;

    const content = `
    <div class="header">
      <h1>Upcoming Renewal</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>Your <strong>${context.planName}</strong> subscription will renew in <strong>${context.daysRemaining || 3} days</strong>.</p>

      <div class="highlight-box">
        <p><strong>Renewal Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        ${context.amount ? `
        <div class="detail-row">
          <span class="detail-label">Amount</span>
          <span class="detail-value">${this.formatCurrency(context.amount, context.currency)}</span>
        </div>
        ` : ''}
        ${context.nextBillingDate ? `
        <div class="detail-row">
          <span class="detail-label">Renewal Date</span>
          <span class="detail-value">${this.formatDate(context.nextBillingDate)}</span>
        </div>
        ` : ''}
      </div>

      <p>No action is required if you wish to continue your subscription. Your payment method on file will be charged automatically.</p>

      <p><a href="${billingUrl}" class="button">Manage Subscription</a></p>

      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Upcoming Renewal');
  }

  private renderTrialEndingTemplate(context: SubscriptionEmailContext): string {
    const upgradeUrl = context.upgradeUrl || `${this.frontendUrl}/pricing`;

    const content = `
    <div class="header">
      <h1>Your Trial is Ending Soon</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>Your <strong>${context.planName}</strong> trial ends in <strong>${context.daysRemaining || 3} days</strong>.</p>

      <div class="highlight-box">
        <p><strong>Trial Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        ${context.trialEndDate ? `
        <div class="detail-row">
          <span class="detail-label">Trial Ends</span>
          <span class="detail-value">${this.formatDate(context.trialEndDate)}</span>
        </div>
        ` : ''}
      </div>

      <p>To continue enjoying premium features without interruption, upgrade to a paid plan today:</p>
      <p><a href="${upgradeUrl}" class="button">Upgrade Now</a></p>

      <p>If you don't upgrade, your account will be downgraded to the free plan when your trial ends.</p>
      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Trial Ending Soon');
  }

  private renderSubscriptionExpiredTemplate(context: SubscriptionEmailContext): string {
    const upgradeUrl = context.upgradeUrl || `${this.frontendUrl}/pricing`;

    const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>Subscription Expired</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>Your <strong>${context.planName}</strong> subscription has expired.</p>

      <div class="warning-box">
        <p>Your account has been downgraded to the free plan. Some features may no longer be available.</p>
      </div>

      <p>We'd love to have you back! Resubscribe to regain access to all premium features:</p>
      <p><a href="${upgradeUrl}" class="button">Resubscribe Now</a></p>

      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Subscription Expired');
  }

  // ============================================================================
  // PRIVATE TEMPLATE METHODS - PLAIN TEXT
  // ============================================================================

  private renderWelcomeTextTemplate(context: SubscriptionEmailContext): string {
    return `
Welcome to ${context.planName}!

Hi ${context.userName},

Thank you for subscribing to ${context.planName}! Your subscription is now active and you have full access to all premium features.

Plan Details:
- Plan: ${context.planName}
${context.amount ? `- Amount: ${this.formatCurrency(context.amount, context.currency)}` : ''}
${context.nextBillingDate ? `- Next Billing Date: ${this.formatDate(context.nextBillingDate)}` : ''}

Get started by visiting your dashboard: ${context.dashboardUrl || `${this.frontendUrl}/dashboard`}

If you have any questions, our support team is here to help.

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderPaymentReceiptTextTemplate(context: PaymentReceiptContext): string {
    return `
Payment Receipt

Hi ${context.userName},

We've received your payment. Thank you for your continued subscription!

Amount: ${this.formatCurrency(context.totalAmount, context.currency)}

Payment Details:
- Invoice Number: ${context.invoiceNumber}
- Plan: ${context.planName}
- Payment Date: ${this.formatDate(context.paymentDate)}
- Payment Method: ${context.paymentMethod}
${context.taxAmount ? `- Tax: ${this.formatCurrency(context.taxAmount, context.currency)}` : ''}
${context.nextBillingDate ? `- Next Billing Date: ${this.formatDate(context.nextBillingDate)}` : ''}

View Invoice: ${context.invoiceUrl || `${this.frontendUrl}/billing/invoices`}

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderPaymentFailedTextTemplate(context: SubscriptionEmailContext): string {
    return `
Payment Failed - Action Required

Hi ${context.userName},

We were unable to process your payment for ${context.planName}.

${context.reason || 'Your payment method was declined. This can happen due to insufficient funds, expired card, or bank restrictions.'}

${context.retryDate ? `We will automatically retry the payment on ${this.formatDate(context.retryDate)}.` : ''}

To avoid interruption to your service:
1. Update your payment method
2. Ensure sufficient funds are available
3. Contact your bank if the issue persists

Update Payment Method: ${context.paymentMethodUpdateUrl || `${this.frontendUrl}/billing/payment-methods`}

If you need assistance, please contact our support team.

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderRenewalConfirmationTextTemplate(
    context: SubscriptionEmailContext,
  ): string {
    return `
Subscription Renewed

Hi ${context.userName},

Great news! Your ${context.planName} subscription has been successfully renewed.

Renewal Details:
- Plan: ${context.planName}
${context.amount ? `- Amount Charged: ${this.formatCurrency(context.amount, context.currency)}` : ''}
${context.nextBillingDate ? `- Next Billing Date: ${this.formatDate(context.nextBillingDate)}` : ''}

Thank you for continuing to be a valued subscriber!

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderCancellationConfirmationTextTemplate(
    context: SubscriptionEmailContext,
  ): string {
    return `
Subscription Cancelled

Hi ${context.userName},

We're sorry to see you go. Your ${context.planName} subscription has been cancelled.

Cancellation Details:
- Plan: ${context.planName}
${context.currentPeriodEnd ? `- Access Until: ${this.formatDate(context.currentPeriodEnd)}` : ''}
${context.cancellationDate ? `- Cancelled On: ${this.formatDate(context.cancellationDate)}` : ''}

${context.currentPeriodEnd ? `You will continue to have access to your premium features until ${this.formatDate(context.currentPeriodEnd)}.` : ''}

Changed your mind? You can resubscribe at any time: ${context.upgradeUrl || `${this.frontendUrl}/pricing`}

We'd love to know why you cancelled. Your feedback helps us improve.

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderRenewalReminderTextTemplate(context: SubscriptionEmailContext): string {
    return `
Upcoming Renewal

Hi ${context.userName},

Your ${context.planName} subscription will renew in ${context.daysRemaining || 3} days.

Renewal Details:
- Plan: ${context.planName}
${context.amount ? `- Amount: ${this.formatCurrency(context.amount, context.currency)}` : ''}
${context.nextBillingDate ? `- Renewal Date: ${this.formatDate(context.nextBillingDate)}` : ''}

No action is required if you wish to continue your subscription. Your payment method on file will be charged automatically.

Manage Subscription: ${context.billingUrl || `${this.frontendUrl}/billing`}

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderTrialEndingTextTemplate(context: SubscriptionEmailContext): string {
    return `
Your Trial is Ending Soon

Hi ${context.userName},

Your ${context.planName} trial ends in ${context.daysRemaining || 3} days.

Trial Details:
- Plan: ${context.planName}
${context.trialEndDate ? `- Trial Ends: ${this.formatDate(context.trialEndDate)}` : ''}

To continue enjoying premium features without interruption, upgrade to a paid plan today:
${context.upgradeUrl || `${this.frontendUrl}/pricing`}

If you don't upgrade, your account will be downgraded to the free plan when your trial ends.

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderSubscriptionExpiredTextTemplate(
    context: SubscriptionEmailContext,
  ): string {
    return `
Subscription Expired

Hi ${context.userName},

Your ${context.planName} subscription has expired.

Your account has been downgraded to the free plan. Some features may no longer be available.

We'd love to have you back! Resubscribe to regain access to all premium features:
${context.upgradeUrl || `${this.frontendUrl}/pricing`}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  // ============================================================================
  // USAGE ALERT TEMPLATES - HTML
  // ============================================================================

  private renderUsageLimitApproachingTemplate(context: UsageAlertContext): string {
    const upgradeUrl = context.upgradeUrl || `${this.frontendUrl}/pricing`;
    const dashboardUrl = context.dashboardUrl || `${this.frontendUrl}/dashboard`;
    const unit = context.unit || '';

    const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>Usage Alert</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>You're approaching your <strong>${context.featureName}</strong> limit${context.eventName ? ` for <strong>${context.eventName}</strong>` : ''}.</p>

      <div class="warning-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
        <p style="color: #92400e;"><strong>${context.usedPercent}% of your limit has been used</strong></p>
      </div>

      <div class="highlight-box">
        <p><strong>Usage Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Feature</span>
          <span class="detail-value">${context.featureName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Current Usage</span>
          <span class="detail-value">${context.currentUsage}${unit} / ${context.limit}${unit}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Remaining</span>
          <span class="detail-value">${context.remaining}${unit}</span>
        </div>
        ${context.planName ? `
        <div class="detail-row">
          <span class="detail-label">Current Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        ` : ''}
      </div>

      <p>To avoid interruption, consider upgrading your plan for higher limits:</p>
      <p><a href="${upgradeUrl}" class="button">Upgrade Plan</a></p>
      <p><a href="${dashboardUrl}" class="button button-secondary">View Dashboard</a></p>

      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Usage Alert');
  }

  private renderUsageLimitReachedTemplate(context: UsageAlertContext): string {
    const upgradeUrl = context.upgradeUrl || `${this.frontendUrl}/pricing`;
    const unit = context.unit || '';

    const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <h1>Limit Reached</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>You've reached your <strong>${context.featureName}</strong> limit${context.eventName ? ` for <strong>${context.eventName}</strong>` : ''}.</p>

      <div class="warning-box">
        <p><strong>Action Required:</strong> You've used 100% of your ${context.featureName.toLowerCase()} allowance. Upgrade your plan to continue using this feature.</p>
      </div>

      <div class="highlight-box">
        <p><strong>Usage Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Feature</span>
          <span class="detail-value">${context.featureName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Usage</span>
          <span class="detail-value">${context.currentUsage}${unit} / ${context.limit}${unit} (100%)</span>
        </div>
        ${context.planName ? `
        <div class="detail-row">
          <span class="detail-label">Current Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        ` : ''}
      </div>

      <p>Upgrade now to get higher limits and continue without interruption:</p>
      <p><a href="${upgradeUrl}" class="button">Upgrade Plan</a></p>

      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Limit Reached');
  }

  private renderStorageLimitApproachingTemplate(context: UsageAlertContext): string {
    const upgradeUrl = context.upgradeUrl || `${this.frontendUrl}/pricing`;

    const content = `
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
      <h1>Storage Alert</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>Your storage is running low${context.eventName ? ` for <strong>${context.eventName}</strong>` : ''}.</p>

      <div class="warning-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
        <p style="color: #92400e;"><strong>${context.usedPercent}% of your storage has been used</strong></p>
      </div>

      <div class="highlight-box">
        <p><strong>Storage Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Used Storage</span>
          <span class="detail-value">${context.currentUsage} MB</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Storage</span>
          <span class="detail-value">${context.limit} MB</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Remaining</span>
          <span class="detail-value">${context.remaining} MB</span>
        </div>
      </div>

      <p>Upgrade your plan for more storage space:</p>
      <p><a href="${upgradeUrl}" class="button">Upgrade Plan</a></p>

      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Storage Alert');
  }

  private renderStorageLimitReachedTemplate(context: UsageAlertContext): string {
    const upgradeUrl = context.upgradeUrl || `${this.frontendUrl}/pricing`;

    const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <h1>Storage Full</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>
      <p>Your storage is full${context.eventName ? ` for <strong>${context.eventName}</strong>` : ''}. New uploads will be blocked until you free up space or upgrade your plan.</p>

      <div class="warning-box">
        <p><strong>Action Required:</strong> Your storage limit of ${context.limit} MB has been reached. Upgrade to continue uploading files.</p>
      </div>

      <div class="highlight-box">
        <p><strong>Storage Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Used Storage</span>
          <span class="detail-value">${context.currentUsage} MB</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Storage</span>
          <span class="detail-value">${context.limit} MB</span>
        </div>
      </div>

      <p>Upgrade now for more storage:</p>
      <p><a href="${upgradeUrl}" class="button">Upgrade Plan</a></p>

      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, 'Storage Full');
  }

  private renderAutoRenewStatusTemplate(
    context: SubscriptionEmailContext & { autoRenewEnabled: boolean },
  ): string {
    const billingUrl = context.billingUrl || `${this.frontendUrl}/settings/subscription`;

    const content = `
    <div class="header">
      <h1>Auto-Renewal ${context.autoRenewEnabled ? 'Enabled' : 'Disabled'}</h1>
    </div>
    <div class="content">
      <p>Hi ${context.userName},</p>

      ${context.autoRenewEnabled ? `
      <p>Auto-renewal has been <strong>enabled</strong> for your <strong>${context.planName}</strong> subscription.</p>

      <div class="success-box">
        <p>Your subscription will automatically renew at the end of each billing period. No action is required on your part.</p>
      </div>
      ` : `
      <p>Auto-renewal has been <strong>disabled</strong> for your <strong>${context.planName}</strong> subscription.</p>

      <div class="warning-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
        <p style="color: #92400e;"><strong>Important:</strong> Your subscription will not renew automatically. Make sure to manually renew before your current period ends to avoid losing access to premium features.</p>
      </div>
      `}

      <div class="highlight-box">
        <p><strong>Subscription Details:</strong></p>
        <div class="detail-row">
          <span class="detail-label">Plan</span>
          <span class="detail-value">${context.planName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Auto-Renewal</span>
          <span class="detail-value">${context.autoRenewEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        ${context.nextBillingDate ? `
        <div class="detail-row">
          <span class="detail-label">${context.autoRenewEnabled ? 'Next Renewal' : 'Current Period Ends'}</span>
          <span class="detail-value">${this.formatDate(context.nextBillingDate)}</span>
        </div>
        ` : ''}
      </div>

      <p><a href="${billingUrl}" class="button">Manage Subscription</a></p>

      <p>Best regards,<br>The Omnicassion Team</p>
    </div>
    `;

    return this.wrapInLayout(content, `Auto-Renewal ${context.autoRenewEnabled ? 'Enabled' : 'Disabled'}`);
  }

  // ============================================================================
  // USAGE ALERT TEMPLATES - PLAIN TEXT
  // ============================================================================

  private renderUsageLimitApproachingTextTemplate(context: UsageAlertContext): string {
    const unit = context.unit || '';
    return `
Usage Alert: ${context.featureName} at ${context.usedPercent}%

Hi ${context.userName},

You're approaching your ${context.featureName} limit${context.eventName ? ` for ${context.eventName}` : ''}.

${context.usedPercent}% of your limit has been used.

Usage Details:
- Feature: ${context.featureName}
- Current Usage: ${context.currentUsage}${unit} / ${context.limit}${unit}
- Remaining: ${context.remaining}${unit}
${context.planName ? `- Current Plan: ${context.planName}` : ''}

To avoid interruption, consider upgrading your plan:
${context.upgradeUrl || `${this.frontendUrl}/pricing`}

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderUsageLimitReachedTextTemplate(context: UsageAlertContext): string {
    const unit = context.unit || '';
    return `
Limit Reached: ${context.featureName}

Hi ${context.userName},

You've reached your ${context.featureName} limit${context.eventName ? ` for ${context.eventName}` : ''}.

Action Required: You've used 100% of your ${context.featureName.toLowerCase()} allowance.

Usage Details:
- Feature: ${context.featureName}
- Usage: ${context.currentUsage}${unit} / ${context.limit}${unit} (100%)
${context.planName ? `- Current Plan: ${context.planName}` : ''}

Upgrade now to get higher limits:
${context.upgradeUrl || `${this.frontendUrl}/pricing`}

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderStorageLimitApproachingTextTemplate(context: UsageAlertContext): string {
    return `
Storage Alert: ${context.usedPercent}% used

Hi ${context.userName},

Your storage is running low${context.eventName ? ` for ${context.eventName}` : ''}.

${context.usedPercent}% of your storage has been used.

Storage Details:
- Used: ${context.currentUsage} MB
- Total: ${context.limit} MB
- Remaining: ${context.remaining} MB

Upgrade your plan for more storage:
${context.upgradeUrl || `${this.frontendUrl}/pricing`}

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderStorageLimitReachedTextTemplate(context: UsageAlertContext): string {
    return `
Storage Full

Hi ${context.userName},

Your storage is full${context.eventName ? ` for ${context.eventName}` : ''}. New uploads will be blocked.

Action Required: Your storage limit of ${context.limit} MB has been reached.

Storage Details:
- Used: ${context.currentUsage} MB
- Total: ${context.limit} MB

Upgrade now for more storage:
${context.upgradeUrl || `${this.frontendUrl}/pricing`}

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }

  private renderAutoRenewStatusTextTemplate(
    context: SubscriptionEmailContext & { autoRenewEnabled: boolean },
  ): string {
    return `
Auto-Renewal ${context.autoRenewEnabled ? 'Enabled' : 'Disabled'}

Hi ${context.userName},

Auto-renewal has been ${context.autoRenewEnabled ? 'enabled' : 'disabled'} for your ${context.planName} subscription.

${context.autoRenewEnabled
  ? 'Your subscription will automatically renew at the end of each billing period. No action is required on your part.'
  : 'Important: Your subscription will not renew automatically. Make sure to manually renew before your current period ends to avoid losing access to premium features.'}

Subscription Details:
- Plan: ${context.planName}
- Auto-Renewal: ${context.autoRenewEnabled ? 'Enabled' : 'Disabled'}
${context.nextBillingDate ? `- ${context.autoRenewEnabled ? 'Next Renewal' : 'Current Period Ends'}: ${this.formatDate(context.nextBillingDate)}` : ''}

Manage your subscription: ${context.billingUrl || `${this.frontendUrl}/settings/subscription`}

Best regards,
The Omnicassion Team

Support: ${this.supportEmail}
    `.trim();
  }
}
