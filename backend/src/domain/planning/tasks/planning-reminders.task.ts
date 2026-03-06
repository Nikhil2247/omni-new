// ============================================================================
// PLANNING REMINDERS TASK - Scheduled Notification Reminders
// ============================================================================
// Sends notifications for upcoming tasks, overdue items, and event days
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class PlanningRemindersTask {
  private readonly logger = new Logger(PlanningRemindersTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Check for tasks due tomorrow - runs every day at 8 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDueSoonTasks(): Promise<void> {
    this.logger.log('Checking for tasks due soon...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Find checklist items due tomorrow that aren't completed
      const dueSoonItems = await this.prisma.checklistItem.findMany({
        where: {
          dueDate: {
            gte: tomorrow,
            lt: dayAfter,
          },
          isCompleted: false,
        },
        include: {
          checklist: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${dueSoonItems.length} tasks due tomorrow`);

      // Emit events for each due item
      for (const item of dueSoonItems) {
        if (item.checklist?.event?.userId) {
          this.eventEmitter.emit('checklist.item.due-soon', {
            eventId: item.checklist.event.id,
            itemId: item.id,
            title: item.title,
            dueDate: item.dueDate,
            userId: item.checklist.event.userId,
            eventName: item.checklist.event.name,
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to check due soon tasks', error);
    }
  }

  /**
   * Check for overdue tasks - runs every day at 9 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverdueTasks(): Promise<void> {
    this.logger.log('Checking for overdue tasks...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find checklist items that are overdue and not completed
      // Only get items that became overdue today (to avoid spam)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const overdueItems = await this.prisma.checklistItem.findMany({
        where: {
          dueDate: {
            gte: yesterday,
            lt: today,
          },
          isCompleted: false,
        },
        include: {
          checklist: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Found ${overdueItems.length} newly overdue tasks`);

      // Emit events for each overdue item
      for (const item of overdueItems) {
        if (item.checklist?.event?.userId) {
          this.eventEmitter.emit('checklist.item.overdue', {
            eventId: item.checklist.event.id,
            itemId: item.id,
            title: item.title,
            dueDate: item.dueDate,
            userId: item.checklist.event.userId,
            eventName: item.checklist.event.name,
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to check overdue tasks', error);
    }
  }

  /**
   * Check for events happening today - runs every day at 6 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkEventDay(): Promise<void> {
    this.logger.log('Checking for events happening today...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find events happening today
      const todayEvents = await this.prisma.event.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ['PLANNING', 'CONFIRMED'],
          },
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });

      this.logger.log(`Found ${todayEvents.length} events happening today`);

      // Emit event day notification for each
      for (const event of todayEvents) {
        this.eventEmitter.emit('timeline.event-day', {
          eventId: event.id,
          userId: event.userId,
          eventName: event.name,
        });
      }
    } catch (error) {
      this.logger.error('Failed to check event day', error);
    }
  }

  /**
   * Check for events happening tomorrow - runs every day at 6 PM
   */
  @Cron('0 18 * * *') // 6 PM daily
  async checkEventTomorrow(): Promise<void> {
    this.logger.log('Checking for events happening tomorrow...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Find events happening tomorrow
      const tomorrowEvents = await this.prisma.event.findMany({
        where: {
          date: {
            gte: tomorrow,
            lt: dayAfter,
          },
          status: {
            in: ['PLANNING', 'CONFIRMED'],
          },
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });

      this.logger.log(`Found ${tomorrowEvents.length} events happening tomorrow`);

      // Send reminder for each event - get timeline separately
      for (const event of tomorrowEvents) {
        const timeline = await this.prisma.timeline.findFirst({
          where: { eventId: event.id },
        });

        if (timeline?.items) {
          // items is a JSON array
          const items = timeline.items as Array<{
            id?: string;
            time?: string;
            title?: string;
            scheduledTime?: string;
          }>;
          const firstItem = items[0];

          if (firstItem?.title) {
            this.eventEmitter.emit('timeline.item.upcoming', {
              eventId: event.id,
              itemId: firstItem.id || 'item-0',
              title: `Event starts: ${firstItem.title}`,
              scheduledTime: firstItem.scheduledTime || firstItem.time || '',
              userId: event.userId,
              eventName: event.name,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to check events tomorrow', error);
    }
  }
}
