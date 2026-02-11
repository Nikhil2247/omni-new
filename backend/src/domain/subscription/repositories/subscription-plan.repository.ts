// ============================================================================
// SUBSCRIPTION PLAN REPOSITORY - Subscription Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { Prisma, SubscriptionPlan } from '@prisma/client'

@Injectable()
export class SubscriptionPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SubscriptionPlanCreateInput): Promise<SubscriptionPlan> {
    return this.prisma.subscriptionPlan.create({ data })
  }

  async findById(id: string, include?: Prisma.SubscriptionPlanInclude): Promise<SubscriptionPlan | null> {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include,
    })
  }

  async findByTier(tier: string): Promise<SubscriptionPlan | null> {
    return this.prisma.subscriptionPlan.findFirst({
      where: { tier: tier as any, isActive: true },
      include: {
        features: true,
        prices: true,
      },
    })
  }

  async findAll(includeInactive = false): Promise<SubscriptionPlan[]> {
    return this.prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        features: true,
        prices: true,
      },
      orderBy: { tier: 'asc' },
    })
  }

  async findActive(): Promise<SubscriptionPlan[]> {
    return this.findAll(false)
  }

  async update(id: string, data: Prisma.SubscriptionPlanUpdateInput): Promise<SubscriptionPlan> {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.subscriptionPlan.delete({ where: { id } })
  }
}
