// ============================================================================
// EMAIL SERVICE - Email Sending and Template Management
// ============================================================================
// Provides email sending capabilities with template support
// Integrates with various email providers (SendGrid, SES, SMTP)
// ============================================================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  from?: string;
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  cid?: string; // For inline attachments
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailConnectionResult {
  connected: boolean;
  error?: string;
}

interface CompiledTemplate {
  subject: Handlebars.TemplateDelegate;
  html: Handlebars.TemplateDelegate;
  text?: Handlebars.TemplateDelegate;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly templates = new Map<string, CompiledTemplate>();
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.get<string>(
      'EMAIL_FROM_ADDRESS',
      'noreply@omnicassion.com',
    );
    this.fromName = this.configService.get<string>(
      'EMAIL_FROM_NAME',
      'Omnicassion',
    );
    this.templatesDir = this.configService.get<string>(
      'EMAIL_TEMPLATES_DIR',
      'src/infrastructure/notifications/templates',
    );
  }

  async onModuleInit(): Promise<void> {
    await this.initializeTransporter();
    await this.loadTemplates();
    this.registerHandlebarsHelpers();
  }

  private async ensureTransporterInitialized(): Promise<void> {
    if (!this.transporter) {
      await this.initializeTransporter();
    }
  }

  private getBooleanConfig(key: string, defaultValue: boolean): boolean {
    const rawValue = this.configService.get<string | boolean>(key);

    if (rawValue === undefined || rawValue === null) {
      return defaultValue;
    }

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    const normalized = rawValue.toString().trim().toLowerCase();
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    );
  }

  private getNumberConfig(key: string, defaultValue: number): number {
    const rawValue = this.configService.get<string | number>(key);

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return defaultValue;
    }

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return rawValue;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
  }

  private async initializeTransporter(): Promise<void> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const shouldVerifyOnStartup = this.getBooleanConfig(
      'EMAIL_VERIFY_ON_STARTUP',
      nodeEnv === 'production',
    );
    const smtpConnectionTimeout = this.getNumberConfig(
      'SMTP_CONNECTION_TIMEOUT_MS',
      10000,
    );
    const smtpGreetingTimeout = this.getNumberConfig(
      'SMTP_GREETING_TIMEOUT_MS',
      10000,
    );
    const smtpSocketTimeout = this.getNumberConfig(
      'SMTP_SOCKET_TIMEOUT_MS',
      20000,
    );

    switch (provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          connectionTimeout: smtpConnectionTimeout,
          greetingTimeout: smtpGreetingTimeout,
          socketTimeout: smtpSocketTimeout,
          auth: {
            user: 'apikey',
            pass: this.configService.get<string>('SENDGRID_API_KEY'),
          },
        });
        break;

      case 'ses':
        // AWS SES configuration
        this.transporter = nodemailer.createTransport({
          host: `email-smtp.${this.configService.get<string>('AWS_REGION', 'us-east-1')}.amazonaws.com`,
          port: 587,
          connectionTimeout: smtpConnectionTimeout,
          greetingTimeout: smtpGreetingTimeout,
          socketTimeout: smtpSocketTimeout,
          auth: {
            user: this.configService.get<string>('AWS_SES_ACCESS_KEY'),
            pass: this.configService.get<string>('AWS_SES_SECRET_KEY'),
          },
        });
        break;

      case 'mailgun':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          connectionTimeout: smtpConnectionTimeout,
          greetingTimeout: smtpGreetingTimeout,
          socketTimeout: smtpSocketTimeout,
          auth: {
            user: this.configService.get<string>('MAILGUN_USER'),
            pass: this.configService.get<string>('MAILGUN_PASSWORD'),
          },
        });
        break;

      case 'smtp':
      default:
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPass = this.configService.get<string>('SMTP_PASSWORD');
        const smtpHost = this.configService.get<string>(
          'SMTP_HOST',
          'localhost',
        );
        const smtpPort = this.getNumberConfig('SMTP_PORT', 587);
        const smtpSecure = this.getBooleanConfig('SMTP_SECURE', false);

        if (!smtpUser || !smtpPass) {
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            connectionTimeout: smtpConnectionTimeout,
            greetingTimeout: smtpGreetingTimeout,
            socketTimeout: smtpSocketTimeout,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          this.logger.warn(
            'SMTP credentials missing. Using Ethereal test account for development.',
          );
        } else {
          const smtpRequireTls = this.getBooleanConfig(
            'SMTP_REQUIRE_TLS',
            true,
          );
          const smtpRejectUnauthorized = this.getBooleanConfig(
            'SMTP_REJECT_UNAUTHORIZED',
            true,
          );

          this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            connectionTimeout: smtpConnectionTimeout,
            greetingTimeout: smtpGreetingTimeout,
            socketTimeout: smtpSocketTimeout,
            requireTLS: smtpRequireTls,
            tls: {
              rejectUnauthorized: smtpRejectUnauthorized,
            },
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });
        }
    }

    if (!shouldVerifyOnStartup) {
      this.logger.log(
        `Email transporter initialized (${provider}) - startup verification skipped`,
      );
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log(`Email transporter initialized (${provider})`);
    } catch (error) {
      this.logger.warn(`Email transporter verification failed: ${error}`);
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesPath = path.resolve(process.cwd(), this.templatesDir);

      // Check if templates directory exists
      try {
        await fs.access(templatesPath);
      } catch {
        this.logger.debug(
          'Templates directory not found, using inline templates only',
        );
        return;
      }

      const files = await fs.readdir(templatesPath);
      const templateDirs = files.filter(async (f) => {
        const stat = await fs.stat(path.join(templatesPath, f));
        return stat.isDirectory();
      });

      for (const dir of templateDirs) {
        const templatePath = path.join(templatesPath, dir);

        try {
          const htmlPath = path.join(templatePath, 'html.hbs');
          const textPath = path.join(templatePath, 'text.hbs');
          const subjectPath = path.join(templatePath, 'subject.hbs');

          const htmlContent = await fs
            .readFile(htmlPath, 'utf-8')
            .catch(() => null);
          const textContent = await fs
            .readFile(textPath, 'utf-8')
            .catch(() => null);
          const subjectContent = await fs
            .readFile(subjectPath, 'utf-8')
            .catch(() => dir);

          if (htmlContent) {
            this.templates.set(dir, {
              html: Handlebars.compile(htmlContent),
              text: textContent ? Handlebars.compile(textContent) : undefined,
              subject: Handlebars.compile(subjectContent),
            });

            this.logger.debug(`Loaded email template: ${dir}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to load template ${dir}:`, error);
        }
      }

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.warn('Failed to load email templates:', error);
    }
  }

  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper(
      'formatDate',
      (date: Date | string, format: string) => {
        const d = new Date(date);
        // Basic date formatting
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
        return d.toLocaleDateString('en-US', options);
      },
    );

    // Currency formatting helper
    Handlebars.registerHelper(
      'formatCurrency',
      (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      },
    );

    // Conditional helper
    Handlebars.registerHelper(
      'ifEquals',
      function (
        this: unknown,
        a: unknown,
        b: unknown,
        options: Handlebars.HelperOptions,
      ) {
        return a === b ? options.fn(this) : options.inverse(this);
      },
    );

    // Truncate helper
    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (str.length <= length) return str;
      return str.substring(0, length) + '...';
    });
  }

  // ============================================================================
  // SENDING METHODS
  // ============================================================================

  async send(options: EmailOptions): Promise<EmailResult> {
    await this.ensureTransporterInitialized();

    try {
      let html = options.html;
      let text = options.text;
      let subject = options.subject;

      // Render template if specified
      if (options.template) {
        const template = this.templates.get(options.template);

        if (template) {
          const context = options.context || {};
          html = template.html(context);
          text = template.text ? template.text(context) : undefined;
          subject = template.subject(context);
        } else {
          // Fallback to inline template
          html = this.renderInlineTemplate(
            options.template,
            options.context || {},
          );
        }
      }

      const mailOptions = {
        from: options.from || `"${this.fromName}" <${this.fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
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
      };

      const retryAttempts = Math.max(
        0,
        this.getNumberConfig('EMAIL_SEND_RETRY_ATTEMPTS', 2),
      );
      const retryDelayMs = Math.max(
        100,
        this.getNumberConfig('EMAIL_SEND_RETRY_DELAY_MS', 1500),
      );

      let lastError: unknown = null;

      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const result = await this.transporter.sendMail(mailOptions);

          this.logger.debug(`Email sent to ${options.to}: ${result.messageId}`);

          const previewUrl = nodemailer.getTestMessageUrl(result);
          if (previewUrl) {
            this.logger.debug(`Ethereal preview URL: ${previewUrl}`);
          }

          return {
            success: true,
            messageId: result.messageId,
          };
        } catch (error) {
          lastError = error;

          const shouldRetry = this.shouldRetryEmailError(error);
          const isLastAttempt = attempt >= retryAttempts;

          if (!shouldRetry || isLastAttempt) {
            break;
          }

          const delayMs = retryDelayMs * 2 ** attempt;
          const currentAttempt = attempt + 1;
          const totalAttempts = retryAttempts + 1;

          this.logger.warn(
            `Transient email delivery failure to ${options.to} (attempt ${currentAttempt}/${totalAttempts}): ${(error as Error).message}. Retrying in ${delayMs}ms`,
          );

          await this.sleep(delayMs);
        }
      }

      this.logger.error(`Failed to send email to ${options.to}:`, lastError);

      return {
        success: false,
        error: (lastError as Error)?.message || 'Unknown email delivery error',
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private shouldRetryEmailError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const smtpError = error as {
      code?: string;
      responseCode?: number;
      message?: string;
    };

    const responseCode = smtpError.responseCode;
    const code = (smtpError.code || '').toUpperCase();
    const message = smtpError.message || '';

    if (
      responseCode !== undefined &&
      responseCode >= 400 &&
      responseCode < 500
    ) {
      return true;
    }

    const transientCodes = new Set([
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ENOTFOUND',
      'ESOCKET',
    ]);

    if (transientCodes.has(code)) {
      return true;
    }

    return /try again later|temporar|timeout|timed out|rate limit/i.test(
      message,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private renderInlineTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): string {
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
    };

    const template = templates[templateName];

    if (template) {
      const compiled = Handlebars.compile(template);
      return compiled(context);
    }

    return `<html><body><pre>${JSON.stringify(context, null, 2)}</pre></body></html>`;
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  async sendWelcome(
    email: string,
    name: string,
    verificationUrl?: string,
  ): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: 'Welcome to Omnicassion!',
      template: 'welcome',
      context: { name, verificationUrl },
    });
  }

  async sendVerification(
    email: string,
    name: string,
    verificationUrl: string,
  ): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      context: { name, verificationUrl },
    });
  }

  async sendPasswordReset(
    email: string,
    name: string,
    resetUrl: string,
    expiresIn: string = '1 hour',
  ): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: { name, resetUrl, expiresIn },
    });
  }

  async sendEventConfirmation(
    email: string,
    context: {
      name: string;
      eventName: string;
      eventDate: string;
      eventLocation: string;
      orderNumber: string;
    },
  ): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: `Event Confirmation: ${context.eventName}`,
      template: 'event-confirmation',
      context,
    });
  }

  async sendTicketConfirmation(
    email: string,
    context: {
      name: string;
      eventName: string;
      eventDate: string;
      tickets: Array<{ type: string; quantity: number }>;
      qrCodeUrl?: string;
    },
  ): Promise<EmailResult> {
    return this.send({
      to: email,
      subject: `Your Tickets for ${context.eventName}`,
      template: 'ticket-confirmation',
      context,
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async verifyConnection(): Promise<boolean> {
    try {
      await this.ensureTransporterInitialized();
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  async verifyConnectionWithDetails(): Promise<EmailConnectionResult> {
    try {
      await this.ensureTransporterInitialized();
      await this.transporter.verify();
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  async previewTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<string | null> {
    const template = this.templates.get(templateName);

    if (template) {
      return template.html(context);
    }

    return this.renderInlineTemplate(templateName, context);
  }
}
