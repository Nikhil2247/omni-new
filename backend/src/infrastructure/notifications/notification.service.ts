// ============================================================================
// NOTIFICATION SERVICE - In-app Notification Management
// ============================================================================
// Handles persistence, retrieval, and real-time delivery events
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, NotificationChannel, NotificationType } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
  channel?: NotificationChannel;
  actionUrl?: string;
  imageUrl?: string;
  expiresAt?: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  dedupeKey?: string;
  dedupeWindowMs?: number;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  includeDismissed?: boolean;
  types?: NotificationType[];
}

export interface NotificationListResult {
  items: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Prisma.JsonValue | null;
    actionUrl?: string | null;
    imageUrl?: string | null;
    isRead: boolean;
    createdAt: Date;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly recentFingerprints = new Map<string, number>();
  private readonly defaultDedupeWindowMs = 30_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createNotification(input: CreateNotificationInput) {
    const dedupeWindowMs = Math.max(
      1_000,
      input.dedupeWindowMs ?? this.defaultDedupeWindowMs,
    );
    const now = Date.now();
    const fingerprint = this.buildFingerprint(input);

    this.pruneRecentFingerprints(now, dedupeWindowMs);
    const lastSeenAt = this.recentFingerprints.get(fingerprint);
    if (lastSeenAt && now - lastSeenAt <= dedupeWindowMs) {
      const existing = await this.findRecentDuplicate(input, dedupeWindowMs);
      if (existing) {
        this.logger.warn(
          `Duplicate notification prevented (memory window) for user ${input.userId}`,
        );
        return existing;
      }
    }

    const existing = await this.findRecentDuplicate(input, dedupeWindowMs);
    if (existing) {
      this.recentFingerprints.set(fingerprint, now);
      this.logger.warn(
        `Duplicate notification prevented (db window) for user ${input.userId}`,
      );
      return existing;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
        channel: input.channel ?? NotificationChannel.IN_APP,
        actionUrl: input.actionUrl,
        imageUrl: input.imageUrl,
        expiresAt: input.expiresAt,
      },
    });

    this.recentFingerprints.set(fingerprint, now);

    this.eventEmitter.emit('notification.send', {
      userId: input.userId,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown> | undefined,
        createdAt: notification.createdAt,
        read: notification.isRead,
        actionUrl: notification.actionUrl ?? undefined,
        imageUrl: notification.imageUrl ?? undefined,
        priority: input.priority ?? 'normal',
      },
    });

    return notification;
  }

  private buildFingerprint(input: CreateNotificationInput): string {
    const data = this.stableStringify(input.data);
    return [
      input.dedupeKey || '',
      input.userId,
      input.type,
      input.channel ?? NotificationChannel.IN_APP,
      input.title,
      input.message,
      input.actionUrl ?? '',
      input.imageUrl ?? '',
      data,
    ].join('|');
  }

  private pruneRecentFingerprints(now: number, windowMs: number): void {
    const expiry = windowMs * 2;
    for (const [key, timestamp] of this.recentFingerprints.entries()) {
      if (now - timestamp > expiry) {
        this.recentFingerprints.delete(key);
      }
    }
  }

  private async findRecentDuplicate(
    input: CreateNotificationInput,
    dedupeWindowMs: number,
  ) {
    const since = new Date(Date.now() - dedupeWindowMs);
    const channel = input.channel ?? NotificationChannel.IN_APP;
    const candidate = await this.prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        channel,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl ?? null,
        imageUrl: input.imageUrl ?? null,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!candidate) {
      return null;
    }

    const candidateData = this.stableStringify(
      candidate.data as Prisma.JsonValue | undefined,
    );
    const inputData = this.stableStringify(input.data);
    return candidateData === inputData ? candidate : null;
  }

  private stableStringify(value: unknown): string {
    if (value === undefined) return '';
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => `${key}:${this.stableStringify(item)}`);
      return `{${entries.join(',')}}`;
    }
    return String(value);
  }

  async getNotifications(
    userId: string,
    params: NotificationListParams = {},
  ): Promise<NotificationListResult> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(params.unreadOnly ? { isRead: false } : {}),
      ...(params.includeDismissed ? {} : { isDismissed: false }),
      ...(params.types?.length ? { type: { in: params.types } } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          data: true,
          actionUrl: true,
          imageUrl: true,
          isRead: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
          isDismissed: false,
        },
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        unreadCount,
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isDismissed: false,
      },
    });
  }

  async markRead(userId: string, notificationIds: string[]): Promise<number> {
    if (!notificationIds.length) return 0;

    const { count } = await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return count;
  }

  async markAllRead(userId: string): Promise<number> {
    const { count } = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return count;
  }

  async dismiss(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isDismissed: true },
    });

    this.logger.debug(
      `Notification ${notificationId} dismissed by user ${userId}`,
    );
  }
}
