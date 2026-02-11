// ============================================================================
// EMAIL SERVICE - Email Sending and Template Management
// ============================================================================
// Provides email sending capabilities with template support
// Integrates with various email providers (SendGrid, SES, SMTP)
// ============================================================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import * as Handlebars from 'handlebars'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
  context?: Record<string, unknown>
  attachments?: EmailAttachment[]
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  from?: string
  headers?: Record<string, string>
}

export interface EmailAttachment {
  filename: string
  content?: string | Buffer
  path?: string
  contentType?: string
  cid?: string // For inline attachments
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

interface CompiledTemplate {
  subject: Handlebars.TemplateDelegate
  html: Handlebars.TemplateDelegate
  text?: Handlebars.TemplateDelegate
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name)
  private transporter: Transporter
  private readonly templates = new Map<string, CompiledTemplate>()
  private readonly fromAddress: string
  private readonly fromName: string
  private readonly templatesDir: string

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('EMAIL_FROM_ADDRESS', 'noreply@omnicassion.com')
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'Omnicassion')
    this.templatesDir = this.configService.get<string>(
      'EMAIL_TEMPLATES_DIR',
      'src/infrastructure/notifications/templates',
    )
  }

  async onModuleInit(): Promise<void> {
    await this.initializeTransporter()
    await this.loadTemplates()
    this.registerHandlebarsHelpers()
  }

  private async initializeTransporter(): Promise<void> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp')

    switch (provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: this.configService.get<string>('SENDGRID_API_KEY'),
          },
        })
        break

      case 'ses':
        // AWS SES configuration
        this.transporter = nodemailer.createTransport({
          host: `email-smtp.${this.configService.get<string>('AWS_REGION', 'us-east-1')}.amazonaws.com`,
          port: 587,
          auth: {
            user: this.configService.get<string>('AWS_SES_ACCESS_KEY'),
            pass: this.configService.get<string>('AWS_SES_SECRET_KEY'),
          },
        })
        break

      case 'mailgun':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          auth: {
            user: this.configService.get<string>('MAILGUN_USER'),
            pass: this.configService.get<string>('MAILGUN_PASSWORD'),
          },
        })
        break

      case 'smtp':
      default:
        const smtpUser = this.configService.get<string>('SMTP_USER')
        const smtpPass = this.configService.get<string>('SMTP_PASSWORD')

        if (!smtpUser || !smtpPass) {
          const testAccount = await nodemailer.createTestAccount()
          this.transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          })
          this.logger.warn('SMTP credentials missing. Using Ethereal test account for development.')
        } else {
          this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST', 'localhost'),
            port: this.configService.get<number>('SMTP_PORT', 587),
            secure: this.configService.get<boolean>('SMTP_SECURE', false),
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          })
        }
    }

    try {
      await this.transporter.verify()
      this.logger.log(`Email transporter initialized (${provider})`)
    } catch (error) {
      this.logger.warn(`Email transporter verification failed: ${error}`)
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesPath = path.resolve(process.cwd(), this.templatesDir)

      // Check if templates directory exists
      try {
        await fs.access(templatesPath)
      } catch {
        this.logger.debug('Templates directory not found, using inline templates only')
        return
      }

      const files = await fs.readdir(templatesPath)
      const templateDirs = files.filter(async (f) => {
        const stat = await fs.stat(path.join(templatesPath, f))
        return stat.isDirectory()
      })

      for (const dir of templateDirs) {
        const templatePath = path.join(templatesPath, dir)

        try {
          const htmlPath = path.join(templatePath, 'html.hbs')
          const textPath = path.join(templatePath, 'text.hbs')
          const subjectPath = path.join(templatePath, 'subject.hbs')

          const htmlContent = await fs.readFile(htmlPath, 'utf-8').catch(() => null)
          const textContent = await fs.readFile(textPath, 'utf-8').catch(() => null)
          const subjectContent = await fs.readFile(subjectPath, 'utf-8').catch(() => dir)

          if (htmlContent) {
            this.templates.set(dir, {
              html: Handlebars.compile(htmlContent),
              text: textContent ? Handlebars.compile(textContent) : undefined,
              subject: Handlebars.compile(subjectContent),
            })

            this.logger.debug(`Loaded email template: ${dir}`)
          }
        } catch (error) {
          this.logger.warn(`Failed to load template ${dir}:`, error)
        }
      }

      this.logger.log(`Loaded ${this.templates.size} email templates`)
    } catch (error) {
      this.logger.warn('Failed to load email templates:', error)
    }
  }

  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date)
      // Basic date formatting
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
      return d.toLocaleDateString('en-US', options)
    })

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount)
    })

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      return a === b ? options.fn(this) : options.inverse(this)
    })

    // Truncate helper
    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (str.length <= length) return str
      return str.substring(0, length) + '...'
    })
  }

  // ============================================================================
  // SENDING METHODS
  // ============================================================================

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      let html = options.html
      let text = options.text
      let subject = options.subject

      // Render template if specified
      if (options.template) {
        const template = this.templates.get(options.template)

        if (template) {
          const context = options.context || {}
          html = template.html(context)
          text = template.text ? template.text(context) : undefined
          subject = template.subject(context)
        } else {
          // Fallback to inline template
          html = this.renderInlineTemplate(options.template, options.context || {})
        }
      }

      const mailOptions = {
        from: options.from || `"${this.fromName}" <${this.fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        replyTo: options.replyTo,
        subject,
        html,
        text,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          path: a.path,
          contentType: a.contentType,
          cid: a.cid,
        })),
        headers: options.headers,
      }

      const result = await this.transporter.sendMail(mailOptions)

      this.logger.debug(`Email sent to ${options.to}: ${result.messageId}`)

      const previewUrl = nodemailer.getTestMessageUrl(result)
      if (previewUrl) {
        this.logger.debug(`Ethereal preview URL: ${previewUrl}`)
      }

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error)

      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  private renderInlineTemplate(templateName: string, context: Record<string, unknown>): string {
    // Fallback inline templates for common email types
    const templates: Record<string, string> = {
      welcome: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to Omnicassion!</h1>
            <p>Hello {{name}},</p>
            <p>Thank you for joining Omnicassion. We're excited to have you on board!</p>
            {{#if verificationUrl}}
            <p><a href="{{verificationUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify Your Email</a></p>
            {{/if}}
            <p>Best regards,<br>The Omnicassion Team</p>
          </body>
        </html>
      `,
      'email-verification': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Verify Your Email</h1>
            <p>Hello {{name}},</p>
            <p>Please click the button below to verify your email address:</p>
            <p><a href="{{verificationUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
            <p>This link will expire in 24 hours.</p>
          </body>
        </html>
      `,
      'password-reset': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Reset Your Password</h1>
            <p>Hello {{name}},</p>
            <p>You requested to reset your password. Click the button below:</p>
            <p><a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
            <p>This link will expire in {{expiresIn}}.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </body>
        </html>
      `,
      'wedding-partner-invite': `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>You're invited!</h1>
            <p>{{inviterName}} invited you to join <strong>{{displayName}}</strong> on Omnicassion.</p>
            <p><a href="{{inviteUrl}}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
            <p>If you didn’t request this, you can ignore this email.</p>
          </body>
        </html>
      `,
    }

    const template = templates[templateName]

    if (template) {
      const compiled = Handlebars.compile(template)
      return compiled(context)
    }

    return `<html><body><pre>${JSON.stringify(context, null, 2)}</pre></body></html>`
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  async sendWelcome(email: string, name: string, verificationUrl?: string): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: 'Welcome to Omnicassion!',
      template: 'welcome',
      context: { name, verificationUrl },
    })
  }

  async sendVerification(email: string, name: string, verificationUrl: string): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: { name, verificationUrl },
    })
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string, expiresIn: string = '1 hour'): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: { name, resetUrl, expiresIn },
    })
  }

  async sendEventConfirmation(
    email: string,
    context: {
      name: string
      eventName: string
      eventDate: string
      eventLocation: string
      orderNumber: string
    },
  ): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: `Event Confirmation: ${context.eventName}`,
      template: 'event-confirmation',
      context,
    })
  }

  async sendTicketConfirmation(
    email: string,
    context: {
      name: string
      eventName: string
      eventDate: string
      tickets: Array<{ type: string; quantity: number }>
      qrCodeUrl?: string
    },
  ): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: `Your Tickets for ${context.eventName}`,
      template: 'ticket-confirmation',
      context,
    })
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch {
      return false
    }
  }

  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys())
  }

  async previewTemplate(templateName: string, context: Record<string, unknown>): Promise<string | null> {
    const template = this.templates.get(templateName)

    if (template) {
      return template.html(context)
    }

    return this.renderInlineTemplate(templateName, context)
  }
}
