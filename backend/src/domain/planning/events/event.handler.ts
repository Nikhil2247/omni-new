// ============================================================================
// EVENT HANDLERS - Planning Domain
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';
import { EventIndexer } from '../../../infrastructure/search/indexers/event.indexer';

interface EventCreatedPayload {
  eventId: string;
  userId: string;
  eventName?: string;
  eventDate: Date;
}

interface EventUpdatedPayload {
  eventId: string;
  userId?: string;
  eventName?: string;
  changes: Record<string, any>;
}

interface EventDeletedPayload {
  eventId: string;
  userId?: string;
  eventName?: string;
}

interface ChecklistItemCreatedPayload {
  eventId: string;
  checklistId: string;
  itemId: string;
  title: string;
  dueDate?: Date;
}

interface ChecklistItemDuePayload {
  eventId: string;
  itemId: string;
  title: string;
  dueDate: Date;
  userId: string;
  eventName?: string;
}

interface TimelineItemUpcomingPayload {
  eventId: string;
  itemId: string;
  title: string;
  scheduledTime: string;
  userId: string;
  eventName?: string;
}

@Injectable()
export class EventEventHandler {
  private readonly logger = new Logger(EventEventHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
    private readonly eventIndexer: EventIndexer,
  ) {}

  @OnEvent('event.created')
  async handleEventCreated(payload: EventCreatedPayload) {
    this.logger.log(`Event created: ${payload.eventId}`);

    // Index event in search
    await this.eventIndexer.indexEvent(payload.eventId);

    // TODO: Create default checklist for the event
    // TODO: Create default budget for the event
    const eventName = payload.eventName ?? 'your event';
    await this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.EVENT_REMINDER,
      title: 'Event created',
      message: `Your event "${eventName}" has been created.`,
      data: {
        eventId: payload.eventId,
        eventDate: payload.eventDate,
      },
      actionUrl: `/events/${payload.eventId}`,
    });
  }

  @OnEvent('event.updated')
  async handleEventUpdated(payload: EventUpdatedPayload) {
    this.logger.log(`Event updated: ${payload.eventId}`);

    // Invalidate cache for event details
    await this.cache.delete(`event:${payload.eventId}`);

    // Update search index
    await this.eventIndexer.indexEvent(payload.eventId);

    const eventRecord = payload.userId
      ? { userId: payload.userId, name: payload.eventName }
      : await this.prisma.event.findUnique({
          where: { id: payload.eventId },
          select: { userId: true, name: true },
        });

    if (eventRecord?.userId) {
      const significantChange = Boolean(
        payload.changes?.eventDate ||
        payload.changes?.venue ||
        payload.changes?.venueName,
      );

      if (significantChange) {
        await this.notificationService.createNotification({
          userId: eventRecord.userId,
          type: NotificationType.EVENT_REMINDER,
          title: 'Event updated',
          message: `Your event "${eventRecord.name ?? 'event'}" has updated details.`,
          data: {
            eventId: payload.eventId,
            changes: payload.changes,
          },
          actionUrl: `/events/${payload.eventId}`,
        });
      }
    }
  }

  @OnEvent('event.deleted')
  async handleEventDeleted(payload: EventDeletedPayload) {
    this.logger.log(`Event deleted: ${payload.eventId}`);

    // Remove from cache
    await this.cache.delete(`event:${payload.eventId}`);

    // Remove from search index
    await this.eventIndexer.removeFromIndex(payload.eventId);

    // TODO: Cleanup related data (checklists, budgets, guests)
    if (payload.userId) {
      await this.notificationService.createNotification({
        userId: payload.userId,
        type: NotificationType.EVENT_REMINDER,
        title: 'Event deleted',
        message: `Your event "${payload.eventName ?? 'event'}" was deleted.`,
        data: { eventId: payload.eventId },
        actionUrl: '/events',
      });
    }
  }

  // ============================================================================
  // CHECKLIST NOTIFICATIONS
  // ============================================================================

  @OnEvent('checklist.item.due-soon')
  async handleChecklistItemDueSoon(payload: ChecklistItemDuePayload) {
    this.logger.log(`Checklist item due soon: ${payload.itemId}`);

    await this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.EVENT_REMINDER,
      title: 'Task due soon',
      message: `"${payload.title}" is due tomorrow for ${payload.eventName ?? 'your event'}.`,
      data: {
        eventId: payload.eventId,
        itemId: payload.itemId,
        dueDate: payload.dueDate,
      },
      actionUrl: `/events/${payload.eventId}/checklist`,
    });
  }

  @OnEvent('checklist.item.overdue')
  async handleChecklistItemOverdue(payload: ChecklistItemDuePayload) {
    this.logger.log(`Checklist item overdue: ${payload.itemId}`);

    await this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.EVENT_REMINDER,
      title: 'Task overdue',
      message: `"${payload.title}" is overdue for ${payload.eventName ?? 'your event'}. Complete it now!`,
      data: {
        eventId: payload.eventId,
        itemId: payload.itemId,
        dueDate: payload.dueDate,
      },
      actionUrl: `/events/${payload.eventId}/checklist`,
    });
  }

  // ============================================================================
  // TIMELINE NOTIFICATIONS
  // ============================================================================

  @OnEvent('timeline.item.upcoming')
  async handleTimelineItemUpcoming(payload: TimelineItemUpcomingPayload) {
    this.logger.log(`Timeline item upcoming: ${payload.itemId}`);

    await this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.EVENT_REMINDER,
      title: 'Upcoming event activity',
      message: `"${payload.title}" is scheduled for ${payload.scheduledTime} in ${payload.eventName ?? 'your event'}.`,
      data: {
        eventId: payload.eventId,
        itemId: payload.itemId,
        scheduledTime: payload.scheduledTime,
      },
      actionUrl: `/events/${payload.eventId}/timeline`,
    });
  }

  @OnEvent('timeline.event-day')
  async handleTimelineEventDay(payload: { eventId: string; userId: string; eventName: string }) {
    this.logger.log(`Event day notification: ${payload.eventId}`);

    await this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.EVENT_REMINDER,
      title: "It's event day!",
      message: `Today is the day for "${payload.eventName}"! Check your timeline for the schedule.`,
      data: { eventId: payload.eventId },
      actionUrl: `/events/${payload.eventId}/timeline`,
    });
  }
}
