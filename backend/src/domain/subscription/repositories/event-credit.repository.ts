// ============================================================================
// EVENT CREDIT REPOSITORY - Subscription Domain
// ============================================================================
// Handles database operations for event credits and transactions
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  Prisma,
  EventCreditBalance,
  EventCreditTransaction,
  EventCreditProduct,
  EventTierFeature,
  EventTier,
  BundleType,
  EventCreditTransactionType,
} from '@prisma/client';

@Injectable()
export class EventCreditRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // Credit Balance Operations
  // ============================================================================

  /**
   * Get or create credit balance for a user
   */
  async getOrCreateBalance(userId: string): Promise<EventCreditBalance> {
    return this.prisma.eventCreditBalance.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        basicCredits: 0,
        premiumCredits: 0,
        freeEventUsed: false,
      },
    });
  }

  /**
   * Get credit balance by user ID
   */
  async getBalanceByUserId(userId: string): Promise<EventCreditBalance | null> {
    return this.prisma.eventCreditBalance.findUnique({
      where: { userId },
    });
  }

  /**
   * Add credits to user balance (atomic)
   */
  async addCredits(
    userId: string,
    tier: EventTier,
    amount: number,
  ): Promise<EventCreditBalance> {
    const field = tier === EventTier.BASIC ? 'basicCredits' : 'premiumCredits';

    return this.prisma.eventCreditBalance.upsert({
      where: { userId },
      update: {
        [field]: { increment: amount },
      },
      create: {
        userId,
        basicCredits: tier === EventTier.BASIC ? amount : 0,
        premiumCredits: tier === EventTier.PREMIUM ? amount : 0,
        freeEventUsed: false,
      },
    });
  }

  /**
   * Use a credit (decrement balance)
   */
  async useCredit(
    userId: string,
    tier: EventTier,
  ): Promise<EventCreditBalance> {
    const field = tier === EventTier.BASIC ? 'basicCredits' : 'premiumCredits';

    return this.prisma.eventCreditBalance.update({
      where: { userId },
      data: {
        [field]: { decrement: 1 },
      },
    });
  }

  /**
   * Mark free event as used
   */
  async markFreeEventUsed(userId: string): Promise<EventCreditBalance> {
    return this.prisma.eventCreditBalance.upsert({
      where: { userId },
      update: { freeEventUsed: true },
      create: {
        userId,
        basicCredits: 0,
        premiumCredits: 0,
        freeEventUsed: true,
      },
    });
  }

  /**
   * Refund a credit to user balance
   */
  async refundCredit(
    userId: string,
    tier: EventTier,
  ): Promise<EventCreditBalance> {
    const field = tier === EventTier.BASIC ? 'basicCredits' : 'premiumCredits';

    return this.prisma.eventCreditBalance.update({
      where: { userId },
      data: {
        [field]: { increment: 1 },
      },
    });
  }

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  /**
   * Create a credit transaction record
   */
  async createTransaction(
    data: Prisma.EventCreditTransactionCreateInput,
  ): Promise<EventCreditTransaction> {
    return this.prisma.eventCreditTransaction.create({ data });
  }

  /**
   * Get transaction by ID
   */
  async findTransactionById(id: string): Promise<EventCreditTransaction | null> {
    return this.prisma.eventCreditTransaction.findUnique({
      where: { id },
      include: {
        event: true,
        payment: true,
      },
    });
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<EventCreditTransaction[]> {
    const balance = await this.getBalanceByUserId(userId);
    if (!balance) return [];

    return this.prisma.eventCreditTransaction.findMany({
      where: { creditBalanceId: balance.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        event: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Get transactions by type
   */
  async getTransactionsByType(
    userId: string,
    type: EventCreditTransactionType,
    limit?: number,
  ): Promise<EventCreditTransaction[]> {
    const balance = await this.getBalanceByUserId(userId);
    if (!balance) return [];

    return this.prisma.eventCreditTransaction.findMany({
      where: {
        creditBalanceId: balance.id,
        type,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get transaction by event ID (to check if event already used a credit)
   */
  async getTransactionByEventId(
    eventId: string,
  ): Promise<EventCreditTransaction | null> {
    return this.prisma.eventCreditTransaction.findFirst({
      where: {
        eventId,
        type: EventCreditTransactionType.USAGE,
      },
    });
  }

  // ============================================================================
  // Product Operations
  // ============================================================================

  /**
   * Get all active products
   */
  async getAllActiveProducts(): Promise<EventCreditProduct[]> {
    return this.prisma.eventCreditProduct.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get products by tier
   */
  async getProductsByTier(tier: EventTier): Promise<EventCreditProduct[]> {
    return this.prisma.eventCreditProduct.findMany({
      where: { tier, isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get product by tier and bundle type
   */
  async getProduct(
    tier: EventTier,
    bundleType: BundleType,
  ): Promise<EventCreditProduct | null> {
    return this.prisma.eventCreditProduct.findUnique({
      where: {
        tier_bundleType: { tier, bundleType },
      },
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<EventCreditProduct | null> {
    return this.prisma.eventCreditProduct.findUnique({
      where: { id },
    });
  }

  // ============================================================================
  // Tier Feature Operations
  // ============================================================================

  /**
   * Get all features for a tier
   */
  async getFeaturesByTier(tier: EventTier): Promise<EventTierFeature[]> {
    return this.prisma.eventTierFeature.findMany({
      where: { tier, isEnabled: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a specific feature for a tier
   */
  async getFeature(
    tier: EventTier,
    featureKey: string,
  ): Promise<EventTierFeature | null> {
    return this.prisma.eventTierFeature.findUnique({
      where: {
        tier_featureKey: { tier, featureKey },
      },
    });
  }

  /**
   * Get all features (both tiers) for comparison
   */
  async getAllFeatures(): Promise<EventTierFeature[]> {
    return this.prisma.eventTierFeature.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: 'asc' }, { tier: 'asc' }],
    });
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Count total transactions by user
   */
  async countUserTransactions(userId: string): Promise<number> {
    const balance = await this.getBalanceByUserId(userId);
    if (!balance) return 0;

    return this.prisma.eventCreditTransaction.count({
      where: { creditBalanceId: balance.id },
    });
  }

  /**
   * Get total spent by user (sum of purchase amounts)
   */
  async getTotalSpentByUser(userId: string): Promise<number> {
    const balance = await this.getBalanceByUserId(userId);
    if (!balance) return 0;

    const result = await this.prisma.eventCreditTransaction.aggregate({
      where: {
        creditBalanceId: balance.id,
        type: EventCreditTransactionType.PURCHASE,
      },
      _sum: {
        priceInr: true,
      },
    });

    return Number(result._sum.priceInr) || 0;
  }

  /**
   * Get events created with credits by user
   */
  async getEventsCreditedByUser(userId: string): Promise<number> {
    const balance = await this.getBalanceByUserId(userId);
    if (!balance) return 0;

    return this.prisma.eventCreditTransaction.count({
      where: {
        creditBalanceId: balance.id,
        type: EventCreditTransactionType.USAGE,
      },
    });
  }
}
