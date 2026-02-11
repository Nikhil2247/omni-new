// ============================================================================
// EVENT REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { Prisma, Event } from '@prisma/client'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import { PrismaService } from '../../../core/database/prisma.service'
import { SearchEventDto } from '../dto/event.dto'
import { PaginatedResult } from '../../../core/database/repositories/base.repository'

@Injectable()
export class EventRepository extends BaseRepository<
  Event,
  Prisma.EventCreateInput,
  Prisma.EventUpdateInput,
  Prisma.EventWhereInput,
  Prisma.EventWhereUniqueInput,
  Prisma.EventOrderByWithRelationInput
> {
  protected readonly modelName = 'Event'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.event
  }

  async findByUserId(userId: string, include?: Prisma.EventInclude): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      include,
    })
  }

  async findByUserIds(userIds: string[], include?: Prisma.EventInclude): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { userId: { in: userIds } },
      orderBy: { date: 'asc' },
      include,
    })
  }

  async findUpcoming(limit: number = 10): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        date: { gte: new Date() },
        status: 'CONFIRMED',
      },
      take: limit,
      orderBy: { date: 'asc' },
      include: {
        eventType: true,
        address: true,
      },
    })
  }

  async search(searchDto: SearchEventDto, userIds: string[]): Promise<PaginatedResult<Event>> {
    const { status, eventTypeId, fromDate, toDate, page = 1, limit = 20 } = searchDto

    const where: Prisma.EventWhereInput = { userId: { in: userIds } }

    if (status) where.status = status
    if (eventTypeId) where.eventTypeId = eventTypeId
    if (fromDate || toDate) {
      where.date = {}
      if (fromDate) where.date.gte = new Date(fromDate)
      if (toDate) where.date.lte = new Date(toDate)
    }

    return this.findManyPaginated(
      { page, limit },
      {
        where,
        orderBy: { date: 'asc' },
        include: { eventType: true, address: true },
      },
    )
  }
}
