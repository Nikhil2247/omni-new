// ============================================================================
// EMAIL QUEUE - Email Job Queue Service
// ============================================================================
// Manages email sending jobs with BullMQ
// Supports templates, bulk sending, and scheduling
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue, JobsOptions } from 'bullmq'

export const EMAIL_QUEUE_NAME = 'email'

export enum EmailJobType {
  SEND_SINGLE = 'send-single',
  SEND_BULK = 'send-bulk',
  SEND_TEMPLATE = 'send-template',
  VERIFY_EMAIL = 'verify-email',
  PASSWORD_RESET = 'password-reset',
  WELCOME = 'welcome',
  EVENT_CONFIRMATION = 'event-confirmation',
  TICKET_CONFIRMATION = 'ticket-confirmation',
  PAYMENT_RECEIPT = 'payment-receipt',
  REMINDER = 'reminder',
  NEWSLETTER = 'newsletter',
}

export interface EmailJobData {
  type: EmailJobType
  to: string | string[]
  subject?: string
  template?: string
  context?: Record<string, unknown>
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    path?: string
    content?: string | Buffer
    contentType?: string
  }>
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  priority?: 'high' | 'normal' | 'low'
  metadata?: Record<string, unknown>
}

export interface BulkEmailJobData {
  recipients: Array<{
    email: string
    context?: Record<string, unknown>
  }>
  template: string
  subject: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class EmailQueue {
  private readonly logger = new Logger(EmailQueue.name)

  constructor(@InjectQueue(EMAIL_QUEUE_NAME) private readonly queue: Queue) {}

  // ============================================================================
  // SINGLE EMAIL
  // ============================================================================

  async sendEmail(data: EmailJobData, options?: JobsOptions): Promise<string> {
    const job = await this.queue.add(data.type || EmailJobType.SEND_SINGLE, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
      ...options,
    })

    this.logger.debug(`Email job queued: ${job.id} to ${data.to}`)

    return job.id as string
  }

  async sendEmailWithDelay(data: EmailJobData, delayMs: number): Promise<string> {
    return this.sendEmail(data, { delay: delayMs })
  }

  async scheduleEmail(data: EmailJobData, scheduledTime: Date): Promise<string> {
    const delay = scheduledTime.getTime() - Date.now()

    if (delay <= 0) {
      return this.sendEmail(data)
    }

    return this.sendEmail(data, { delay })
  }

  // ============================================================================
  // TEMPLATE EMAILS
  // ============================================================================

  async sendWelcomeEmail(
    email: string,
    context: { name: string; verificationUrl?: string },
  ): Promise<string> {
    return this.sendEmail({
      type: EmailJobType.WELCOME,
      to: email,
      template: 'welcome',
      context,
    })
  }

  async sendVerificationEmail(
    email: string,
    context: { name: string; verificationUrl: string },
  ): Promise<string> {
    return this.sendEmail(
      {
        type: EmailJobType.VERIFY_EMAIL,
        to: email,
        template: 'email-verification',
        context,
      },
      { priority: 1 },
    )
  }

  async sendPasswordResetEmail(
    email: string,
    context: { name: string; resetUrl: string; expiresIn: string },
  ): Promise<string> {
    return this.sendEmail(
      {
        type: EmailJobType.PASSWORD_RESET,
        to: email,
        template: 'password-reset',
        context,
      },
      { priority: 1 },
    )
  }

  async sendEventConfirmationEmail(
    email: string,
    context: {
      name: string
      eventName: string
      eventDate: string
      eventLocation: string
      ticketCount: number
      orderNumber: string
    },
  ): Promise<string> {
    return this.sendEmail({
      type: EmailJobType.EVENT_CONFIRMATION,
      to: email,
      template: 'event-confirmation',
      context,
    })
  }

  async sendTicketConfirmationEmail(
    email: string,
    context: {
      name: string
      ticketDetails: Array<{
        ticketType: string
        quantity: number
        price: string
      }>
      eventName: string
      eventDate: string
      qrCodeUrl: string
      ticketDownloadUrl: string
    },
  ): Promise<string> {
    return this.sendEmail({
      type: EmailJobType.TICKET_CONFIRMATION,
      to: email,
      template: 'ticket-confirmation',
      context,
    })
  }

  async sendPaymentReceiptEmail(
    email: string,
    context: {
      name: string
      orderNumber: string
      amount: string
      currency: string
      paymentMethod: string
      items: Array<{
        description: string
        quantity: number
        price: string
      }>
      receiptUrl: string
    },
  ): Promise<string> {
    return this.sendEmail({
      type: EmailJobType.PAYMENT_RECEIPT,
      to: email,
      template: 'payment-receipt',
      context,
    })
  }

  async sendReminderEmail(
    email: string,
    context: {
      name: string
      eventName: string
      eventDate: string
      eventLocation: string
      reminderType: 'day-before' | 'hour-before' | 'week-before'
    },
    sendAt?: Date,
  ): Promise<string> {
    const jobData: EmailJobData = {
      type: EmailJobType.REMINDER,
      to: email,
      template: `reminder-${context.reminderType}`,
      context,
    }

    if (sendAt) {
      return this.scheduleEmail(jobData, sendAt)
    }

    return this.sendEmail(jobData)
  }

  // ============================================================================
  // BULK EMAILS
  // ============================================================================

  async sendBulkEmails(data: BulkEmailJobData): Promise<string> {
    const job = await this.queue.add(EmailJobType.SEND_BULK, data, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
    })

    this.logger.debug(`Bulk email job queued: ${job.id} for ${data.recipients.length} recipients`)

    return job.id as string
  }

  async sendNewsletterBatch(
    recipients: Array<{ email: string; name: string }>,
    newsletterId: string,
    subject: string,
    content: string,
  ): Promise<string> {
    return this.sendBulkEmails({
      recipients: recipients.map((r) => ({
        email: r.email,
        context: { name: r.name, unsubscribeUrl: `{{unsubscribe_url}}` },
      })),
      template: 'newsletter',
      subject,
      metadata: { newsletterId, content },
    })
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  async getJobStatus(jobId: string): Promise<{
    id: string
    status: string
    progress: number
    data: EmailJobData
    failedReason?: string
    finishedOn?: number
  } | null> {
    const job = await this.queue.getJob(jobId)

    if (!job) return null

    const state = await job.getState()

    return {
      id: job.id as string,
      status: state,
      progress: job.progress as number,
      data: job.data as EmailJobData,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId)

    if (!job) return false

    const state = await job.getState()

    if (state === 'waiting' || state === 'delayed') {
      await job.remove()
      this.logger.debug(`Email job cancelled: ${jobId}`)
      return true
    }

    return false
  }

  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ])

    return { waiting, active, completed, failed, delayed }
  }

  async pauseQueue(): Promise<void> {
    await this.queue.pause()
    this.logger.warn('Email queue paused')
  }

  async resumeQueue(): Promise<void> {
    await this.queue.resume()
    this.logger.log('Email queue resumed')
  }

  async drainQueue(): Promise<void> {
    await this.queue.drain()
    this.logger.warn('Email queue drained')
  }
}
