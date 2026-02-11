// ============================================================================
// EVENT NOTE SERVICE - Operations Domain
// ============================================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { EventNote } from '@prisma/client'
import { CreateEventNoteDto } from '../dto'
import { EventNoteRepository } from '../repositories'


@Injectable()
export class EventNoteService {
  private readonly logger = new Logger(EventNoteService.name)

  constructor(
    private readonly eventNoteRepository: EventNoteRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateEventNoteDto): Promise<EventNote> {
    this.logger.log(`Creating event note for active event: ${dto.activeEventId}`)

    const note = await this.eventNoteRepository.create({
      activeEvent: { connect: { id: dto.activeEventId } },
      authorId: dto.authorId,
      content: dto.content,
      isInternal: dto.isInternal ?? false,
    })

    this.eventEmitter.emit('event-note.created', {
      noteId: note.id,
      activeEventId: dto.activeEventId,
      isInternal: note.isInternal,
    })

    return note
  }

  async findById(id: string): Promise<EventNote> {
    const note = await this.eventNoteRepository.findById(id)
    if (!note) {
      throw new NotFoundException('Event note not found')
    }
    return note
  }

  async findByActiveEvent(activeEventId: string): Promise<EventNote[]> {
    return this.eventNoteRepository.findByActiveEvent(activeEventId)
  }

  async findInternalNotes(activeEventId: string): Promise<EventNote[]> {
    return this.eventNoteRepository.findInternalNotes(activeEventId)
  }

  async findPublicNotes(activeEventId: string): Promise<EventNote[]> {
    return this.eventNoteRepository.findPublicNotes(activeEventId)
  }

  async update(id: string, content: string): Promise<EventNote> {
    await this.findById(id)
    return this.eventNoteRepository.update(id, { content })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await this.eventNoteRepository.delete(id)
    this.eventEmitter.emit('event-note.deleted', { noteId: id })
  }
}
