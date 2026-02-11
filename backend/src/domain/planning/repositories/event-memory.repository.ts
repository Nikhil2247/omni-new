// ============================================================================
// EVENT MEMORY REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  EventMemory,
  Prisma,
} from '@prisma/client'

@Injectable()
export class EventMemoryRepository extends BaseRepository<
  EventMemory,
  Prisma.EventMemoryCreateInput,
  Prisma.EventMemoryUpdateInput,
  Prisma.EventMemoryWhereInput,
  Prisma.EventMemoryWhereUniqueInput,
  Prisma.EventMemoryOrderByWithRelationInput
> {
  protected readonly modelName = 'EventMemory'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.eventMemory
  }

  async findByEvent(eventId: string) {
    return this.model.findUnique({
      where: { eventId },
    })
  }
}
