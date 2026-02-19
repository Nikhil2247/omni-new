// ============================================================================
// USAGE REPOSITORY - Subscription Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, UsageRecord } from '@prisma/client';

@Injectable()
export class UsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async incrementUsage(params: {
    subscriptionId: string;
    featureKey: string;
    periodStart: Date;
    periodEnd: Date;
    incrementBy?: number;
  }): Promise<UsageRecord> {
    const incrementBy = params.incrementBy ?? 1;

    return this.prisma.usageRecord.upsert({
      where: {
        subscriptionId_featureKey_periodStart: {
          subscriptionId: params.subscriptionId,
          featureKey: params.featureKey,
          periodStart: params.periodStart,
        },
      },
      update: {
        usageCount: { increment: incrementBy },
        periodEnd: params.periodEnd,
      },
      create: {
        subscription: { connect: { id: params.subscriptionId } },
        featureKey: params.featureKey,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        usageCount: incrementBy,
      },
    });
  }

  async getUsageForPeriod(
    subscriptionId: string,
    featureKey: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const result = await this.prisma.usageRecord.aggregate({
      where: {
        subscriptionId,
        featureKey,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
      _sum: {
        usageCount: true,
      },
    });

    return result._sum.usageCount || 0;
  }

  async getUsageHistory(
    subscriptionId: string,
    featureKey?: string,
    startDate?: Date,
  ): Promise<UsageRecord[]> {
    return this.prisma.usageRecord.findMany({
      where: {
        subscriptionId,
        ...(featureKey && { featureKey }),
        ...(startDate && { createdAt: { gte: startDate } }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDailyUsage(
    subscriptionId: string,
    featureKey: string,
    days: number = 30,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.prisma.usageRecord.groupBy({
      by: ['periodStart'],
      where: {
        subscriptionId,
        featureKey,
        periodStart: { gte: startDate },
      },
      _sum: { usageCount: true },
    });

    return records;
  }
}
