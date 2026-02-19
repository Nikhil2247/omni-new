// ============================================================================
// Operational Task Events - Event Listeners
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../../../infrastructure/notifications/notification.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class OperationalTaskListener {
  private readonly logger = new Logger(OperationalTaskListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('operational-task.created')
  async handleTaskCreated(payload: { taskId: string; activeEventId: string }) {
    this.logger.log(`Operational task created: ${payload.taskId}`);

    const task = await this.prisma.operationalTask.findUnique({
      where: { id: payload.taskId },
      select: { assignedToUserId: true, title: true, activeEventId: true },
    });

    if (task?.assignedToUserId) {
      await this.notificationService.createNotification({
        userId: task.assignedToUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New operational task assigned',
        message: task.title,
        data: { taskId: payload.taskId, activeEventId: task.activeEventId },
        actionUrl: `/ops/operational-tasks`,
      });
    }
  }

  @OnEvent('operational-task.assigned')
  async handleTaskAssigned(payload: {
    taskId: string;
    activeEventId: string;
    assignedToUserId: string;
    assignedBy?: string;
  }) {
    this.logger.log(`Operational task assigned: ${payload.taskId}`);

    const activeEvent = await this.prisma.activeEvent.findUnique({
      where: { id: payload.activeEventId },
      select: { opsManagerId: true, opsAdminId: true },
    });

    const recipients = [
      payload.assignedToUserId,
      activeEvent?.opsManagerId,
      activeEvent?.opsAdminId,
    ].filter((id): id is string => Boolean(id));

    await Promise.all(
      Array.from(new Set(recipients)).map((userId) =>
        this.notificationService.createNotification({
          userId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task assignment updated',
          message: 'An operational task assignment has been updated.',
          data: {
            taskId: payload.taskId,
            activeEventId: payload.activeEventId,
          },
          actionUrl: `/ops/operational-tasks`,
        }),
      ),
    );
  }

  @OnEvent('operational-task.status-changed')
  async handleTaskStatusChanged(payload: { taskId: string; status: string }) {
    this.logger.log(`Operational task status changed: ${payload.taskId}`);

    const task = await this.prisma.operationalTask.findUnique({
      where: { id: payload.taskId },
      select: {
        assignedToUserId: true,
        activeEventId: true,
        title: true,
      },
    });

    if (!task?.activeEventId) return;

    const activeEvent = await this.prisma.activeEvent.findUnique({
      where: { id: task.activeEventId },
      select: { opsManagerId: true, opsAdminId: true },
    });

    const recipients = [
      task.assignedToUserId,
      activeEvent?.opsManagerId,
      activeEvent?.opsAdminId,
    ].filter((id): id is string => Boolean(id));

    await Promise.all(
      Array.from(new Set(recipients)).map((userId) =>
        this.notificationService.createNotification({
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Task status updated',
          message: `${task.title} is now ${payload.status}.`,
          data: { taskId: payload.taskId, status: payload.status },
          actionUrl: `/ops/operational-tasks`,
        }),
      ),
    );
  }
}
