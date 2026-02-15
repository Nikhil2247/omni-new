// ============================================================================
// EMAIL EVENT HANDLER - Handles Email-Related Events
// ============================================================================
// Listens to authentication events and sends appropriate emails
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ConfigService } from '@nestjs/config'
import { EmailService } from '../../../infrastructure/notifications/email.service'

interface UserRegisteredEvent {
  userId: string
  email: string
  timestamp: Date
}

interface EmailVerificationRequestedEvent {
  userId: string
  email: string
  token: string
  expiresAt: Date
}

interface PasswordResetRequestedEvent {
  userId: string
  email: string
  token: string
  expiresAt: Date
}

@Injectable()
export class EmailEventHandler {
  private readonly logger = new Logger(EmailEventHandler.name)
  private readonly frontendUrl: string

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://omnicassion.com',
    )
  }

  /**
   * Handle user registration - send welcome email after verification
   */
  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent) {
    this.logger.debug(
      `User registered event received: ${event.email} (${event.userId})`,
    )
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
      )

      const verificationUrl = `${this.frontendUrl}/verify-email?token=${event.token}`

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
      })

      if (result.success) {
        this.logger.log(
          `Verification email sent successfully to ${event.email}`,
        )
      } else {
        this.logger.error(
          `Failed to send verification email to ${event.email}: ${result.error}`,
        )
      }
    } catch (error) {
      this.logger.error(
        `Error sending verification email to ${event.email}:`,
        error,
      )
    }
  }

  /**
   * Handle email verified - send welcome email
   */
  @OnEvent('email.verified')
  async handleEmailVerified(event: { userId: string; email: string }) {
    try {
      this.logger.log(`Sending welcome email to ${event.email} (${event.userId})`)

      const result = await this.emailService.send({
        to: event.email,
        template: 'welcome',
        context: {
          email: event.email,
          loginUrl: `${this.frontendUrl}/login`,
          dashboardUrl: `${this.frontendUrl}/dashboard`,
        },
      })

      if (result.success) {
        this.logger.log(`Welcome email sent successfully to ${event.email}`)
      } else {
        this.logger.error(
          `Failed to send welcome email to ${event.email}: ${result.error}`,
        )
      }
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${event.email}:`, error)
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
      )

      const resetUrl = `${this.frontendUrl}/reset-password?token=${event.token}`

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
      })

      if (result.success) {
        this.logger.log(
          `Password reset email sent successfully to ${event.email}`,
        )
      } else {
        this.logger.error(
          `Failed to send password reset email to ${event.email}: ${result.error}`,
        )
      }
    } catch (error) {
      this.logger.error(
        `Error sending password reset email to ${event.email}:`,
        error,
      )
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
      this.logger.log(
        `Password reset event received for user ${event.userId}`,
      )
      
      // For now, we'll skip sending an email since we don't have the email in the event
      // This should be enhanced to include the email in the event payload from auth.service
    } catch (error) {
      this.logger.error(
        `Error handling password changed event:`,
        error,
      )
    }
  }
}
