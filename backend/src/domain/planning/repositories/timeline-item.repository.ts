// ============================================================================
// TIMELINE ITEM REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  Timeline,
  Prisma,
} from '@prisma/client'

@Injectable()
export class TimelineRepository extends BaseRepository<
  Timeline,
  Prisma.TimelineCreateInput,
  Prisma.TimelineUpdateInput,
  Prisma.TimelineWhereInput,
  Prisma.TimelineWhereUniqueInput,
  Prisma.TimelineOrderByWithRelationInput
> {
  protected readonly modelName = 'Timeline'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.timeline
  }

  async findByTimeline(timelineId: string) {
    // Timeline items are stored in the items JSON field
    return this.model.findUnique({
      where: { id: timelineId },
    })
  }

  async findUpcoming(timelineId: string, fromTime: Date) {
    // Timeline items are stored in the items JSON field
    // This needs to be filtered in application code
    return this.model.findUnique({
      where: { id: timelineId },
    })
  }

  async findByTimeRange(timelineId: string, startTime: Date, endTime: Date) { return this.model.findUnique({ where: { id: timelineId }, }) }

  async findCompleted(timelineId: string) { return this.model.findUnique({ where: { id: timelineId }, }) }

  async findPending(timelineId: string) { return this.model.findUnique({ where: { id: timelineId }, }) }
}


