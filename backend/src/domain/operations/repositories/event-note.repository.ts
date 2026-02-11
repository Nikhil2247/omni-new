// ============================================================================
// EVENT NOTE REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  EventNote,
  Prisma,
} from '@prisma/client'

@Injectable()
export class EventNoteRepository extends BaseRepository<
  EventNote,
  Prisma.EventNoteCreateInput,
  Prisma.EventNoteUpdateInput,
  Prisma.EventNoteWhereInput,
  Prisma.EventNoteWhereUniqueInput,
  Prisma.EventNoteOrderByWithRelationInput
> {
  protected readonly modelName = 'EventNote'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.eventNote
  }

  async findByActiveEvent(activeEventId: string) {
    return this.model.findMany({
      where: { activeEventId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByAuthor(authorId: string, options?: { skip?: number; take?: number }) {
    return this.model.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    })
  }

  async findInternalNotes(activeEventId: string) {
    return this.model.findMany({
      where: {
        activeEventId,
        isInternal: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findPublicNotes(activeEventId: string) {
    return this.model.findMany({
      where: {
        activeEventId,
        isInternal: false,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
