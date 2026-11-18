// ============================================================================
// EMAIL PROCESSOR - BullMQ Worker for Email Jobs
// ============================================================================
// Processes email jobs from the queue
// Handles single emails, bulk emails, and template rendering
// ============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../../notifications/email.service';
import {
  EMAIL_QUEUE_NAME,
  EmailJobData,
  EmailJobType,
  BulkEmailJobData,
} from '../queues/email.queue';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

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

    await job.updateProgress(10);

    // Templates are rendered (with the branded layout) by EmailService.send
    const result = await this.emailService.send({
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
    });

    // Throw so BullMQ applies the configured retry/backoff
    if (!result.success) {
      throw new Error(result.error || 'Email delivery failed');
    }

    await job.updateProgress(100);

    this.logger.log(`Email sent: ${job.id} to ${to}`);

    return { messageId: result.messageId ?? '' };
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
            const result = await this.emailService.send({
              to: recipient.email,
              subject,
              template,
              context: { ...recipient.context, ...metadata },
            });

            if (!result.success) {
              throw new Error(result.error || 'Email delivery failed');
            }

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
