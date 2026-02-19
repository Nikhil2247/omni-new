// ============================================================================
// EVENT VENDOR SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventVendor, EventVendorStatus, Prisma } from '@prisma/client';
import { EventVendorRepository } from '../repositories/event-vendor.repository';
import {
  AddEventVendorDto,
  UpdateEventVendorDto,
} from '../dto/event-vendor.dto';

@Injectable()
export class EventVendorService {
  private readonly logger = new Logger(EventVendorService.name);

  constructor(
    private readonly eventVendorRepository: EventVendorRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async add(dto: AddEventVendorDto): Promise<EventVendor> {
    this.logger.log(
      `Adding vendor ${dto.vendorProfileId} to event ${dto.eventId}`,
    );

    const eventVendor = await this.eventVendorRepository.create({
      event: { connect: { id: dto.eventId } },
      vendorProfileId: dto.vendorProfileId,
      contractAmount:
        dto.contractAmount !== undefined
          ? new Prisma.Decimal(dto.contractAmount)
          : undefined,
      depositPaid:
        dto.depositPaid !== undefined
          ? new Prisma.Decimal(dto.depositPaid)
          : undefined,
      notes: dto.notes,
      status: dto.status ?? 'SHORTLISTED',
    });

    this.eventEmitter.emit('event-vendor.added', {
      eventVendorId: eventVendor.id,
      eventId: dto.eventId,
      vendorProfileId: dto.vendorProfileId,
    });

    return eventVendor;
  }

  async findById(id: string): Promise<EventVendor> {
    const eventVendor = await this.eventVendorRepository.findById(id);

    if (!eventVendor) {
      throw new NotFoundException('Event vendor not found');
    }
    return eventVendor;
  }

  async findByEvent(eventId: string): Promise<EventVendor[]> {
    return this.eventVendorRepository.findByEvent(eventId);
  }

  async findByStatus(
    eventId: string,
    status: EventVendorStatus,
  ): Promise<EventVendor[]> {
    return this.eventVendorRepository.findByStatus(eventId, status);
  }

  async update(id: string, dto: UpdateEventVendorDto): Promise<EventVendor> {
    await this.findById(id);

    const updated = await this.eventVendorRepository.update(id, {
      contractAmount:
        dto.contractAmount !== undefined
          ? new Prisma.Decimal(dto.contractAmount)
          : undefined,
      depositPaid:
        dto.depositPaid !== undefined
          ? new Prisma.Decimal(dto.depositPaid)
          : undefined,
      notes: dto.notes,
      status: dto.status as EventVendorStatus | undefined,
    });

    this.eventEmitter.emit('event-vendor.updated', {
      eventVendorId: id,
      changes: dto,
    });
    return updated;
  }

  async updateStatus(
    id: string,
    status: EventVendorStatus,
  ): Promise<EventVendor> {
    const eventVendor = await this.findById(id);

    const updated = await this.eventVendorRepository.update(id, { status });

    this.eventEmitter.emit('event-vendor.status-changed', {
      eventVendorId: id,
      previousStatus: eventVendor.status,
      newStatus: status,
    });

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.eventVendorRepository.delete(id);
    this.eventEmitter.emit('event-vendor.removed', { eventVendorId: id });
  }

  async getTotalCost(eventId: string): Promise<number> {
    return this.eventVendorRepository.getTotalCost(eventId);
  }
}
