// ============================================================================
// USER SUBSCRIPTION REPOSITORY - User Subscription Domain
// ============================================================================
// Repository for managing user subscriptions and usage records

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  Prisma,
  UserSubscription,
  UserUsageRecord,
  SubscriptionStatus,
} from '@prisma/client';

@Injectable()
export class UserSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user subscription
   */
  async create(
    data: Prisma.UserSubscriptionCreateInput,
  ): Promise<UserSubscription> {
    return this.prisma.userSubscription.create({
      data,
      include: {
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
      },
    });
  }

  /**
   * Find subscription by ID
   */
  async findById(
    id: string,
    include?: Prisma.UserSubscriptionInclude,
  ): Promise<UserSubscription | null> {
    return this.prisma.userSubscription.findUnique({
      where: { id },
      include: include ?? {
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  /**
   * Find subscription by user ID
   */
  async findByUserId(userId: string): Promise<UserSubscription | null> {
    return this.prisma.userSubscription.findUnique({
      where: { userId },
      include: {
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
      },
    });
  }

  /**
   * Find active subscription by user ID
   */
  async findActiveByUserId(userId: string): Promise<UserSubscription | null> {
    return this.prisma.userSubscription.findFirst({
      where: {
        userId,
        status: {
          in: [
            'ACTIVE' as SubscriptionStatus,
            'TRIALING' as SubscriptionStatus,
            'PAST_DUE' as SubscriptionStatus,
          ],
        },
      },
      include: {
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
      },
    });
  }

  /**
   * Update a subscription
   */
  async update(
    id: string,
    data: Prisma.UserSubscriptionUpdateInput,
  ): Promise<UserSubscription> {
    return this.prisma.userSubscription.update({
      where: { id },
      data,
      include: {
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
      },
    });
  }

  /**
   * Update subscription by user ID
   */
  async updateByUserId(
    userId: string,
    data: Prisma.UserSubscriptionUpdateInput,
  ): Promise<UserSubscription> {
    return this.prisma.userSubscription.update({
      where: { userId },
      data,
      include: {
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
      },
    });
  }

  /**
   * Create a usage record for an event
   */
  async createUsageRecord(params: {
    subscriptionId: string;
    eventId: string;
    featureKey: string;
    usageCount: number;
  }): Promise<UserUsageRecord> {
    return this.prisma.userUsageRecord.create({
      data: {
        subscription: { connect: { id: params.subscriptionId } },
        event: { connect: { id: params.eventId } },
        featureKey: params.featureKey,
        usageCount: params.usageCount,
      },
    });
  }

  /**
   * Increment usage for a feature on an event (upsert)
   */
  async incrementUsage(params: {
    subscriptionId: string;
    eventId: string;
    featureKey: string;
    incrementBy?: number;
  }): Promise<UserUsageRecord> {
    const incrementBy = params.incrementBy ?? 1;

    return this.prisma.userUsageRecord.upsert({
      where: {
        subscriptionId_eventId_featureKey: {
          subscriptionId: params.subscriptionId,
          eventId: params.eventId,
          featureKey: params.featureKey,
        },
      },
      update: {
        usageCount: { increment: incrementBy },
      },
      create: {
        subscription: { connect: { id: params.subscriptionId } },
        event: { connect: { id: params.eventId } },
        featureKey: params.featureKey,
        usageCount: incrementBy,
      },
    });
  }

  /**
   * Get usage for a specific event and feature
   */
  async getUsageForEvent(
    subscriptionId: string,
    eventId: string,
    featureKey: string,
  ): Promise<number> {
    const record = await this.prisma.userUsageRecord.findUnique({
      where: {
        subscriptionId_eventId_featureKey: {
          subscriptionId,
          eventId,
          featureKey,
        },
      },
    });

    return record?.usageCount ?? 0;
  }

  /**
   * Get all usage records for an event
   */
  async getAllUsageForEvent(
    subscriptionId: string,
    eventId: string,
  ): Promise<UserUsageRecord[]> {
    return this.prisma.userUsageRecord.findMany({
      where: {
        subscriptionId,
        eventId,
      },
    });
  }

  /**
   * Get usage history for a subscription
   */
  async getUsageHistory(
    subscriptionId: string,
    eventId?: string,
    featureKey?: string,
  ): Promise<UserUsageRecord[]> {
    return this.prisma.userUsageRecord.findMany({
      where: {
        subscriptionId,
        ...(eventId && { eventId }),
        ...(featureKey && { featureKey }),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get subscriptions expiring within N days
   */
  async getExpiringSubscriptions(daysFromNow: number): Promise<UserSubscription[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);

    return this.prisma.userSubscription.findMany({
      where: {
        status: 'ACTIVE' as SubscriptionStatus,
        currentPeriodEnd: {
          lte: targetDate,
        },
        cancelAtPeriodEnd: true,
      },
      include: {
        user: true,
        plan: true,
        price: true,
      },
    });
  }

  /**
   * Get subscriptions that need renewal
   */
  async getSubscriptionsToRenew(): Promise<UserSubscription[]> {
    const now = new Date();

    return this.prisma.userSubscription.findMany({
      where: {
        status: 'ACTIVE' as SubscriptionStatus,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          lte: now,
        },
      },
      include: {
        user: true,
        plan: true,
        price: true,
      },
    });
  }

  /**
   * Delete usage records for an event (used when event is deleted)
   */
  async deleteUsageForEvent(eventId: string): Promise<void> {
    await this.prisma.userUsageRecord.deleteMany({
      where: { eventId },
    });
  }

  /**
   * Get aggregate usage across all events for a user
   */
  async getAggregateUsage(
    subscriptionId: string,
    featureKey: string,
  ): Promise<number> {
    const result = await this.prisma.userUsageRecord.aggregate({
      where: {
        subscriptionId,
        featureKey,
      },
      _sum: {
        usageCount: true,
      },
    });

    return result._sum.usageCount ?? 0;
  }
}
