// ============================================================================
// EMAIL EVENT HANDLER - Handles Email-Related Events
// ============================================================================
// Listens to authentication events and sends appropriate emails
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../../infrastructure/notifications/email.service';

interface UserRegisteredEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

interface EmailVerificationRequestedEvent {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
}

interface PasswordResetRequestedEvent {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class EmailEventHandler {
  private readonly logger = new Logger(EmailEventHandler.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://omnicassion.com',
    );
  }

  /**
   * Handle user registration - send welcome email after verification
   */
  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent) {
    this.logger.debug(
      `User registered event received: ${event.email} (${event.userId})`,
    );
    // Note: Welcome email is sent after email verification
    // The email verification email is sent via 'email.verificationRequested' event
  }

  /**
   * Handle email verification request - send verification email
   */
  @OnEvent('email.verificationRequested')
  async handleEmailVerificationRequested(
    event: EmailVerificationRequestedEvent,
  ) {
    try {
      this.logger.log(
        `Sending verification email to ${event.email} (${event.userId})`,
      );

      const verificationUrl = `${this.frontendUrl}/verify-email?token=${event.token}`;

      const result = await this.emailService.send({
        to: event.email,
        template: 'email-verification',
        context: {
          email: event.email,
          verificationUrl,
          expiresAt: event.expiresAt,
          expiresInHours: Math.round(
            (event.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60),
          ),
        },
      });

      if (result.success) {
        this.logger.log(
          `Verification email sent successfully to ${event.email}`,
        );
      } else {
        this.logger.error(
          `Failed to send verification email to ${event.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending verification email to ${event.email}:`,
        error,
      );
    }
  }

  /**
   * Handle email verified - send welcome email
   */
  @OnEvent('email.verified')
  async handleEmailVerified(event: { userId: string; email: string }) {
    try {
      this.logger.log(
        `Sending welcome email to ${event.email} (${event.userId})`,
      );

      const result = await this.emailService.send({
        to: event.email,
        template: 'welcome',
        context: {
          email: event.email,
          loginUrl: `${this.frontendUrl}/login`,
          dashboardUrl: `${this.frontendUrl}/dashboard`,
        },
      });

      if (result.success) {
        this.logger.log(`Welcome email sent successfully to ${event.email}`);
      } else {
        this.logger.error(
          `Failed to send welcome email to ${event.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending welcome email to ${event.email}:`,
        error,
      );
    }
  }

  /**
   * Handle password reset request - send password reset email
   */
  @OnEvent('user.passwordResetRequested')
  async handlePasswordResetRequested(event: PasswordResetRequestedEvent) {
    try {
      this.logger.log(
        `Sending password reset email to ${event.email} (${event.userId})`,
      );

      const resetUrl = `${this.frontendUrl}/reset-password?token=${event.token}`;

      const result = await this.emailService.send({
        to: event.email,
        template: 'password-reset',
        context: {
          email: event.email,
          resetUrl,
          expiresAt: event.expiresAt,
          expiresInHours: Math.round(
            (event.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60),
          ),
        },
      });

      if (result.success) {
        this.logger.log(
          `Password reset email sent successfully to ${event.email}`,
        );
      } else {
        this.logger.error(
          `Failed to send password reset email to ${event.email}: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error sending password reset email to ${event.email}:`,
        error,
      );
    }
  }

  /**
   * Handle password changed - send confirmation email
   */
  @OnEvent('user.passwordReset')
  async handlePasswordChanged(event: { userId: string; timestamp: Date }) {
    try {
      // Fetch user email
      // Note: We need to fetch the email from the database since the event doesn't include it
      // In a production environment, consider including email in the event payload
      this.logger.log(`Password reset event received for user ${event.userId}`);

      // For now, we'll skip sending an email since we don't have the email in the event
      // This should be enhanced to include the email in the event payload from auth.service
    } catch (error) {
      this.logger.error(`Error handling password changed event:`, error);
    }
  }

  /**
   * Handle generic notification.send events for email notifications
   */
  @OnEvent('notification.send')
  async handleNotificationSend(event: {
    type: string;
    recipient: string;
    data: Record<string, any>;
  }) {
    try {
      switch (event.type) {
        case 'GUEST_CLAIM_VERIFICATION_EMAIL':
          await this.sendGuestClaimVerificationEmail(
            event.recipient,
            event.data as { verificationCode: string; businessName: string; expiresIn: string },
          );
          break;
        case 'VENDOR_CLAIM_SUCCESS':
          await this.sendVendorClaimSuccessEmail(
            event.recipient,
            event.data as { businessName: string },
          );
          break;
        case 'CLAIM_VERIFICATION_EMAIL':
          // Existing claim verification for logged-in users
          await this.sendClaimVerificationEmail(
            event.recipient,
            event.data as { verificationCode: string; businessName: string; expiresIn: string },
          );
          break;
        default:
          this.logger.debug(`Unhandled notification type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling notification.send event (${event.type}):`,
        error,
      );
    }
  }

  /**
   * Send guest claim verification email
   */
  private async sendGuestClaimVerificationEmail(
    email: string,
    data: { verificationCode: string; businessName: string; expiresIn: string },
  ) {
    this.logger.log(`Sending guest claim verification email to ${email}`);

    const result = await this.emailService.send({
      to: email,
      template: 'claim-verification',
      context: {
        verificationCode: data.verificationCode,
        businessName: data.businessName,
        expiresIn: data.expiresIn,
        currentYear: new Date().getFullYear(),
      },
    });

    if (result.success) {
      this.logger.log(
        `Guest claim verification email sent successfully to ${email}`,
      );
    } else {
      this.logger.error(
        `Failed to send guest claim verification email to ${email}: ${result.error}`,
      );
    }
  }

  /**
   * Send vendor claim success email
   */
  private async sendVendorClaimSuccessEmail(
    email: string,
    data: { businessName: string },
  ) {
    this.logger.log(`Sending vendor claim success email to ${email}`);

    // For now, send a welcome-like email
    // You can create a dedicated template later
    const result = await this.emailService.send({
      to: email,
      template: 'welcome',
      context: {
        email,
        businessName: data.businessName,
        loginUrl: `${this.frontendUrl}/login`,
        dashboardUrl: `${this.frontendUrl}/business/onboarding`,
        message: `Congratulations! You have successfully claimed ${data.businessName} on Omnicassion.`,
      },
    });

    if (result.success) {
      this.logger.log(
        `Vendor claim success email sent successfully to ${email}`,
      );
    } else {
      this.logger.error(
        `Failed to send vendor claim success email to ${email}: ${result.error}`,
      );
    }
  }

  /**
   * Send claim verification email (for logged-in users claiming)
   */
  private async sendClaimVerificationEmail(
    email: string,
    data: { verificationCode: string; businessName: string; expiresIn: string },
  ) {
    this.logger.log(`Sending claim verification email to ${email}`);

    const result = await this.emailService.send({
      to: email,
      template: 'claim-verification',
      context: {
        verificationCode: data.verificationCode,
        businessName: data.businessName,
        expiresIn: data.expiresIn,
        currentYear: new Date().getFullYear(),
      },
    });

    if (result.success) {
      this.logger.log(
        `Claim verification email sent successfully to ${email}`,
      );
    } else {
      this.logger.error(
        `Failed to send claim verification email to ${email}: ${result.error}`,
      );
    }
  }
}
