// ============================================================================
// EVENT HANDLERS - Planning Domain
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { NotificationService } from '../../../infrastructure/notifications/notification.service'
import { NotificationType } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma.service'
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service'
import { EventIndexer } from '../../../infrastructure/search/indexers/event.indexer'

interface EventCreatedPayload {
  eventId: string
  userId: string
  eventName?: string
  eventDate: Date
}

interface EventUpdatedPayload {
  eventId: string
  userId?: string
  eventName?: string
  changes: Record<string, any>
}

interface EventDeletedPayload {
  eventId: string
  userId?: string
  eventName?: string
}

@Injectable()
export class EventEventHandler {
  private readonly logger = new Logger(EventEventHandler.name)

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
    private readonly eventIndexer: EventIndexer,
  ) {}

  @OnEvent('event.created')
  async handleEventCreated(payload: EventCreatedPayload) {
    this.logger.log(`Event created: ${payload.eventId}`)
    
    // Index event in search
    await this.eventIndexer.indexEvent(payload.eventId)
    
    // TODO: Create default checklist for the event
    // TODO: Create default budget for the event
    const eventName = payload.eventName ?? 'your event'
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
    })
  }

  @OnEvent('event.updated')
  async handleEventUpdated(payload: EventUpdatedPayload) {
    this.logger.log(`Event updated: ${payload.eventId}`)
    
    // Invalidate cache for event details
    await this.cache.delete(`event:${payload.eventId}`)
    
    // Update search index
    await this.eventIndexer.indexEvent(payload.eventId)
    
    const eventRecord = payload.userId
      ? { userId: payload.userId, name: payload.eventName }
      : await this.prisma.event.findUnique({
          where: { id: payload.eventId },
          select: { userId: true, name: true },
        })

    if (eventRecord?.userId) {
      const significantChange = Boolean(
        payload.changes?.eventDate || payload.changes?.venue || payload.changes?.venueName,
      )

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
        })
      }
    }
  }

  @OnEvent('event.deleted')
  async handleEventDeleted(payload: EventDeletedPayload) {
    this.logger.log(`Event deleted: ${payload.eventId}`)
    
    // Remove from cache
    await this.cache.delete(`event:${payload.eventId}`)
    
    // Remove from search index
    await this.eventIndexer.removeFromIndex(payload.eventId)
    
    // TODO: Cleanup related data (checklists, budgets, guests)
    if (payload.userId) {
      await this.notificationService.createNotification({
        userId: payload.userId,
        type: NotificationType.EVENT_REMINDER,
        title: 'Event deleted',
        message: `Your event "${payload.eventName ?? 'event'}" was deleted.`,
        data: { eventId: payload.eventId },
        actionUrl: '/events',
      })
    }
  }
}
