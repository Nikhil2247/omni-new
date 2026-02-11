// ============================================================================
// EVENT SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Event } from '@prisma/client'
import { EventRepository } from '../repositories/event.repository'
import { WeddingIdentityRepository } from '../repositories/wedding-identity.repository'
import { CreateEventDto, UpdateEventDto, SearchEventDto } from '../dto/event.dto'
import { PaginatedResult } from '../../../core/database/repositories/base.repository'

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name)

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly weddingIdentityRepository: WeddingIdentityRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateEventDto, userId: string): Promise<Event> {
    this.logger.log(`Creating event for user: ${userId}`)

    const event = await this.eventRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      eventType: { connect: { id: dto.eventTypeId } },
      date: new Date(dto.eventDate),
      description: dto.description,
      venueName: dto.venue,
      guestCount: dto.expectedGuests,
      address: dto.addressId ? { connect: { id: dto.addressId } } : undefined,
      status: 'PLANNING',
    }, {
      eventType: true,
      address: true,
    })

    this.eventEmitter.emit('event.created', {
      eventId: event.id,
      userId: event.userId,
      eventName: event.name,
      eventDate: event.date,
    })

    return event
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
    })

    if (!event) {
      throw new NotFoundException('Event not found')
    }

    return event
  }

  async findByUserId(userId: string): Promise<Event[]> {
    const sharedUserIds = await this.resolveSharedUserIds(userId)
    return this.eventRepository.findByUserIds(sharedUserIds, {
      eventType: true,
      address: true,
    })
  }

  async search(searchDto: SearchEventDto, userId: string): Promise<PaginatedResult<Event>> {
    const sharedUserIds = await this.resolveSharedUserIds(userId)
    return this.eventRepository.search(searchDto, sharedUserIds)
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    await this.findById(id)

    const updated = await this.eventRepository.update(id, {
      name: dto.name,
      eventType: dto.eventTypeId ? { connect: { id: dto.eventTypeId } } : undefined,
      date: dto.eventDate ? new Date(dto.eventDate) : undefined,
      description: dto.description,
      venueName: dto.venue,
      guestCount: dto.expectedGuests,
      address: dto.addressId ? { connect: { id: dto.addressId } } : undefined,
      status: dto.status as any,
    }, {
      eventType: true,
      address: true,
    })

    this.eventEmitter.emit('event.updated', {
      eventId: id,
      userId: updated.userId,
      eventName: updated.name,
      changes: dto,
    })
    return updated
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id)
    await this.eventRepository.delete(id)
    this.eventEmitter.emit('event.deleted', {
      eventId: id,
      userId: existing.userId,
      eventName: existing.name,
    })
  }

  async findUpcoming(limit: number = 10): Promise<Event[]> {
    return this.eventRepository.findUpcoming(limit)
  }

  private async resolveSharedUserIds(userId: string): Promise<string[]> {
    const identity = await this.weddingIdentityRepository.findByUserId(userId)
    if (!identity) return [userId]

    const partnerIds = (identity.partners || [])
      .filter((partner) => partner.userId && partner.inviteStatus === 'ACCEPTED')
      .map((partner) => partner.userId as string)

    if (partnerIds.length === 0) return [userId]

    return Array.from(new Set(partnerIds))
  }
}
