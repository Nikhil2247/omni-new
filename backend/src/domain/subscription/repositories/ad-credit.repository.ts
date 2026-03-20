// ============================================================================
// AD CREDIT REPOSITORY - Subscription Domain
// ============================================================================
// Handles database operations for ad credits and transactions
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  Prisma,
  AdCreditTransaction,
  CreditTransactionType,
} from '@prisma/client';

@Injectable()
export class AdCreditRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // Balance Operations
  // ============================================================================

  /**
   * Get the current ad credit balance for a vendor profile
   * Uses the denormalized adCredits field on VendorProfile
   */
  async getBalance(vendorProfileId: string): Promise<number> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      select: { adCredits: true },
    });

    return vendorProfile?.adCredits ?? 0;
  }

  /**
   * Increment credits on vendor profile (atomic)
   */
  async incrementCredits(
    vendorProfileId: string,
    amount: number,
    newBalance: number,
  ): Promise<void> {
    await this.prisma.vendorProfile.update({
      where: { id: vendorProfileId },
      data: { adCredits: { increment: amount } },
    });
  }

  /**
   * Decrement credits on vendor profile (atomic)
   */
  async decrementCredits(
    vendorProfileId: string,
    amount: number,
    newBalance: number,
  ): Promise<void> {
    await this.prisma.vendorProfile.update({
      where: { id: vendorProfileId },
      data: { adCredits: { decrement: amount } },
    });
  }

  /**
   * Set credits to a specific value (for corrections/adjustments)
   */
  async setCredits(vendorProfileId: string, amount: number): Promise<void> {
    await this.prisma.vendorProfile.update({
      where: { id: vendorProfileId },
      data: { adCredits: amount },
    });
  }

  // ============================================================================
  // Transaction Operations
  // ============================================================================

  /**
   * Create a new ad credit transaction record
   */
  async createTransaction(
    data: Prisma.AdCreditTransactionCreateInput,
  ): Promise<AdCreditTransaction> {
    return this.prisma.adCreditTransaction.create({ data });
  }

  /**
   * Get transaction by ID
   */
  async findTransactionById(id: string): Promise<AdCreditTransaction | null> {
    return this.prisma.adCreditTransaction.findUnique({
      where: { id },
    });
  }

  /**
   * Get transaction history for a vendor
   */
  async getTransactionHistory(
    vendorProfileId: string,
    limit?: number,
  ): Promise<AdCreditTransaction[]> {
    return this.prisma.adCreditTransaction.findMany({
      where: { vendorProfileId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get transactions by type
   */
  async getTransactionsByType(
    vendorProfileId: string,
    type: CreditTransactionType,
    limit?: number,
  ): Promise<AdCreditTransaction[]> {
    return this.prisma.adCreditTransaction.findMany({
      where: {
        vendorProfileId,
        type,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get transactions within a date range
   */
  async getTransactionsInRange(
    vendorProfileId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AdCreditTransaction[]> {
    return this.prisma.adCreditTransaction.findMany({
      where: {
        vendorProfileId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get transactions by reference
   */
  async getTransactionsByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<AdCreditTransaction[]> {
    return this.prisma.adCreditTransaction.findMany({
      where: {
        referenceType,
        referenceId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Calculate total spent on a specific campaign
   */
  async getTotalSpentOnCampaign(campaignId: string): Promise<number> {
    const result = await this.prisma.adCreditTransaction.aggregate({
      where: {
        referenceType: 'campaign',
        referenceId: campaignId,
        type: CreditTransactionType.CAMPAIGN_SPEND,
      },
      _sum: {
        amount: true,
      },
    });

    // Amount is negative for spends, so we negate to get positive spend
    return Math.abs(result._sum.amount || 0);
  }

  /**
   * Calculate total credits granted in a period
   */
  async getTotalGrantedInPeriod(
    vendorProfileId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.adCreditTransaction.aggregate({
      where: {
        vendorProfileId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        type: {
          in: [
            CreditTransactionType.SUBSCRIPTION_GRANT,
            CreditTransactionType.PURCHASE,
          ],
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Calculate total credits spent in a period
   */
  async getTotalSpentInPeriod(
    vendorProfileId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.adCreditTransaction.aggregate({
      where: {
        vendorProfileId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        type: CreditTransactionType.CAMPAIGN_SPEND,
      },
      _sum: {
        amount: true,
      },
    });

    return Math.abs(result._sum.amount || 0);
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  /**
   * Get all vendor profiles with specific plan tier (for monthly grants)
   * Queries through the subscription relation to find the plan tier
   */
  async getVendorsByPlanTier(
    planTier: 'PROFESSIONAL' | 'ENTERPRISE',
  ): Promise<Array<{ id: string; adCredits: number }>> {
    return this.prisma.vendorProfile.findMany({
      where: {
        subscription: {
          status: 'ACTIVE',
          plan: {
            tier: planTier,
          },
        },
      },
      select: { id: true, adCredits: true },
    });
  }

  /**
   * Get the last subscription grant for a vendor this month
   */
  async getLastMonthlyGrant(vendorProfileId: string): Promise<Date | null> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transaction = await this.prisma.adCreditTransaction.findFirst({
      where: {
        vendorProfileId,
        type: CreditTransactionType.SUBSCRIPTION_GRANT,
        createdAt: { gte: startOfMonth },
      },
      orderBy: { createdAt: 'desc' },
    });

    return transaction?.createdAt ?? null;
  }
}
