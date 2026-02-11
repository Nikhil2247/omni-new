// ============================================================================
// CHECKLIST ITEM REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  ChecklistItem,
  Prisma,
} from '@prisma/client'

@Injectable()
export class ChecklistItemRepository extends BaseRepository<
  ChecklistItem,
  Prisma.ChecklistItemCreateInput,
  Prisma.ChecklistItemUpdateInput,
  Prisma.ChecklistItemWhereInput,
  Prisma.ChecklistItemWhereUniqueInput,
  Prisma.ChecklistItemOrderByWithRelationInput
> {
  protected readonly modelName = 'ChecklistItem'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.checklistItem
  }

  async findByChecklist(checklistId: string) {
    return this.model.findMany({
      where: { checklistId },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findCompleted(checklistId: string) {
    return this.model.findMany({
      where: {
        checklistId,
        isCompleted: true,
      },
      orderBy: { completedAt: 'desc' },
    })
  }

  async findPending(checklistId: string) {
    return this.model.findMany({
      where: {
        checklistId,
        isCompleted: false,
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getCompletionStats(checklistId: string) {
    const total = await this.model.count({
      where: { checklistId },
    })

    const completed = await this.model.count({
      where: {
        checklistId,
        isCompleted: true,
      },
    })

    return {
      total,
      completed,
      pending: total - completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }
}
