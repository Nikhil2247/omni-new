// ============================================================================
// ACTIVE EVENT SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActiveEvent } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ActiveEventRepository } from '../repositories';
import {
  CreateActiveEventDto,
  SearchActiveEventsDto,
  UpdateActiveEventDto,
} from '../dto';
import { Decimal } from '@prisma/client/runtime/client';
import { PaginatedResult } from 'src/core/database/repositories/base.repository';

@Injectable()
export class ActiveEventService {
  private readonly logger = new Logger(ActiveEventService.name);

  constructor(
    private readonly activeEventRepository: ActiveEventRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create active event - supports dual-origin workflow
   * - DIGITAL_LEAD: Converted from Lead (user clicked "Get Quote")
   * - DIRECT_BOOKING: Manual entry (walk-in, phone, VIP)
   */
  async create(
    dto: CreateActiveEventDto,
    opsAdminId: string | null,
  ): Promise<ActiveEvent> {
    const actorLabel = opsAdminId
      ? `ops admin: ${opsAdminId}`
      : 'vendor acceptance';
    this.logger.log(`Creating active event (${dto.origin}) by ${actorLabel}`);

    // Validate lead conversion
    if (dto.origin === 'DIGITAL_LEAD' && dto.convertedFromLeadId) {
      const existing = await this.activeEventRepository.findByLeadId(
        dto.convertedFromLeadId,
      );
      if (existing) {
        throw new ConflictException(
          'This lead has already been converted to an active event',
        );
      }
    }

    const activeEvent = await this.activeEventRepository.create({
      origin: dto.origin,
      convertedFromLeadId: dto.convertedFromLeadId,
      referenceImageId: dto.referenceImageId,
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      clientEmail: dto.clientEmail,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      eventEndDate: dto.eventEndDate ? new Date(dto.eventEndDate) : undefined,
      eventType: dto.eventType,
      venueName: dto.venueName,
      venueAddressId: dto.venueAddressId,
      totalBudget: dto.totalBudget ? new Decimal(dto.totalBudget) : undefined,
      opsAdminId: opsAdminId ?? undefined,
      opsManagerId: dto.opsManagerId,
      status: 'NEW',
      totalSpend: new Decimal(0),
    });

    this.eventEmitter.emit('active-event.created', {
      activeEventId: activeEvent.id,
      origin: activeEvent.origin,
      opsAdminId: opsAdminId ?? undefined,
      convertedFromLeadId: activeEvent.convertedFromLeadId,
      clientName: activeEvent.clientName,
    });

    return activeEvent;
  }

  async findById(id: string): Promise<ActiveEvent> {
    const activeEvent = await this.activeEventRepository.findById(id, {
      requirementSheet: {
        include: {
          items: true,
        },
      },
      vendorAgreements: true,
      operationalTasks: true,
      eventNotes: true,
    });

    if (!activeEvent) {
      throw new NotFoundException('Active event not found');
    }

    return activeEvent;
  }

  async search(
    dto: SearchActiveEventsDto,
  ): Promise<PaginatedResult<ActiveEvent>> {
    return this.activeEventRepository.search(dto);
  }

  async update(id: string, dto: UpdateActiveEventDto): Promise<ActiveEvent> {
    const existing = await this.findById(id);

    const updated = await this.activeEventRepository.update(id, {
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      clientEmail: dto.clientEmail,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      eventEndDate: dto.eventEndDate ? new Date(dto.eventEndDate) : undefined,
      eventType: dto.eventType,
      venueName: dto.venueName,
      venueAddressId: dto.venueAddressId,
      totalBudget: dto.totalBudget ? new Decimal(dto.totalBudget) : undefined,
      status: dto.status,
      opsManagerId: dto.opsManagerId,
    });

    this.eventEmitter.emit('active-event.updated', {
      activeEventId: id,
      changes: dto,
    });

    if (dto.opsManagerId && dto.opsManagerId !== existing.opsManagerId) {
      this.eventEmitter.emit('active-event.manager-reassigned', {
        activeEventId: id,
        previousOpsManagerId: existing.opsManagerId,
        nextOpsManagerId: dto.opsManagerId,
        opsAdminId: existing.opsAdminId ?? undefined,
      });
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.activeEventRepository.delete(id);
    this.eventEmitter.emit('active-event.deleted', { activeEventId: id });
  }

  async assignManager(id: string, opsManagerId: string): Promise<ActiveEvent> {
    const activeEvent = await this.findById(id);

    if (activeEvent.status !== 'NEW') {
      throw new ConflictException('Can only assign manager to NEW events');
    }

    const updated = await this.activeEventRepository.update(id, {
      opsManagerId,
      status: 'ASSIGNED',
    });

    this.eventEmitter.emit('active-event.manager-assigned', {
      activeEventId: id,
      opsManagerId,
      opsAdminId: activeEvent.opsAdminId ?? undefined,
    });

    return updated;
  }

  async updateStatus(id: string, status: string): Promise<ActiveEvent> {
    await this.findById(id);

    const updated = await this.activeEventRepository.update(id, {
      status: status as any,
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
    });

    this.eventEmitter.emit('active-event.status-changed', {
      activeEventId: id,
      status,
    });

    return updated;
  }

  async getUpcoming(limit: number = 10): Promise<ActiveEvent[]> {
    return this.activeEventRepository.findUpcoming(limit);
  }

  async findByOpsManager(opsManagerId: string): Promise<ActiveEvent[]> {
    return this.activeEventRepository.findByOpsManager(opsManagerId);
  }
}
