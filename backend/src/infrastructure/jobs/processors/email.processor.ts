// ============================================================================
// EMAIL PROCESSOR - BullMQ Worker for Email Jobs
// ============================================================================
// Processes email jobs from the queue
// Handles single emails, bulk emails, and template rendering
// ============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EMAIL_QUEUE_NAME,
  EmailJobData,
  EmailJobType,
  BulkEmailJobData,
} from '../queues/email.queue';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData | BulkEmailJobData>): Promise<unknown> {
    this.logger.debug(`Processing email job: ${job.id} (${job.name})`);

    try {
      switch (job.name) {
        case EmailJobType.SEND_SINGLE:
        case EmailJobType.SEND_TEMPLATE:
        case EmailJobType.VERIFY_EMAIL:
        case EmailJobType.PASSWORD_RESET:
        case EmailJobType.WELCOME:
        case EmailJobType.EVENT_CONFIRMATION:
        case EmailJobType.TICKET_CONFIRMATION:
        case EmailJobType.PAYMENT_RECEIPT:
        case EmailJobType.REMINDER:
          return await this.processSingleEmail(job as Job<EmailJobData>);

        case EmailJobType.SEND_BULK:
        case EmailJobType.NEWSLETTER:
          return await this.processBulkEmail(job as Job<BulkEmailJobData>);

        default:
          return await this.processSingleEmail(job as Job<EmailJobData>);
      }
    } catch (error) {
      this.logger.error(`Email job failed: ${job.id}`, error);
      throw error;
    }
  }

  private async processSingleEmail(
    job: Job<EmailJobData>,
  ): Promise<{ messageId: string }> {
    const {
      to,
      subject,
      template,
      context,
      html,
      text,
      attachments,
      cc,
      bcc,
      replyTo,
    } = job.data;

    // Update progress
    await job.updateProgress(10);

    // Render template if specified
    let emailHtml = html;
    let emailText = text;
    let emailSubject = subject;

    if (template) {
      const rendered = await this.renderTemplate(template, context || {});
      emailHtml = rendered.html;
      emailText = rendered.text;
      emailSubject = emailSubject || rendered.subject;
    }

    await job.updateProgress(50);

    // Send email (placeholder - would integrate with actual email service)
    const messageId = await this.sendEmail({
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject || 'No Subject',
      html: emailHtml,
      text: emailText,
      attachments,
      cc,
      bcc,
      replyTo,
    });

    await job.updateProgress(100);

    this.logger.log(`Email sent: ${job.id} to ${to}`);

    return { messageId };
  }

  private async processBulkEmail(
    job: Job<BulkEmailJobData>,
  ): Promise<{ sent: number; failed: number }> {
    const { recipients, template, subject, metadata } = job.data;

    let sent = 0;
    let failed = 0;

    const totalRecipients = recipients.length;
    const batchSize = 10;

    for (let i = 0; i < totalRecipients; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (recipient) => {
          try {
            const rendered = await this.renderTemplate(template, {
              ...recipient.context,
              ...metadata,
            });

            await this.sendEmail({
              to: [recipient.email],
              subject,
              html: rendered.html,
              text: rendered.text,
            });

            sent++;
          } catch (error) {
            this.logger.error(`Failed to send to ${recipient.email}`, error);
            failed++;
          }
        }),
      );

      // Update progress
      const progress = Math.round(((i + batch.length) / totalRecipients) * 100);
      await job.updateProgress(progress);

      // Rate limiting - wait between batches
      if (i + batchSize < totalRecipients) {
        await this.sleep(1000);
      }
    }

    this.logger.log(
      `Bulk email completed: ${job.id} - sent: ${sent}, failed: ${failed}`,
    );

    return { sent, failed };
  }

  private async renderTemplate(
    template: string,
    context: Record<string, unknown>,
  ): Promise<{ html: string; text: string; subject?: string }> {
    // Placeholder - would integrate with actual template engine (e.g., Handlebars, MJML)
    // For now, return basic template

    const subjectMap: Record<string, string> = {
      welcome: 'Welcome to Omnicassion!',
      'email-verification': 'Verify Your Email Address',
      'password-reset': 'Reset Your Password',
      'event-confirmation': 'Your Event Registration is Confirmed',
      'ticket-confirmation': 'Your Tickets are Ready',
      'payment-receipt': 'Payment Receipt',
      'reminder-day-before': 'Event Reminder: Tomorrow!',
      'reminder-hour-before': 'Event Reminder: Starting Soon!',
      'reminder-week-before': 'Event Reminder: Coming Up Next Week',
      newsletter: 'Omnicassion Newsletter',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subjectMap[template] || 'Omnicassion'}</title>
      </head>
      <body>
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1>Omnicassion</h1>
          <p>Template: ${template}</p>
          <pre>${JSON.stringify(context, null, 2)}</pre>
        </div>
      </body>
      </html>
    `;

    const text = `Omnicassion - ${template}\n\n${JSON.stringify(context, null, 2)}`;

    return {
      html,
      text,
      subject: subjectMap[template],
    };
  }

  private async sendEmail(options: {
    to: string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: unknown[];
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
  }): Promise<string> {
    // Placeholder - would integrate with actual email provider (SendGrid, SES, etc.)
    // For now, simulate sending

    this.logger.debug(`Sending email to: ${options.to.join(', ')}`);

    // Simulate network delay
    await this.sleep(100);

    // Return fake message ID
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // WORKER EVENTS
  // ============================================================================

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailJobData>): void {
    this.logger.debug(`Email job completed: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobData>, error: Error): void {
    this.logger.error(`Email job failed: ${job.id}`, error.message);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<EmailJobData>, progress: number): void {
    this.logger.debug(`Email job progress: ${job.id} - ${progress}%`);
  }
}
