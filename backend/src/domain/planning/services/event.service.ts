// ============================================================================
// EVENT SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Event, EventTier } from '@prisma/client';
import { EventRepository } from '../repositories/event.repository';
import { WeddingIdentityRepository } from '../repositories/wedding-identity.repository';
import {
  CreateEventDto,
  UpdateEventDto,
  SearchEventDto,
} from '../dto/event.dto';
import { PaginatedResult } from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { EventCreditService } from '../../subscription/services/event-credit.service';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly weddingIdentityRepository: WeddingIdentityRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
    private readonly eventCreditService: EventCreditService,
  ) {}

  async create(dto: CreateEventDto, userId: string): Promise<Event> {
    this.logger.log(`Creating event for user: ${userId}`);

    // Determine requested tier (default to BASIC)
    // UNLIMITED EVENT CREATION: Users can create unlimited events
    // The tier determines feature limits within the event
    const eventTier = dto.tier || EventTier.BASIC;

    // Create the event with tier
    const event = await this.eventRepository.create(
      {
        user: { connect: { id: userId } },
        name: dto.name,
        eventType: { connect: { id: dto.eventTypeId } },
        date: new Date(dto.eventDate),
        description: dto.description,
        venueName: dto.venue,
        guestCount: dto.expectedGuests,
        address: dto.addressId ? { connect: { id: dto.addressId } } : undefined,
        status: 'PLANNING',
        tier: eventTier,
      },
      {
        eventType: true,
        address: true,
      },
    );

    this.logger.log(`Event ${event.id} created with tier: ${eventTier}`);

    this.eventEmitter.emit('event.created', {
      eventId: event.id,
      userId: event.userId,
      eventName: event.name,
      eventDate: event.date,
      tier: eventTier,
    });

    return event;
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id, {
      eventType: true,
      address: true,
      checklists: true,
      budget: true,
      guestlist: true,
      timelines: true,
      vendors: true,
      eventMemory: true,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async findByUserId(userId: string): Promise<Event[]> {
    const sharedUserIds = await this.resolveSharedUserIds(userId);
    return this.eventRepository.findByUserIds(sharedUserIds, {
      eventType: true,
      address: true,
    });
  }

  async search(
    searchDto: SearchEventDto,
    userId: string,
  ): Promise<PaginatedResult<Event>> {
    const sharedUserIds = await this.resolveSharedUserIds(userId);
    const result = await this.eventRepository.search(searchDto, sharedUserIds);
    const enriched = await this.enrichEventsWithPlanningStats(result.data);

    return {
      ...result,
      data: enriched,
    };
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    await this.findById(id);

    const updated = await this.eventRepository.update(
      id,
      {
        name: dto.name,
        eventType: dto.eventTypeId
          ? { connect: { id: dto.eventTypeId } }
          : undefined,
        date: dto.eventDate ? new Date(dto.eventDate) : undefined,
        description: dto.description,
        venueName: dto.venue,
        guestCount: dto.expectedGuests,
        address: dto.addressId ? { connect: { id: dto.addressId } } : undefined,
        status: dto.status,
      },
      {
        eventType: true,
        address: true,
      },
    );

    this.eventEmitter.emit('event.updated', {
      eventId: id,
      userId: updated.userId,
      eventName: updated.name,
      changes: dto,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);

    await this.eventRepository.delete(id);
    this.logger.log(`Event ${id} deleted`);

    this.eventEmitter.emit('event.deleted', {
      eventId: id,
      userId: existing.userId,
      eventName: existing.name,
    });
  }

  async findUpcoming(limit: number = 10): Promise<Event[]> {
    return this.eventRepository.findUpcoming(limit);
  }

  private async resolveSharedUserIds(userId: string): Promise<string[]> {
    const identity = await this.weddingIdentityRepository.findByUserId(userId);
    if (!identity) return [userId];

    const partnerIds = (identity.partners || [])
      .filter(
        (partner) => partner.userId && partner.inviteStatus === 'ACCEPTED',
      )
      .map((partner) => partner.userId as string);

    if (partnerIds.length === 0) return [userId];

    return Array.from(new Set([userId, ...partnerIds]));
  }

  private async enrichEventsWithPlanningStats(events: Event[]) {
    if (!events.length) return events;

    const eventIds = events.map((event) => event.id);

    const [guestlists, checklists, budgets] = await Promise.all([
      this.prisma.guestlist.findMany({
        where: { eventId: { in: eventIds } },
        include: {
          guests: {
            select: {
              rsvpStatus: true,
            },
          },
        },
      }),
      this.prisma.checklist.findMany({
        where: { eventId: { in: eventIds } },
        include: {
          items: {
            select: {
              isCompleted: true,
            },
          },
        },
      }),
      this.prisma.budget.findMany({
        where: { eventId: { in: eventIds } },
        include: {
          items: {
            select: {
              actualCost: true,
            },
          },
        },
      }),
    ]);

    const guestStatsByEvent = new Map<
      string,
      { total: number; confirmed: number; declined: number }
    >();

    guestlists.forEach((guestlist) => {
      const total = guestlist.guests.length;
      const confirmed = guestlist.guests.filter(
        (guest) => guest.rsvpStatus === 'ATTENDING',
      ).length;
      const declined = guestlist.guests.filter(
        (guest) => guest.rsvpStatus === 'NOT_ATTENDING',
      ).length;

      guestStatsByEvent.set(guestlist.eventId, { total, confirmed, declined });
    });

    const checklistStatsByEvent = new Map<
      string,
      { totalItems: number; completedItems: number }
    >();

    checklists.forEach((checklist) => {
      const current = checklistStatsByEvent.get(checklist.eventId) || {
        totalItems: 0,
        completedItems: 0,
      };
      const totalItems = current.totalItems + checklist.items.length;
      const completedItems =
        current.completedItems +
        checklist.items.filter((item) => item.isCompleted).length;

      checklistStatsByEvent.set(checklist.eventId, {
        totalItems,
        completedItems,
      });
    });

    const budgetStatsByEvent = new Map<
      string,
      { totalBudget: number; totalSpent: number }
    >();

    budgets.forEach((budget) => {
      const totalBudget = Number(budget.totalBudget ?? 0);
      const totalSpent = budget.items.reduce(
        (sum, item) => sum + Number(item.actualCost ?? 0),
        0,
      );

      budgetStatsByEvent.set(budget.eventId, { totalBudget, totalSpent });
    });

    return events.map((event) => {
      const guestStats = guestStatsByEvent.get(event.id) || {
        total: 0,
        confirmed: 0,
        declined: 0,
      };
      const checklistStats = checklistStatsByEvent.get(event.id) || {
        totalItems: 0,
        completedItems: 0,
      };
      const budgetStats = budgetStatsByEvent.get(event.id) || {
        totalBudget: 0,
        totalSpent: 0,
      };

      const checklistProgress =
        checklistStats.totalItems > 0
          ? Math.round(
              (checklistStats.completedItems / checklistStats.totalItems) * 100,
            )
          : 0;

      return {
        ...event,
        eventDate: event.date,
        guestCount:
          guestStats.total > 0 ? guestStats.total : (event.guestCount ?? 0),
        confirmedGuests: guestStats.confirmed,
        declinedGuests: guestStats.declined,
        checklistProgress,
        totalBudget: budgetStats.totalBudget,
        totalSpent: budgetStats.totalSpent,
      };
    });
  }
}
