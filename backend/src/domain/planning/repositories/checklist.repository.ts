// ============================================================================
// CHECKLIST REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, Checklist } from '@prisma/client';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class ChecklistRepository extends BaseRepository<
  Checklist,
  Prisma.ChecklistCreateInput,
  Prisma.ChecklistUpdateInput,
  Prisma.ChecklistWhereInput,
  Prisma.ChecklistWhereUniqueInput,
  Prisma.ChecklistOrderByWithRelationInput
> {
  protected readonly modelName = 'Checklist';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.checklist;
  }

  async findByEventId(
    eventId: string,
    includeItems: boolean = true,
  ): Promise<Checklist[]> {
    return this.prisma.checklist.findMany({
      where: { eventId },
      include: includeItems
        ? {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          }
        : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findWithItems(id: string): Promise<Checklist | null> {
    return this.prisma.checklist.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async getCompletionStats(
    checklistId: string,
  ): Promise<{ total: number; completed: number; percentage: number }> {
    const stats = await this.prisma.checklistItem.groupBy({
      by: ['isCompleted'],
      where: { checklistId },
      _count: true,
    });

    const total = stats.reduce((sum, stat) => sum + stat._count, 0);
    const completed = stats.find((stat) => stat.isCompleted)?._count || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }
}
