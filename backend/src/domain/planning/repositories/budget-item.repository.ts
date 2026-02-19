// ============================================================================
// BUDGET ITEM REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { BudgetItem, Prisma } from '@prisma/client';

@Injectable()
export class BudgetItemRepository extends BaseRepository<
  BudgetItem,
  Prisma.BudgetItemCreateInput,
  Prisma.BudgetItemUpdateInput,
  Prisma.BudgetItemWhereInput,
  Prisma.BudgetItemWhereUniqueInput,
  Prisma.BudgetItemOrderByWithRelationInput
> {
  protected readonly modelName = 'BudgetItem';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.budgetItem;
  }

  async findByBudget(budgetId: string) {
    return this.model.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByCategory(budgetId: string, category: string) {
    return this.model.findMany({
      where: {
        budgetId,
        category,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCategoryBreakdown(budgetId: string) {
    const items = await this.model.findMany({
      where: { budgetId },
    });

    const breakdown = items.reduce(
      (acc, item) => {
        const category = item.category;
        if (!acc[category]) {
          acc[category] = {
            category,
            estimated: 0,
            actual: 0,
            count: 0,
          };
        }

        acc[category].estimated += Number(item.estimatedCost);
        acc[category].actual += Number(item.actualCost || 0);
        acc[category].count += 1;

        return acc;
      },
      {} as Record<
        string,
        { category: string; estimated: number; actual: number; count: number }
      >,
    );

    return Object.values(breakdown);
  }

  async getTotals(budgetId: string) {
    const result = await this.prisma.budgetItem.aggregate({
      where: { budgetId },
      _sum: {
        estimatedCost: true,
        actualCost: true,
      },
    });

    return {
      totalEstimated: Number(result._sum.estimatedCost || 0),
      totalActual: Number(result._sum.actualCost || 0),
    };
  }
}
