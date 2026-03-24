// ============================================================================
// EMAIL NOTIFICATION LISTENER
// ============================================================================
// Listens for notification events and routes them to the email service
// Handles claim verification, approval, rejection, and other email notifications
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { PrismaService } from '../../core/database/prisma.service';

// Notification event payload interface
interface NotificationEvent {
  type: string;
  recipient?: string;
  data?: Record<string, unknown>;
}

// Claim event payloads
interface ClaimApprovedEvent {
  claimId: string;
  vendorProfileId: string;
  userId: string;
  adminUserId?: string;
}

interface ClaimRejectedEvent {
  claimId: string;
  vendorProfileId: string;
  userId: string;
  adminUserId: string;
  reason: string;
}

@Injectable()
export class EmailNotificationListener {
  private readonly logger = new Logger(EmailNotificationListener.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
  }

  // ============================================================================
  // GENERIC NOTIFICATION HANDLER
  // ============================================================================

  @OnEvent('notification.send')
  async handleNotificationSend(event: NotificationEvent): Promise<void> {
    // Only handle email-type notifications (those with recipient email)
    if (!event.recipient || !event.recipient.includes('@')) {
      return;
    }

    this.logger.debug(
      `Processing email notification: ${event.type} to ${event.recipient}`,
    );

    try {
      switch (event.type) {
        case 'CLAIM_VERIFICATION_EMAIL':
        case 'GUEST_CLAIM_VERIFICATION_EMAIL':
          await this.sendClaimVerificationEmail(event);
          break;

        case 'VENDOR_CLAIM_PENDING_REVIEW':
          await this.sendClaimPendingReviewEmail(event);
          break;

        case 'CLAIM_APPROVED':
          await this.sendClaimApprovedEmail(event);
          break;

        case 'CLAIM_REJECTED':
          await this.sendClaimRejectedEmail(event);
          break;

        case 'CLAIM_EXPIRED':
          await this.sendClaimExpiredEmail(event);
          break;

        case 'CLAIM_EXPIRY_WARNING':
          await this.sendClaimExpiryWarningEmail(event);
          break;

        default:
          this.logger.debug(
            `Unhandled email notification type: ${event.type}`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email notification ${event.type} to ${event.recipient}: ${(error as Error).message}`,
      );
    }
  }

  // ============================================================================
  // CLAIM VERIFICATION EMAIL
  // ============================================================================

  private async sendClaimVerificationEmail(
    event: NotificationEvent,
  ): Promise<void> {
    const { recipient, data } = event;
    if (!recipient || !data) return;

    const verificationCode = data.verificationCode as string;
    const businessName = data.businessName as string;
    const expiresIn = data.expiresIn as string;

    const result = await this.emailService.send({
      to: recipient,
      template: 'claim-verification',
      context: {
        verificationCode,
        businessName,
        expiresIn,
        supportEmail: this.configService.get<string>(
          'SUPPORT_EMAIL',
          'support@omnicassion.com',
        ),
      },
    });

    if (result.success) {
      this.logger.log(
        `Claim verification email sent to ${recipient} for ${businessName}`,
      );
    } else {
      this.logger.error(
        `Failed to send claim verification email: ${result.error}`,
      );
    }
  }

  // ============================================================================
  // CLAIM PENDING REVIEW EMAIL
  // ============================================================================

  private async sendClaimPendingReviewEmail(
    event: NotificationEvent,
  ): Promise<void> {
    const { recipient, data } = event;
    if (!recipient || !data) return;

    const businessName = data.businessName as string;
    const claimId = data.claimId as string;

    const result = await this.emailService.send({
      to: recipient,
      template: 'claim-pending-review',
      context: {
        businessName,
        claimId,
        dashboardUrl: `${this.frontendUrl}/dashboard`,
        supportEmail: this.configService.get<string>(
          'SUPPORT_EMAIL',
          'support@omnicassion.com',
        ),
      },
    });

    if (result.success) {
      this.logger.log(
        `Claim pending review email sent to ${recipient} for ${businessName}`,
      );
    } else {
      this.logger.error(
        `Failed to send claim pending review email: ${result.error}`,
      );
    }
  }

  // ============================================================================
  // CLAIM APPROVED EMAIL
  // ============================================================================

  @OnEvent('vendor.claim.approved')
  async handleClaimApproved(event: ClaimApprovedEvent): Promise<void> {
    this.logger.debug(`Handling claim approved event: ${event.claimId}`);

    try {
      const claim = await this.prisma.vendorClaim.findUnique({
        where: { id: event.claimId },
        include: {
          user: { select: { email: true, firstName: true } },
          vendorProfile: { select: { businessName: true, slug: true } },
        },
      });

      if (!claim?.user?.email) {
        this.logger.warn(`No email found for claim ${event.claimId}`);
        return;
      }

      await this.sendClaimApprovedEmail({
        type: 'CLAIM_APPROVED',
        recipient: claim.user.email,
        data: {
          businessName: claim.vendorProfile?.businessName,
          firstName: claim.user.firstName || 'there',
          dashboardUrl: `${this.frontendUrl}/vendor/${claim.vendorProfile?.slug}/dashboard`,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send claim approved email: ${(error as Error).message}`,
      );
    }
  }

  private async sendClaimApprovedEmail(
    event: NotificationEvent,
  ): Promise<void> {
    const { recipient, data } = event;
    if (!recipient || !data) return;

    const businessName = data.businessName as string;
    const firstName = (data.firstName as string) || 'there';
    const dashboardUrl =
      (data.dashboardUrl as string) || `${this.frontendUrl}/dashboard`;

    const result = await this.emailService.send({
      to: recipient,
      template: 'claim-approved',
      context: {
        businessName,
        firstName,
        dashboardUrl,
        supportEmail: this.configService.get<string>(
          'SUPPORT_EMAIL',
          'support@omnicassion.com',
        ),
      },
    });

    if (result.success) {
      this.logger.log(
        `Claim approved email sent to ${recipient} for ${businessName}`,
      );
    } else {
      this.logger.error(
        `Failed to send claim approved email: ${result.error}`,
      );
    }
  }

  // ============================================================================
  // CLAIM REJECTED EMAIL
  // ============================================================================

  @OnEvent('vendor.claim.rejected')
  async handleClaimRejected(event: ClaimRejectedEvent): Promise<void> {
    this.logger.debug(`Handling claim rejected event: ${event.claimId}`);

    try {
      const claim = await this.prisma.vendorClaim.findUnique({
        where: { id: event.claimId },
        include: {
          user: { select: { email: true, firstName: true } },
          vendorProfile: { select: { businessName: true } },
        },
      });

      if (!claim?.user?.email) {
        this.logger.warn(`No email found for claim ${event.claimId}`);
        return;
      }

      await this.sendClaimRejectedEmail({
        type: 'CLAIM_REJECTED',
        recipient: claim.user.email,
        data: {
          businessName: claim.vendorProfile?.businessName,
          firstName: claim.user.firstName || 'there',
          reason: event.reason,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send claim rejected email: ${(error as Error).message}`,
      );
    }
  }

  private async sendClaimRejectedEmail(
    event: NotificationEvent,
  ): Promise<void> {
    const { recipient, data } = event;
    if (!recipient || !data) return;

    const businessName = data.businessName as string;
    const firstName = (data.firstName as string) || 'there';
    const reason = data.reason as string;

    const result = await this.emailService.send({
      to: recipient,
      template: 'claim-rejected',
      context: {
        businessName,
        firstName,
        reason,
        supportEmail: this.configService.get<string>(
          'SUPPORT_EMAIL',
          'support@omnicassion.com',
        ),
      },
    });

    if (result.success) {
      this.logger.log(
        `Claim rejected email sent to ${recipient} for ${businessName}`,
      );
    } else {
      this.logger.error(
        `Failed to send claim rejected email: ${result.error}`,
      );
    }
  }

  // ============================================================================
  // CLAIM EXPIRED EMAIL
  // ============================================================================

  private async sendClaimExpiredEmail(event: NotificationEvent): Promise<void> {
    const { recipient, data } = event;
    if (!recipient || !data) return;

    const businessName = data.businessName as string;
    const firstName = (data.firstName as string) || 'there';

    const result = await this.emailService.send({
      to: recipient,
      subject: `Your claim for ${businessName} has expired`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Claim Expired</h1>
            <p>Hello ${firstName},</p>
            <p>Your claim for <strong>${businessName}</strong> has expired due to inactivity.</p>
            <p>If you're still interested in claiming this business, you can start a new claim request.</p>
            <p>
              <a href="${this.frontendUrl}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Visit Omnicassion
              </a>
            </p>
            <p>Best regards,<br>The Omnicassion Team</p>
          </body>
        </html>
      `,
    });

    if (result.success) {
      this.logger.log(`Claim expired email sent to ${recipient}`);
    }
  }

  // ============================================================================
  // CLAIM EXPIRY WARNING EMAIL
  // ============================================================================

  private async sendClaimExpiryWarningEmail(
    event: NotificationEvent,
  ): Promise<void> {
    const { recipient, data } = event;
    if (!recipient || !data) return;

    const businessName = data.businessName as string;
    const firstName = (data.firstName as string) || 'there';
    const daysRemaining = data.daysRemaining as number;

    const result = await this.emailService.send({
      to: recipient,
      subject: `Your claim for ${businessName} expires in ${daysRemaining} days`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Claim Expiring Soon</h1>
            <p>Hello ${firstName},</p>
            <p>Your claim for <strong>${businessName}</strong> will expire in <strong>${daysRemaining} days</strong>.</p>
            <p>Please complete any pending verification steps to avoid having to restart the claim process.</p>
            <p>
              <a href="${this.frontendUrl}/dashboard" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Complete Verification
              </a>
            </p>
            <p>Best regards,<br>The Omnicassion Team</p>
          </body>
        </html>
      `,
    });

    if (result.success) {
      this.logger.log(`Claim expiry warning email sent to ${recipient}`);
    }
  }
}
