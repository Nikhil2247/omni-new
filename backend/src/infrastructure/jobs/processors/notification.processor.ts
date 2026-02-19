// ============================================================================
// NOTIFICATION PROCESSOR - BullMQ Worker for Notification Jobs
// ============================================================================
// Processes notification jobs (push, in-app, SMS)
// ============================================================================

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const NOTIFICATION_QUEUE_NAME = 'notification';

export enum NotificationJobType {
  PUSH_SINGLE = 'push-single',
  PUSH_BULK = 'push-bulk',
  IN_APP = 'in-app',
  SMS = 'sms',
  WEBHOOK = 'webhook',
}

export interface PushNotificationJobData {
  type: NotificationJobType.PUSH_SINGLE | NotificationJobType.PUSH_BULK;
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface InAppNotificationJobData {
  type: NotificationJobType.IN_APP;
  userId: string;
  title: string;
  message: string;
  category: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SmsNotificationJobData {
  type: NotificationJobType.SMS;
  phoneNumber: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookNotificationJobData {
  type: NotificationJobType.WEBHOOK;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body: Record<string, unknown>;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export type NotificationJobData =
  | PushNotificationJobData
  | InAppNotificationJobData
  | SmsNotificationJobData
  | WebhookNotificationJobData;

@Processor(NOTIFICATION_QUEUE_NAME)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<NotificationJobData>): Promise<unknown> {
    this.logger.debug(`Processing notification job: ${job.id} (${job.name})`);

    try {
      switch (job.data.type) {
        case NotificationJobType.PUSH_SINGLE:
          return await this.processPushSingle(
            job as Job<PushNotificationJobData>,
          );

        case NotificationJobType.PUSH_BULK:
          return await this.processPushBulk(
            job as Job<PushNotificationJobData>,
          );

        case NotificationJobType.IN_APP:
          return await this.processInApp(job as Job<InAppNotificationJobData>);

        case NotificationJobType.SMS:
          return await this.processSms(job as Job<SmsNotificationJobData>);

        case NotificationJobType.WEBHOOK:
          return await this.processWebhook(
            job as Job<WebhookNotificationJobData>,
          );

        default:
          throw new Error(
            `Unknown notification type: ${(job.data as NotificationJobData).type}`,
          );
      }
    } catch (error) {
      this.logger.error(`Notification job failed: ${job.id}`, error);
      throw error;
    }
  }

  // ============================================================================
  // PUSH NOTIFICATIONS
  // ============================================================================

  private async processPushSingle(
    job: Job<PushNotificationJobData>,
  ): Promise<{ sent: boolean }> {
    const { userId, title, body, data, imageUrl, actionUrl } = job.data;

    await job.updateProgress(10);

    this.logger.debug(`Sending push notification to user: ${userId}`);

    // Placeholder - would integrate with Firebase Cloud Messaging (FCM) or similar
    // const admin = require('firebase-admin')
    // const userTokens = await getUserDeviceTokens(userId)
    //
    // await admin.messaging().sendMulticast({
    //   tokens: userTokens,
    //   notification: { title, body, imageUrl },
    //   data: { ...data, actionUrl },
    // })

    await this.sleep(200);
    await job.updateProgress(100);

    this.logger.log(`Push notification sent to user: ${userId}`);

    return { sent: true };
  }

  private async processPushBulk(
    job: Job<PushNotificationJobData>,
  ): Promise<{ sent: number; failed: number }> {
    const { userIds, title, body, data, imageUrl, actionUrl } = job.data;

    if (!userIds || userIds.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    const failed = 0;

    const batchSize = 500; // FCM limit
    const totalUsers = userIds.length;

    for (let i = 0; i < totalUsers; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      // Placeholder - would use FCM
      // const tokens = await getUserDeviceTokens(batch)
      // const result = await admin.messaging().sendMulticast({
      //   tokens,
      //   notification: { title, body, imageUrl },
      //   data: { ...data, actionUrl },
      // })
      // sent += result.successCount
      // failed += result.failureCount

      sent += batch.length;
      await this.sleep(100);

      const progress = Math.round(((i + batch.length) / totalUsers) * 100);
      await job.updateProgress(progress);
    }

    this.logger.log(`Bulk push sent: ${sent} success, ${failed} failed`);

    return { sent, failed };
  }

  // ============================================================================
  // IN-APP NOTIFICATIONS
  // ============================================================================

  private async processInApp(
    job: Job<InAppNotificationJobData>,
  ): Promise<{ notificationId: string }> {
    const {
      userId,
      title,
      message,
      category,
      actionUrl,
      actionLabel,
      expiresAt,
    } = job.data;

    await job.updateProgress(10);

    this.logger.debug(`Creating in-app notification for user: ${userId}`);

    // Placeholder - would save to database
    // const notification = await prisma.notification.create({
    //   data: {
    //     userId,
    //     title,
    //     message,
    //     category,
    //     actionUrl,
    //     actionLabel,
    //     expiresAt,
    //     isRead: false,
    //   },
    // })

    const notificationId = `notif_${Date.now()}`;

    // Would also emit WebSocket event for real-time delivery
    // await websocketGateway.sendToUser(userId, 'notification', notification)

    await job.updateProgress(100);

    this.logger.log(`In-app notification created: ${notificationId}`);

    return { notificationId };
  }

  // ============================================================================
  // SMS NOTIFICATIONS
  // ============================================================================

  private async processSms(
    job: Job<SmsNotificationJobData>,
  ): Promise<{ messageId: string }> {
    const { phoneNumber, message } = job.data;

    await job.updateProgress(10);

    this.logger.debug(`Sending SMS to: ${phoneNumber}`);

    // Placeholder - would integrate with Twilio, MessageBird, etc.
    // const twilio = require('twilio')(accountSid, authToken)
    // const result = await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // })

    await this.sleep(300);
    await job.updateProgress(100);

    const messageId = `sms_${Date.now()}`;

    this.logger.log(`SMS sent to: ${phoneNumber}`);

    return { messageId };
  }

  // ============================================================================
  // WEBHOOK NOTIFICATIONS
  // ============================================================================

  private async processWebhook(
    job: Job<WebhookNotificationJobData>,
  ): Promise<{ statusCode: number }> {
    const { url, method, headers, body } = job.data;

    await job.updateProgress(10);

    this.logger.debug(`Sending webhook to: ${url}`);

    // Placeholder - would use fetch or axios
    // const response = await fetch(url, {
    //   method,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     ...headers,
    //   },
    //   body: JSON.stringify(body),
    // })

    await this.sleep(500);
    await job.updateProgress(100);

    const statusCode = 200;

    this.logger.log(`Webhook sent to: ${url} (${statusCode})`);

    return { statusCode };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // WORKER EVENTS
  // ============================================================================

  @OnWorkerEvent('completed')
  onCompleted(job: Job<NotificationJobData>): void {
    this.logger.debug(`Notification job completed: ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<NotificationJobData>, error: Error): void {
    this.logger.error(`Notification job failed: ${job.id}`, error.message);
  }
}
