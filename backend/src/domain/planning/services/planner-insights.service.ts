import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

export type RiskLevel = 'high' | 'medium' | 'low';

export interface PlannerRisk {
  id: string;
  title: string;
  detail: string;
  level: RiskLevel;
}

export interface PlannerInsightsResponse {
  eventId: string;
  healthScore: number;
  healthLabel: 'Excellent' | 'Strong' | 'At Risk' | 'Critical';
  topActions: string[];
  risks: PlannerRisk[];
  metrics: {
    checklistCompletion: number;
    budgetCompletion: number;
    budgetUsage: number;
    timelineItemsCount: number;
    rsvpRate: number;
    overdueTasks: number;
  };
}

@Injectable()
export class PlannerInsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEventInsights(eventId: string, userId: string): Promise<PlannerInsightsResponse> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const [checklist, budget, guestlist, timeline] = await Promise.all([
      this.prisma.checklist.findFirst({
        where: { eventId },
        select: {
          items: {
            select: {
              id: true,
              dueDate: true,
              isCompleted: true,
            },
          },
        },
      }),
      this.prisma.budget.findUnique({
        where: { eventId },
        select: {
          totalBudget: true,
          items: {
            select: {
              isPaid: true,
              actualCost: true,
            },
          },
        },
      }),
      this.prisma.guestlist.findUnique({
        where: { eventId },
        select: {
          guests: {
            select: {
              rsvpStatus: true,
            },
          },
        },
      }),
      this.prisma.timeline.findFirst({
        where: { eventId },
        select: {
          items: true,
        },
      }),
    ]);

    const checklistItems = checklist?.items || [];
    const completedTasks = checklistItems.filter((item) => item.isCompleted).length;
    const checklistCompletion = checklistItems.length > 0
      ? Math.round((completedTasks / checklistItems.length) * 100)
      : 0;
    const overdueTasks = checklistItems.filter((item) => {
      if (item.isCompleted || !item.dueDate) return false;
      return item.dueDate < new Date();
    }).length;

    const budgetItems = budget?.items || [];
    const paidItems = budgetItems.filter((item) => item.isPaid).length;
    const budgetCompletion = budgetItems.length > 0
      ? Math.round((paidItems / budgetItems.length) * 100)
      : 0;
    const totalBudget = Number(budget?.totalBudget || 0);
    const totalSpent = budgetItems.reduce((sum, item) => sum + Number(item.actualCost || 0), 0);
    const budgetUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const guests = guestlist?.guests || [];
    const respondedGuests = guests.filter(
      (guest) => guest.rsvpStatus === 'ATTENDING' || guest.rsvpStatus === 'NOT_ATTENDING',
    ).length;
    const rsvpRate = guests.length > 0 ? Math.round((respondedGuests / guests.length) * 100) : 0;

    let timelineItemsCount = 0;
    if (Array.isArray(timeline?.items)) {
      timelineItemsCount = timeline.items.length;
    }

    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          20 +
            checklistCompletion * 0.3 +
            budgetCompletion * 0.2 +
            (timelineItemsCount > 0 ? 15 : 0) +
            rsvpRate * 0.25 +
            (guests.length > 0 ? 10 : 0),
        ),
      ),
    );

    const topActions: string[] = [];
    if (timelineItemsCount === 0) {
      topActions.push('Add your first timeline block to anchor the event day flow.');
    }
    if (checklistItems.length === 0) {
      topActions.push('Create checklist tasks for this week and assign due dates.');
    }
    if (budgetItems.length === 0) {
      topActions.push('Add budget categories now to prevent blind spending.');
    }
    if (guests.length === 0) {
      topActions.push('Start your guestlist to unlock RSVP tracking and invite flow.');
    }
    if (guests.length > 0 && rsvpRate < 40) {
      topActions.push('Follow up pending RSVPs to reduce last-minute uncertainty.');
    }
    if (topActions.length === 0) {
      topActions.push('Review vendor confirmations and lock final payments for a smoother execution week.');
      topActions.push('Run a final timeline rehearsal with family or coordinator.');
      topActions.push('Send a final reminder to pending guests and vendors.');
    }

    const risks: PlannerRisk[] = [];
    if (overdueTasks > 0) {
      risks.push({
        id: 'overdue-tasks',
        title: `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`,
        detail: 'Overdue checklist items can break downstream event dependencies.',
        level: 'high',
      });
    }
    if (totalBudget > 0 && budgetUsage > 90) {
      risks.push({
        id: 'budget-risk',
        title: `Budget at ${budgetUsage}%`,
        detail: 'Spending is close to the limit. Revisit optional expense categories.',
        level: budgetUsage > 100 ? 'high' : 'medium',
      });
    }
    if (guests.length > 0 && rsvpRate < 50) {
      risks.push({
        id: 'rsvp-risk',
        title: `RSVP response at ${rsvpRate}%`,
        detail: 'Low responses impact seating, catering, and logistics confidence.',
        level: 'medium',
      });
    }
    if (timelineItemsCount === 0) {
      risks.push({
        id: 'timeline-risk',
        title: 'No timeline blocks added',
        detail: 'Without a run-of-show, event-day coordination gets risky.',
        level: 'medium',
      });
    }

    const healthLabel: PlannerInsightsResponse['healthLabel'] =
      healthScore >= 85
        ? 'Excellent'
        : healthScore >= 70
          ? 'Strong'
          : healthScore >= 45
            ? 'At Risk'
            : 'Critical';

    return {
      eventId,
      healthScore,
      healthLabel,
      topActions: topActions.slice(0, 3),
      risks: risks.slice(0, 3),
      metrics: {
        checklistCompletion,
        budgetCompletion,
        budgetUsage,
        timelineItemsCount,
        rsvpRate,
        overdueTasks,
      },
    };
  }
}
