// ============================================================================
// LEAD CONVERSION SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { EventOrigin } from '@prisma/client';
import { ActiveEventService } from './active-event.service';
import { LeadService } from 'src/domain/leads';
import { EventService } from 'src/domain/planning';
import { EventTypeLookupService } from 'src/core/lookup/event-type-lookup.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { ConvertLeadToEventDto, ConvertLeadByVendorDto } from '../dto';

@Injectable()
export class LeadConversionService {
  private readonly logger = new Logger(LeadConversionService.name);

  constructor(
    private readonly activeEventService: ActiveEventService,
    private readonly leadService: LeadService,
    private readonly eventService: EventService,
    private readonly eventTypeLookupService: EventTypeLookupService,
    private readonly prisma: PrismaService,
  ) {}

  async convertLead(dto: ConvertLeadToEventDto) {
    this.logger.log(`Converting lead ${dto.leadId} to active event`);

    const lead = await this.leadService.findById(dto.leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status === 'WON') {
      throw new ConflictException('Lead already converted');
    }

    // Get planner details for client info (findById includes planner relation)
    const plannerName = lead.planner
      ? `${lead.planner.firstName || ''} ${lead.planner.lastName || ''}`.trim() ||
        'Lead Client'
      : 'Lead Client';

    const activeEvent = await this.activeEventService.create(
      {
        origin: EventOrigin.DIGITAL_LEAD,
        convertedFromLeadId: lead.id,
        referenceImageId: dto.referenceImageId,
        clientName: plannerName,
        clientPhone: lead.planner?.phone || undefined,
        clientEmail: lead.planner?.email || undefined,
        eventDate: lead.eventDate ? lead.eventDate.toISOString() : undefined,
        eventType: lead.eventType ?? 'Event',
        venueName: dto.venueName,
        venueAddressId: dto.venueAddressId,
        totalBudget:
          dto.totalBudget ?? (lead.budget ? Number(lead.budget) : undefined),
        opsManagerId: dto.opsManagerId,
      },
      dto.opsAdminId,
    );

    if (!lead.eventId && lead.plannerId) {
      const eventTypeId = await this.resolveEventTypeId(lead.eventType);
      const eventDate =
        lead.eventDate?.toISOString() ?? new Date().toISOString();
      const createdEvent = await this.eventService.create(
        {
          name: lead.eventType ? `${lead.eventType} Event` : 'New Event',
          eventTypeId,
          eventDate,
          description: lead.initialMessage || undefined,
          venue: dto.venueName || undefined,
          expectedGuests: lead.guestCount ?? undefined,
          addressId: dto.venueAddressId || undefined,
        },
        lead.plannerId,
      );

      await this.leadService.linkEvent(lead.id, createdEvent.id);
    }

    await this.leadService.update(lead.id, { status: 'WON' as any });

    return activeEvent;
  }

  async convertLeadByVendor(
    dto: ConvertLeadByVendorDto & { leadId: string },
    vendorUserId: string,
  ) {
    this.logger.log(`Vendor ${vendorUserId} accepted lead ${dto.leadId}`);

    const lead = await this.leadService.findById(dto.leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId: vendorUserId },
      select: { id: true },
    });

    if (!vendorProfile || vendorProfile.id !== lead.vendorProfileId) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    if (lead.status === 'WON') {
      throw new ConflictException('Lead already converted');
    }

    const plannerName = lead.planner
      ? `${lead.planner.firstName || ''} ${lead.planner.lastName || ''}`.trim() ||
        'Lead Client'
      : 'Lead Client';

    const activeEvent = await this.activeEventService.create(
      {
        origin: EventOrigin.DIGITAL_LEAD,
        convertedFromLeadId: lead.id,
        clientName: plannerName,
        clientPhone: lead.planner?.phone || undefined,
        clientEmail: lead.planner?.email || undefined,
        eventDate: lead.eventDate ? lead.eventDate.toISOString() : undefined,
        eventType: lead.eventType ?? 'Event',
        venueName: dto.venueName,
        venueAddressId: dto.venueAddressId,
        totalBudget:
          dto.totalBudget ?? (lead.budget ? Number(lead.budget) : undefined),
      },
      null,
    );

    if (!lead.eventId && lead.plannerId) {
      const eventTypeId = await this.resolveEventTypeId(lead.eventType);
      const eventDate =
        lead.eventDate?.toISOString() ?? new Date().toISOString();
      const createdEvent = await this.eventService.create(
        {
          name: lead.eventType ? `${lead.eventType} Event` : 'New Event',
          eventTypeId,
          eventDate,
          description: lead.initialMessage || undefined,
          venue: dto.venueName || undefined,
          expectedGuests: lead.guestCount ?? undefined,
          addressId: dto.venueAddressId || undefined,
        },
        lead.plannerId,
      );

      await this.leadService.linkEvent(lead.id, createdEvent.id);
    }

    await this.leadService.update(lead.id, { status: 'WON' as any });

    return activeEvent;
  }

  private async resolveEventTypeId(eventType?: string | null): Promise<string> {
    let eventTypes = this.eventTypeLookupService.getAllEventTypes();

    if (!eventTypes.length) {
      await this.eventTypeLookupService.refresh();
      eventTypes = this.eventTypeLookupService.getAllEventTypes();
    }

    if (!eventTypes.length) {
      return this.getOrCreateEventTypeId(eventType);
    }

    if (!eventType) return eventTypes[0].id;

    const normalized = eventType.trim().toLowerCase();
    const slugified = normalized
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const byName = eventTypes.find(
      (type) => type.name.toLowerCase() === normalized,
    );
    if (byName) return byName.id;

    const bySlug = eventTypes.find(
      (type) => type.slug.toLowerCase() === slugified,
    );
    return bySlug?.id ?? eventTypes[0].id;
  }

  private async getOrCreateEventTypeId(
    eventType?: string | null,
  ): Promise<string> {
    const fallbackName = (eventType || 'General').trim() || 'General';
    const normalized = fallbackName.toLowerCase();
    const slugified =
      normalized.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      'general';

    const existing = await this.prisma.eventType.findFirst({
      where: {
        OR: [{ name: fallbackName }, { slug: slugified }],
      },
      select: { id: true },
    });

    if (existing?.id) return existing.id;

    const created = await this.prisma.eventType.create({
      data: {
        name: fallbackName,
        slug: slugified,
        isActive: true,
        sortOrder: 999,
      },
      select: { id: true },
    });

    return created.id;
  }
}
