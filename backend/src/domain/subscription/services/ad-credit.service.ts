// ============================================================================
// AD CREDIT SERVICE - Subscription Domain
// ============================================================================
// Manages ad credits: granting, spending, refunds, and balance tracking
// ============================================================================

import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdCreditRepository } from '../repositories/ad-credit.repository';
import { AdCreditTransaction, CreditTransactionType } from '@prisma/client';
import { PlanTier } from '../dto/subscription-plan.dto';

// Monthly credit allocations by plan tier
const MONTHLY_CREDIT_ALLOCATION: Record<string, number> = {
  PROFESSIONAL: 2000,
  ENTERPRISE: 5000,
  // Other tiers don't get monthly credits
  FREE: 0,
  STARTER: 0,
};

@Injectable()
export class AdCreditService {
  private readonly logger = new Logger(AdCreditService.name);

  constructor(
    private readonly adCreditRepository: AdCreditRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // Credit Management
  // ============================================================================

  /**
   * Grant credits to a vendor (from subscription, purchase, etc.)
   */
  async grantCredits(
    vendorProfileId: string,
    amount: number,
    type: CreditTransactionType,
    referenceId?: string,
    description?: string,
  ): Promise<AdCreditTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    this.logger.log(
      `Granting ${amount} credits to vendor ${vendorProfileId} (type: ${type})`,
    );

    // Get current balance
    const currentBalance = await this.adCreditRepository.getBalance(
      vendorProfileId,
    );
    const newBalance = currentBalance + amount;

    // Update balance atomically
    await this.adCreditRepository.incrementCredits(
      vendorProfileId,
      amount,
      newBalance,
    );

    // Create transaction record
    const transaction = await this.adCreditRepository.createTransaction({
      vendorProfile: { connect: { id: vendorProfileId } },
      type,
      amount, // Positive for credits
      balance: newBalance,
      referenceType: this.getReferenceType(type),
      referenceId,
      description,
    });

    // Emit event
    this.eventEmitter.emit('ad-credits.granted', {
      vendorProfileId,
      amount,
      type,
      transactionId: transaction.id,
      newBalance,
    });

    return transaction;
  }

  /**
   * Spend credits (for campaigns)
   */
  async spendCredits(
    vendorProfileId: string,
    amount: number,
    campaignId: string,
  ): Promise<AdCreditTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Spend amount must be positive');
    }

    // Verify sufficient balance
    const currentBalance = await this.adCreditRepository.getBalance(
      vendorProfileId,
    );
    if (currentBalance < amount) {
      throw new BadRequestException(
        `Insufficient credits. Available: ${currentBalance}, Required: ${amount}`,
      );
    }

    this.logger.log(
      `Spending ${amount} credits from vendor ${vendorProfileId} for campaign ${campaignId}`,
    );

    const newBalance = currentBalance - amount;

    // Update balance atomically
    await this.adCreditRepository.decrementCredits(
      vendorProfileId,
      amount,
      newBalance,
    );

    // Create transaction record (negative amount for spend)
    const transaction = await this.adCreditRepository.createTransaction({
      vendorProfile: { connect: { id: vendorProfileId } },
      type: CreditTransactionType.CAMPAIGN_SPEND,
      amount: -amount, // Negative for debits
      balance: newBalance,
      referenceType: 'campaign',
      referenceId: campaignId,
      description: `Campaign spend`,
    });

    // Emit event
    this.eventEmitter.emit('ad-credits.spent', {
      vendorProfileId,
      amount,
      campaignId,
      transactionId: transaction.id,
      newBalance,
    });

    // Check if balance is getting low
    if (newBalance <= 500 && newBalance > 0) {
      this.eventEmitter.emit('ad-credits.low-balance', {
        vendorProfileId,
        balance: newBalance,
      });
    }

    return transaction;
  }

  /**
   * Refund credits
   */
  async refundCredits(
    vendorProfileId: string,
    amount: number,
    referenceId: string,
    reason: string,
  ): Promise<AdCreditTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    this.logger.log(
      `Refunding ${amount} credits to vendor ${vendorProfileId} (reason: ${reason})`,
    );

    // Get current balance
    const currentBalance = await this.adCreditRepository.getBalance(
      vendorProfileId,
    );
    const newBalance = currentBalance + amount;

    // Update balance atomically
    await this.adCreditRepository.incrementCredits(
      vendorProfileId,
      amount,
      newBalance,
    );

    // Create transaction record
    const transaction = await this.adCreditRepository.createTransaction({
      vendorProfile: { connect: { id: vendorProfileId } },
      type: CreditTransactionType.REFUND,
      amount, // Positive for refunds
      balance: newBalance,
      referenceType: 'refund',
      referenceId,
      description: reason,
    });

    // Emit event
    this.eventEmitter.emit('ad-credits.refunded', {
      vendorProfileId,
      amount,
      referenceId,
      reason,
      transactionId: transaction.id,
      newBalance,
    });

    return transaction;
  }

  /**
   * Admin adjustment of credits
   */
  async adjustCredits(
    vendorProfileId: string,
    amount: number,
    reason: string,
    adminUserId?: string,
  ): Promise<AdCreditTransaction> {
    if (amount === 0) {
      throw new BadRequestException('Adjustment amount cannot be zero');
    }

    this.logger.log(
      `Adjusting credits for vendor ${vendorProfileId} by ${amount} (reason: ${reason})`,
    );

    // Get current balance
    const currentBalance = await this.adCreditRepository.getBalance(
      vendorProfileId,
    );
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new BadRequestException(
        'Adjustment would result in negative balance',
      );
    }

    // Update balance
    if (amount > 0) {
      await this.adCreditRepository.incrementCredits(
        vendorProfileId,
        amount,
        newBalance,
      );
    } else {
      await this.adCreditRepository.decrementCredits(
        vendorProfileId,
        Math.abs(amount),
        newBalance,
      );
    }

    // Create transaction record
    const transaction = await this.adCreditRepository.createTransaction({
      vendorProfile: { connect: { id: vendorProfileId } },
      type: CreditTransactionType.ADJUSTMENT,
      amount,
      balance: newBalance,
      referenceType: 'admin_adjustment',
      referenceId: adminUserId,
      description: reason,
    });

    return transaction;
  }

  // ============================================================================
  // Balance & History Queries
  // ============================================================================

  /**
   * Get current credit balance
   */
  async getBalance(vendorProfileId: string): Promise<number> {
    return this.adCreditRepository.getBalance(vendorProfileId);
  }

  /**
   * Check if vendor can afford a spend
   */
  async canAfford(vendorProfileId: string, amount: number): Promise<boolean> {
    const balance = await this.adCreditRepository.getBalance(vendorProfileId);
    return balance >= amount;
  }

  /**
   * Get transaction history
   */
  async getHistory(
    vendorProfileId: string,
    limit?: number,
  ): Promise<AdCreditTransaction[]> {
    return this.adCreditRepository.getTransactionHistory(
      vendorProfileId,
      limit,
    );
  }

  /**
   * Get spending summary for a period
   */
  async getSpendingSummary(
    vendorProfileId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalGranted: number;
    totalSpent: number;
    netChange: number;
    currentBalance: number;
  }> {
    const [totalGranted, totalSpent, currentBalance] = await Promise.all([
      this.adCreditRepository.getTotalGrantedInPeriod(
        vendorProfileId,
        startDate,
        endDate,
      ),
      this.adCreditRepository.getTotalSpentInPeriod(
        vendorProfileId,
        startDate,
        endDate,
      ),
      this.adCreditRepository.getBalance(vendorProfileId),
    ]);

    return {
      totalGranted,
      totalSpent,
      netChange: totalGranted - totalSpent,
      currentBalance,
    };
  }

  // ============================================================================
  // Monthly Credit Grants
  // ============================================================================

  /**
   * Grant monthly credits for a subscription (called by scheduler)
   */
  async grantMonthlyCredits(
    vendorProfileId: string,
    planTier: PlanTier,
  ): Promise<void> {
    const creditAmount = MONTHLY_CREDIT_ALLOCATION[planTier] || 0;

    if (creditAmount === 0) {
      this.logger.debug(
        `No monthly credits for plan tier ${planTier} (vendor: ${vendorProfileId})`,
      );
      return;
    }

    // Check if already granted this month
    const lastGrant = await this.adCreditRepository.getLastMonthlyGrant(
      vendorProfileId,
    );
    if (lastGrant) {
      this.logger.debug(
        `Monthly credits already granted for vendor ${vendorProfileId} on ${lastGrant.toISOString()}`,
      );
      return;
    }

    this.logger.log(
      `Granting ${creditAmount} monthly credits to vendor ${vendorProfileId} (${planTier} plan)`,
    );

    await this.grantCredits(
      vendorProfileId,
      creditAmount,
      CreditTransactionType.SUBSCRIPTION_GRANT,
      undefined,
      `Monthly ${planTier} plan credit grant`,
    );
  }

  /**
   * Process monthly credit grants for all eligible vendors (called by scheduler)
   */
  async processMonthlyGrants(): Promise<{
    processed: number;
    granted: number;
    skipped: number;
  }> {
    this.logger.log('Processing monthly credit grants...');

    let processed = 0;
    let granted = 0;
    let skipped = 0;

    // Process PRO tier
    const proVendors = await this.adCreditRepository.getVendorsByPlanTier(
      'PROFESSIONAL',
    );
    for (const vendor of proVendors) {
      processed++;
      try {
        const lastGrant = await this.adCreditRepository.getLastMonthlyGrant(
          vendor.id,
        );
        if (lastGrant) {
          skipped++;
          continue;
        }

        await this.grantCredits(
          vendor.id,
          MONTHLY_CREDIT_ALLOCATION.PROFESSIONAL,
          CreditTransactionType.SUBSCRIPTION_GRANT,
          undefined,
          'Monthly PROFESSIONAL plan credit grant',
        );
        granted++;
      } catch (error) {
        this.logger.error(
          `Failed to grant monthly credits to vendor ${vendor.id}`,
          error,
        );
      }
    }

    // Process ENTERPRISE tier
    const enterpriseVendors = await this.adCreditRepository.getVendorsByPlanTier(
      'ENTERPRISE',
    );
    for (const vendor of enterpriseVendors) {
      processed++;
      try {
        const lastGrant = await this.adCreditRepository.getLastMonthlyGrant(
          vendor.id,
        );
        if (lastGrant) {
          skipped++;
          continue;
        }

        await this.grantCredits(
          vendor.id,
          MONTHLY_CREDIT_ALLOCATION.ENTERPRISE,
          CreditTransactionType.SUBSCRIPTION_GRANT,
          undefined,
          'Monthly ENTERPRISE plan credit grant',
        );
        granted++;
      } catch (error) {
        this.logger.error(
          `Failed to grant monthly credits to vendor ${vendor.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `Monthly credit grants complete. Processed: ${processed}, Granted: ${granted}, Skipped: ${skipped}`,
    );

    return { processed, granted, skipped };
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private getReferenceType(type: CreditTransactionType): string {
    switch (type) {
      case CreditTransactionType.SUBSCRIPTION_GRANT:
        return 'subscription';
      case CreditTransactionType.PURCHASE:
        return 'purchase';
      case CreditTransactionType.CAMPAIGN_SPEND:
        return 'campaign';
      case CreditTransactionType.REFUND:
        return 'refund';
      case CreditTransactionType.ADJUSTMENT:
        return 'adjustment';
      case CreditTransactionType.EXPIRY:
        return 'expiry';
      default:
        return 'unknown';
    }
  }
}
