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
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';

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
  private readonly templatesDir: string | undefined;
  private readonly brandContext: Record<string, unknown>;

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://omnicassion.com',
    );
    // Defaults available to every template (the layout footer relies on these).
    // Callers can override any of them through `context`.
    this.brandContext = {
      brandName: 'Omnicassion',
      frontendUrl,
      supportEmail: this.configService.get<string>(
        'SUPPORT_EMAIL',
        'support@omnicassion.com',
      ),
      supportUrl: this.configService.get<string>(
        'SUPPORT_URL',
        `${frontendUrl.replace(/\/$/, '')}/support`,
      ),
    };

    this.fromAddress = this.configService.get<string>(
      'EMAIL_FROM_ADDRESS',
      'noreply@omnicassion.com',
    );
    this.fromName = this.configService.get<string>(
      'EMAIL_FROM_NAME',
      'Omnicassion',
    );
    this.templatesDir = this.configService.get<string>('EMAIL_TEMPLATES_DIR');
  }

  async onModuleInit(): Promise<void> {
    this.registerHandlebarsHelpers();
    await this.loadTemplates();
    await this.initializeTransporter();
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

  /**
   * Finds the templates folder. Works from source (ts-node / jest), from the
   * compiled `dist` output (templates are copied there via nest-cli assets),
   * and from an explicit EMAIL_TEMPLATES_DIR override.
   */
  private async resolveTemplatesPath(): Promise<string | null> {
    const candidates = [
      this.templatesDir
        ? path.resolve(process.cwd(), this.templatesDir)
        : null,
      path.join(__dirname, 'templates'),
      path.resolve(process.cwd(), 'src/infrastructure/notifications/templates'),
      path.resolve(
        process.cwd(),
        'dist/infrastructure/notifications/templates',
      ),
    ].filter((candidate): candidate is string => Boolean(candidate));

    for (const candidate of candidates) {
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) {
          return candidate;
        }
      } catch {
        // try next candidate
      }
    }

    return null;
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesPath = await this.resolveTemplatesPath();

      if (!templatesPath) {
        this.logger.warn(
          'Email templates directory not found - template emails cannot be rendered',
        );
        return;
      }

      const entries = await fs.readdir(templatesPath, { withFileTypes: true });

      // Shared partials (layout, button, ...) live in `_partials/*.hbs`
      const partialsDir = path.join(templatesPath, '_partials');
      const partialFiles = await fs.readdir(partialsDir).catch(() => []);
      for (const file of partialFiles) {
        if (!file.endsWith('.hbs')) continue;
        const source = await fs.readFile(path.join(partialsDir, file), 'utf-8');
        Handlebars.registerPartial(path.basename(file, '.hbs'), source);
      }

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('_')) continue;

        const dir = entry.name;
        const templatePath = path.join(templatesPath, dir);

        try {
          const read = (file: string) =>
            fs.readFile(path.join(templatePath, file), 'utf-8').catch(() => null);

          const htmlContent = await read('html.hbs');
          const textContent = await read('text.hbs');
          const subjectContent = (await read('subject.hbs')) ?? dir;

          if (htmlContent) {
            this.templates.set(dir, {
              html: Handlebars.compile(htmlContent),
              // Plain-text parts and subjects must not be HTML-escaped,
              // otherwise URLs get mangled (e.g. "=" -> "&#x3D;").
              text: textContent
                ? Handlebars.compile(textContent, { noEscape: true })
                : undefined,
              subject: Handlebars.compile(subjectContent.trim(), {
                noEscape: true,
              }),
            });

            this.logger.debug(`Loaded email template: ${dir}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to load template ${dir}:`, error);
        }
      }

      this.logger.log(
        `Loaded ${this.templates.size} email templates from ${templatesPath}`,
      );
    } catch (error) {
      this.logger.warn('Failed to load email templates:', error);
    }
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  private buildContext(
    context: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return {
      ...this.brandContext,
      currentYear: new Date().getFullYear(),
      ...context,
    };
  }

  /**
   * Render a named template (html + text + subject) with the brand defaults applied.
   * Returns null when the template does not exist.
   */
  render(
    templateName: string,
    context: Record<string, unknown> = {},
  ): { html: string; text?: string; subject: string } | null {
    const template = this.templates.get(templateName);
    if (!template) return null;

    const data = this.buildContext(context);
    return {
      html: template.html(data),
      text: template.text ? template.text(data) : undefined,
      subject: template.subject(data),
    };
  }

  /**
   * Wrap already-built HTML content in the branded Omnicassion layout.
   * Use this for emails whose body is assembled in code rather than in a template file.
   */
  renderLayout(options: {
    content: string;
    title?: string;
    preheader?: string;
    context?: Record<string, unknown>;
  }): string {
    const wrapper = Handlebars.compile(
      '{{#> layout title=title preheader=preheader}}{{{content}}}{{/layout}}',
    );
    return wrapper(
      this.buildContext({
        ...options.context,
        title: options.title,
        preheader: options.preheader,
        content: options.content,
      }),
    );
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '')
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#x3D;/g, '=')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + '...';
    });

    // Concatenate helper, e.g. {{> layout title=(concat "Hello " name)}}
    Handlebars.registerHelper('concat', (...args: unknown[]) =>
      args.slice(0, -1).join(''),
    );
  }

  // ============================================================================
  // SENDING METHODS
  // ============================================================================

  async send(options: EmailOptions): Promise<EmailResult> {
    await this.ensureTransporterInitialized();

    // Wrap email sending with circuit breaker
    return this.circuitBreaker.execute(
      {
        name: 'email-service',
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000, // 1 minute
        volumeThreshold: 10,
        failureRateThreshold: 50,
      },
      async () => {
        try {
          let html = options.html;
          let text = options.text;
          let subject = options.subject;

          // Render template if specified
          if (options.template) {
            const rendered = this.render(options.template, options.context);

            if (!rendered) {
              throw new Error(
                `Email template "${options.template}" not found. Available: ${this.getAvailableTemplates().join(', ') || 'none loaded'}`,
              );
            }

            html = rendered.html;
            text = options.text ?? rendered.text;
            // An explicit subject from the caller wins over the template's subject
            subject = options.subject || rendered.subject;
          }

          // Always send a plain-text alternative (better deliverability)
          if (html && !text) {
            text = this.htmlToText(html);
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

              this.logger.debug(
                `Email sent to ${options.to}: ${result.messageId}`,
              );

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

          this.logger.error(
            `Failed to send email to ${options.to}:`,
            lastError,
          );

          return {
            success: false,
            error:
              (lastError as Error)?.message || 'Unknown email delivery error',
          };
        } catch (error) {
          this.logger.error(`Failed to send email to ${options.to}:`, error);

          return {
            success: false,
            error: (error as Error).message,
          };
        }
      },
      // Fallback: log error and return failure response
      async () => {
        this.logger.warn(
          `Email circuit breaker OPEN for ${options.to}. Email queued for later retry.`,
        );
        return {
          success: false,
          error: 'Email service temporarily unavailable. Will retry later.',
        };
      },
    );
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
    return this.render(templateName, context)?.html ?? null;
  }
}
