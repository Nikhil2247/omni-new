// ============================================================================
// GUEST SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Guest, RSVPStatus } from '@prisma/client';
import { GuestRepository } from '../repositories/guest.repository';
import {
  CreateGuestDto,
  UpdateGuestDto,
  UpdateRSVPDto,
} from '../dto/guest.dto';

@Injectable()
export class GuestService {
  private readonly logger = new Logger(GuestService.name);

  constructor(
    private readonly guestRepository: GuestRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(guestlistId: string, dto: CreateGuestDto): Promise<Guest> {
    this.logger.log(`Creating guest for guestlist: ${guestlistId}`);

    const guest = await this.guestRepository.create({
      guestlist: { connect: { id: guestlistId } },
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      dietaryReq: dto.dietaryReq,
      plusOne: dto.plusOne ?? 0,
      rsvpStatus: 'PENDING',
    });

    this.eventEmitter.emit('guest.created', { guestId: guest.id, guestlistId });
    return guest;
  }

  async findById(id: string): Promise<Guest> {
    const guest = await this.guestRepository.findById(id);
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }
    return guest;
  }

  async findByGuestlist(guestlistId: string): Promise<Guest[]> {
    return this.guestRepository.findByGuestlist(guestlistId);
  }

  async findByRSVPStatus(
    guestlistId: string,
    status: RSVPStatus,
  ): Promise<Guest[]> {
    return this.guestRepository.findByRSVPStatus(guestlistId, status);
  }

  async update(id: string, dto: UpdateGuestDto): Promise<Guest> {
    await this.findById(id);
    return this.guestRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      rsvpStatus: dto.rsvpStatus as any,
      plusOne: dto.plusOne,
      tableNumber: dto.tableNumber,
      dietaryReq: dto.dietaryReq,
      notes: dto.notes,
    });
  }

  async updateRSVP(id: string, dto: UpdateRSVPDto): Promise<Guest> {
    const guest = await this.findById(id);

    const updated = await this.guestRepository.update(id, {
      rsvpStatus: dto.rsvpStatus as any,
      plusOne: dto.plusOne,
    });

    this.eventEmitter.emit('guest.rsvp-updated', {
      guestId: id,
      previousStatus: guest.rsvpStatus,
      newStatus: dto.rsvpStatus,
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.guestRepository.delete(id);
    this.eventEmitter.emit('guest.deleted', { guestId: id });
  }

  async getRSVPStats(guestlistId: string) {
    return this.guestRepository.getRSVPStats(guestlistId);
  }

  async searchGuests(
    guestlistId: string,
    searchTerm: string,
  ): Promise<Guest[]> {
    return this.guestRepository.searchGuests(guestlistId, searchTerm);
  }
}
