// ============================================================================
// BUDGET REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, Budget, BudgetItem } from '@prisma/client';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class BudgetRepository extends BaseRepository<
  Budget,
  Prisma.BudgetCreateInput,
  Prisma.BudgetUpdateInput,
  Prisma.BudgetWhereInput,
  Prisma.BudgetWhereUniqueInput,
  Prisma.BudgetOrderByWithRelationInput
> {
  protected readonly modelName = 'Budget';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.budget;
  }

  async findByEventId(eventId: string): Promise<Budget | null> {
    return this.prisma.budget.findUnique({
      where: { eventId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findWithItems(id: string): Promise<Budget | null> {
    return this.prisma.budget.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async calculateTotals(budgetId: string) {
    const result = await this.prisma.budgetItem.aggregate({
      where: { budgetId },
      _sum: {
        estimatedCost: true,
        actualCost: true,
      },
    });

    return {
      totalEstimated: result._sum.estimatedCost || 0,
      totalActual: result._sum.actualCost || 0,
    };
  }

  async addItem(
    budgetId: string,
    data: Prisma.BudgetItemCreateInput,
  ): Promise<BudgetItem> {
    return this.prisma.budgetItem.create({ data });
  }

  async updateItem(
    itemId: string,
    data: Prisma.BudgetItemUpdateInput,
  ): Promise<BudgetItem> {
    return this.prisma.budgetItem.update({
      where: { id: itemId },
      data,
    });
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.prisma.budgetItem.delete({ where: { id: itemId } });
  }

  async findItemById(itemId: string): Promise<BudgetItem | null> {
    return this.prisma.budgetItem.findUnique({ where: { id: itemId } });
  }

  async getCategoryBreakdown(budgetId: string) {
    const items = await this.prisma.budgetItem.findMany({
      where: { budgetId },
    });

    const breakdown = items.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {
            category: item.category,
            estimated: 0,
            actual: 0,
            items: 0,
          };
        }
        acc[item.category].estimated += Number(item.estimatedCost || 0);
        acc[item.category].actual += Number(item.actualCost || 0);
        acc[item.category].items += 1;
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(breakdown);
  }
}
