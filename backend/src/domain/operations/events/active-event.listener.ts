// ============================================================================
// Active Event Events - Event Listeners
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ActiveEventListener {
  private readonly logger = new Logger(ActiveEventListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('active-event.created')
  async handleActiveEventCreated(payload: {
    activeEventId: string;
    origin: string;
    opsAdminId?: string;
    convertedFromLeadId?: string | null;
    clientName?: string;
  }) {
    this.logger.log(`Active event created: ${payload.activeEventId}`);

    if (payload.origin !== 'DIGITAL_LEAD' || !payload.convertedFromLeadId) {
      return;
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id: payload.convertedFromLeadId },
      select: { plannerId: true },
    });

    if (lead?.plannerId) {
      await this.notificationService.createNotification({
        userId: lead.plannerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Quote converted to event',
        message:
          'Your quote request has been converted into an active event. Our ops team is working on it.',
        data: {
          activeEventId: payload.activeEventId,
          leadId: payload.convertedFromLeadId,
        },
        actionUrl: `/events`,
      });
    }

    if (payload.opsAdminId) {
      await this.notificationService.createNotification({
        userId: payload.opsAdminId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Lead converted to active event',
        message: `Active event created for ${payload.clientName ?? 'client'}.`,
        data: {
          activeEventId: payload.activeEventId,
          leadId: payload.convertedFromLeadId,
        },
        actionUrl: `/ops/active-events/${payload.activeEventId}`,
      });
    }
  }

  @OnEvent('active-event.manager-assigned')
  async handleManagerAssigned(payload: {
    activeEventId: string;
    opsManagerId: string;
    opsAdminId?: string;
  }) {
    this.logger.log(
      `Manager assigned to active event: ${payload.activeEventId}`,
    );

    await this.notificationService.createNotification({
      userId: payload.opsManagerId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New event assigned',
      message: 'You have been assigned to manage an active event.',
      data: { activeEventId: payload.activeEventId },
      actionUrl: `/ops/active-events/${payload.activeEventId}`,
    });

    if (payload.opsAdminId) {
      await this.notificationService.createNotification({
        userId: payload.opsAdminId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Manager assigned',
        message: 'An ops manager has been assigned to the active event.',
        data: {
          activeEventId: payload.activeEventId,
          opsManagerId: payload.opsManagerId,
        },
        actionUrl: `/ops/active-events/${payload.activeEventId}`,
      });
    }
  }

  @OnEvent('active-event.manager-reassigned')
  async handleManagerReassigned(payload: {
    activeEventId: string;
    previousOpsManagerId?: string | null;
    nextOpsManagerId: string;
    opsAdminId?: string;
  }) {
    this.logger.log(
      `Manager reassigned for active event: ${payload.activeEventId}`,
    );

    if (payload.previousOpsManagerId) {
      await this.notificationService.createNotification({
        userId: payload.previousOpsManagerId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Event reassigned',
        message: 'You have been unassigned from an active event.',
        data: { activeEventId: payload.activeEventId },
        actionUrl: `/ops/active-events/${payload.activeEventId}`,
      });
    }

    await this.notificationService.createNotification({
      userId: payload.nextOpsManagerId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New event assigned',
      message: 'You have been assigned to manage an active event.',
      data: { activeEventId: payload.activeEventId },
      actionUrl: `/ops/active-events/${payload.activeEventId}`,
    });

    if (payload.opsAdminId) {
      await this.notificationService.createNotification({
        userId: payload.opsAdminId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Manager reassigned',
        message: 'An ops manager was reassigned for the active event.',
        data: {
          activeEventId: payload.activeEventId,
          previousOpsManagerId: payload.previousOpsManagerId,
          nextOpsManagerId: payload.nextOpsManagerId,
        },
        actionUrl: `/ops/active-events/${payload.activeEventId}`,
      });
    }
  }

  @OnEvent('active-event.status-changed')
  async handleStatusChanged(payload: {
    activeEventId: string;
    status: string;
  }) {
    this.logger.log(`Active event status changed: ${payload.activeEventId}`);

    const activeEvent = await this.prisma.activeEvent.findUnique({
      where: { id: payload.activeEventId },
      select: { opsAdminId: true, opsManagerId: true, clientName: true },
    });

    const recipients = [
      activeEvent?.opsAdminId,
      activeEvent?.opsManagerId,
    ].filter((id): id is string => Boolean(id));

    await Promise.all(
      Array.from(new Set(recipients)).map((userId) =>
        this.notificationService.createNotification({
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Event status updated',
          message: `${activeEvent?.clientName ?? 'An event'} is now ${payload.status}.`,
          data: {
            activeEventId: payload.activeEventId,
            status: payload.status,
          },
          actionUrl: `/ops/active-events/${payload.activeEventId}`,
        }),
      ),
    );
  }
}
