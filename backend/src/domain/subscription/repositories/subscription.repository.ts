// ============================================================================
// SUBSCRIPTION REPOSITORY - Subscription Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { Prisma, Subscription } from '@prisma/client'

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SubscriptionCreateInput): Promise<Subscription> {
    return this.prisma.subscription.create({ data })
  }

  async findById(id: string, include?: Prisma.SubscriptionInclude): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
      include,
    })
  }

  async findByVendorProfile(vendorProfileId: string): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: { vendorProfileId },
      include: {
        plan: true,
        price: true,
        paymentMethods: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findActiveByVendorProfile(vendorProfileId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: {
        vendorProfileId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      include: {
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
        paymentMethods: true,
      },
    })
  }

  async update(id: string, data: Prisma.SubscriptionUpdateInput): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: {
        plan: true,
        price: true,
        paymentMethods: true,
      },
    })
  }

  async createStatusHistory(subscriptionId: string, data: { fromStatus: string; toStatus: string; reason?: string }) {
    return this.prisma.subscriptionStatusHistory.create({
      data: {
        subscription: { connect: { id: subscriptionId } },
        fromStatus: data.fromStatus as any,
        toStatus: data.toStatus as any,
        reason: data.reason,
      },
    })
  }

  async getExpiringSubscriptions(daysFromNow: number): Promise<Subscription[]> {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysFromNow)

    return this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          lte: targetDate,
        },
        cancelAtPeriodEnd: true,
      },
      include: {
        vendorProfile: true,
        plan: true,
        price: true,
      },
    })
  }

  async getSubscriptionsToRenew(): Promise<Subscription[]> {
    const now = new Date()

    return this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          lte: now,
        },
      },
      include: {
        vendorProfile: true,
        plan: true,
        price: true,
        paymentMethods: true,
      },
    })
  }
}
