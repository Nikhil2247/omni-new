// ============================================================================
// TIMELINE REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { Prisma, Timeline } from '@prisma/client'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import { PrismaService } from '../../../core/database/prisma.service'

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

	async findByEventId(eventId: string) {
		return this.model.findFirst({
			where: { eventId },
		})
	}
}
