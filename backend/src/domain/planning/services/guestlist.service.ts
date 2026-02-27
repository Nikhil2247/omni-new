// ============================================================================
// GUESTLIST SERVICE - Planning Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Guestlist, Guest } from '@prisma/client';
import { GuestlistRepository } from '../repositories/guestlist.repository';
import {
  CreateGuestlistDto,
  CreateGuestDto,
  UpdateGuestDto,
  UpdateGuestlistDto,
  UpdateRSVPDto,
} from '../dto/guestlist.dto';

@Injectable()
export class GuestlistService {
  private readonly logger = new Logger(GuestlistService.name);

  constructor(
    private readonly guestlistRepository: GuestlistRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateGuestlistDto): Promise<Guestlist> {
    // Check if guestlist already exists for event
    const existing = await this.guestlistRepository.findByEventId(dto.eventId);
    if (existing) {
      throw new ConflictException('Guestlist already exists for this event');
    }

    const guestlist = await this.guestlistRepository.create(
      {
        event: { connect: { id: dto.eventId } },
      },
      {
        guests: true,
      },
    );

    this.eventEmitter.emit('guestlist.created', {
      guestlistId: guestlist.id,
      eventId: dto.eventId,
    });
    return guestlist;
  }

  async findByEventId(eventId: string): Promise<Guestlist> {
    const guestlist = await this.guestlistRepository.findByEventId(eventId);
    if (!guestlist) {
      throw new NotFoundException('Guestlist not found for this event');
    }
    return guestlist;
  }

  async findById(id: string): Promise<Guestlist> {
    const guestlist = await this.guestlistRepository.findById(id, {
      guests: true,
    });
    if (!guestlist) {
      throw new NotFoundException('Guestlist not found');
    }
    return guestlist;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.guestlistRepository.delete(id);
    this.eventEmitter.emit('guestlist.deleted', { guestlistId: id });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, _dto: UpdateGuestlistDto): Promise<Guestlist> {
    // Guestlist schema has no user-updatable fields; return existing record
    const existing = await this.findById(id);
    this.eventEmitter.emit('guestlist.updated', { guestlistId: id });
    return existing;
  }

  async updateRSVP(guestId: string, dto: UpdateRSVPDto): Promise<Guest> {
    const guest = await this.guestlistRepository.findGuestById(guestId);
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }
    const updated = await this.guestlistRepository.updateGuest(guestId, {
      rsvpStatus: dto.rsvpStatus,
      plusOne: dto.plusOne,
    });
    this.eventEmitter.emit('rsvp.updated', {
      guestId,
      guestlistId: guest.guestlistId,
    });
    return updated;
  }

  // ============================================================================
  // GUEST OPERATIONS
  // ============================================================================

  async addGuest(guestlistId: string, dto: CreateGuestDto): Promise<Guest> {
    await this.findById(guestlistId);

    const guest = await this.guestlistRepository.addGuest(guestlistId, {
      guestlist: { connect: { id: guestlistId } },
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      rsvpStatus: 'PENDING',
      plusOne: dto.plusOne ?? 0,
      tableNumber: dto.tableNumber,
      dietaryReq: dto.dietaryReq,
      notes: dto.notes,
    });

    this.eventEmitter.emit('guest.added', { guestId: guest.id, guestlistId });
    return guest;
  }

  async updateGuest(guestId: string, dto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.guestlistRepository.findGuestById(guestId);
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    const updateData: Record<string, unknown> = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      plusOne: dto.plusOne,
      tableNumber: dto.tableNumber,
      dietaryReq: dto.dietaryReq,
      notes: dto.notes,
    };

    if (dto.rsvpStatus !== undefined) {
      updateData.rsvpStatus = dto.rsvpStatus;
    }

    const updated = await this.guestlistRepository.updateGuest(
      guestId,
      updateData,
    );

    if (dto.rsvpStatus && dto.rsvpStatus !== guest.rsvpStatus) {
      this.eventEmitter.emit('guest.rsvp-updated', {
        guestId,
        oldStatus: guest.rsvpStatus,
        newStatus: dto.rsvpStatus,
      });
    }

    return updated;
  }

  async deleteGuest(guestId: string): Promise<void> {
    const guest = await this.guestlistRepository.findGuestById(guestId);
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    await this.guestlistRepository.deleteGuest(guestId);
    this.eventEmitter.emit('guest.removed', {
      guestId,
      guestlistId: guest.guestlistId,
    });
  }

  async getStats(guestlistId: string) {
    return this.guestlistRepository.getStats(guestlistId);
  }
}
