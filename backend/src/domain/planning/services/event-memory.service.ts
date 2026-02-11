// ============================================================================
// EVENT MEMORY SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { EventMemory } from '@prisma/client'
import { EventMemoryRepository } from '../repositories/event-memory.repository'
import { CreateEventMemoryDto } from '../dto/event-memory.dto'

@Injectable()
export class EventMemoryService {
  private readonly logger = new Logger(EventMemoryService.name)

  constructor(
    private readonly eventMemoryRepository: EventMemoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateEventMemoryDto): Promise<EventMemory> {
    this.logger.log(`Creating event memory for event: ${dto.eventId}`)

    // Generate a unique QR code if not provided
    const qrCode = dto.qrCode ?? `event-${dto.eventId.substring(0, 8)}-${Date.now()}`
    
    // Generate QR code URL using a third-party service (can be replaced with self-hosted)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const guestUrl = `${baseUrl}/guest/${qrCode}`
    const qrCodeUrl = dto.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guestUrl)}`

    const memory = await this.eventMemoryRepository.create({
      event: { connect: { id: dto.eventId } },
      qrCode,
      qrCodeUrl,
      isActive: dto.isActive ?? true,
      allowUploads: dto.allowUploads ?? true,
      requireApproval: dto.requireApproval ?? false,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    })

    this.eventEmitter.emit('event-memory.created', {
      memoryId: memory.id,
      eventId: dto.eventId,
    })

    return memory
  }

  async findById(id: string): Promise<EventMemory> {
    const memory = await this.eventMemoryRepository.findById(id)
    if (!memory) {
      throw new NotFoundException('Event memory not found')
    }
    return memory
  }

  async findByEvent(eventId: string): Promise<EventMemory | null> {
    return this.eventMemoryRepository.findByEvent(eventId)
  }

  async findByType(eventId: string, type: string): Promise<EventMemory[]> {
    // For now, just return all memories for the event
    // In future, could filter by type if that field exists
    const memory = await this.eventMemoryRepository.findByEvent(eventId)
    return memory ? [memory] : []
  }

  async delete(id: string): Promise<void> {
    const memory = await this.findById(id)
    await this.eventMemoryRepository.delete(id)

    this.eventEmitter.emit('event-memory.deleted', {
      memoryId: id,
      eventId: memory.eventId,
    })
  }
}
