// ============================================================================
// EVENT CREDIT SERVICE - Subscription Domain
// ============================================================================
// Manages event credits: balance, purchase, usage, and tier features
// ============================================================================

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventCreditRepository } from '../repositories/event-credit.repository';
import {
  EventCreditBalance,
  EventCreditTransaction,
  EventCreditProduct,
  EventTierFeature,
  EventTier,
  BundleType,
  EventCreditTransactionType,
} from '@prisma/client';

// ============================================================================
// Response Types
// ============================================================================

export interface CreditBalanceResponse {
  userId: string;
  basicCredits: number;
  premiumCredits: number;
  freeEventAvailable: boolean;
  totalCredits: number;
}

export interface CanCreateEventResponse {
  canCreate: boolean;
  tier: EventTier | null;
  source: 'free_event' | 'basic_credit' | 'premium_credit' | null;
  message: string;
}

export interface ProductWithPricing extends EventCreditProduct {
  perEventPrice: number;
  originalPrice: number;
}

export interface TierComparisonResponse {
  features: {
    featureKey: string;
    featureName: string;
    description: string | null;
    basicValue: string;
    premiumValue: string;
    isHighlighted: boolean;
  }[];
}

@Injectable()
export class EventCreditService {
  private readonly logger = new Logger(EventCreditService.name);

  constructor(
    private readonly creditRepository: EventCreditRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // Balance Management
  // ============================================================================

  /**
   * Get credit balance for a user
   */
  async getBalance(userId: string): Promise<CreditBalanceResponse> {
    const balance = await this.creditRepository.getOrCreateBalance(userId);

    return {
      userId,
      basicCredits: balance.basicCredits,
      premiumCredits: balance.premiumCredits,
      freeEventAvailable: !balance.freeEventUsed,
      totalCredits: balance.basicCredits + balance.premiumCredits,
    };
  }

  /**
   * Check if user can create an event with specified tier
   *
   * UNLIMITED EVENT CREATION: Users can create unlimited events.
   * The tier (BASIC/PREMIUM) determines feature limits within the event.
   * Credits are no longer required for event creation.
   */
  async canCreateEvent(
    userId: string,
    requestedTier?: EventTier,
  ): Promise<CanCreateEventResponse> {
    // Ensure user has a balance record (for tracking purposes)
    await this.creditRepository.getOrCreateBalance(userId);

    // Determine the tier - default to BASIC if not specified
    const tier = requestedTier || EventTier.BASIC;

    // UNLIMITED EVENT CREATION - always allow
    return {
      canCreate: true,
      tier,
      source: tier === EventTier.PREMIUM ? 'premium_credit' : 'basic_credit',
      message: `You can create unlimited ${tier} events. Feature limits apply based on event tier.`,
    };
  }

  /**
   * Use a credit for event creation
   */
  async useCredit(
    userId: string,
    eventId: string,
    tier: EventTier,
  ): Promise<EventCreditTransaction> {
    const balance = await this.creditRepository.getOrCreateBalance(userId);

    // Check if this event already used a credit
    const existingTransaction = await this.creditRepository.getTransactionByEventId(eventId);
    if (existingTransaction) {
      throw new BadRequestException('This event has already used a credit');
    }

    let transactionType: EventCreditTransactionType;
    let description: string;

    // Handle free event
    if (!balance.freeEventUsed && tier === EventTier.BASIC) {
      await this.creditRepository.markFreeEventUsed(userId);
      transactionType = EventCreditTransactionType.FREE_GRANT;
      description = 'Free event credit used';
    } else {
      // Check credit availability
      const credits = tier === EventTier.BASIC ? balance.basicCredits : balance.premiumCredits;
      if (credits <= 0) {
        throw new ForbiddenException(
          `No ${tier.toLowerCase()} credits available. Please purchase credits to continue.`,
        );
      }

      // Deduct credit
      await this.creditRepository.useCredit(userId, tier);
      transactionType = EventCreditTransactionType.USAGE;
      description = `${tier} event credit used`;
    }

    // Create transaction record
    const transaction = await this.creditRepository.createTransaction({
      creditBalance: { connect: { userId } },
      type: transactionType,
      tier,
      amount: -1,
      event: { connect: { id: eventId } },
      description,
    });

    this.logger.log(
      `Credit used: user=${userId}, event=${eventId}, tier=${tier}, type=${transactionType}`,
    );

    // Emit event
    this.eventEmitter.emit('event-credit.used', {
      userId,
      eventId,
      tier,
      transactionId: transaction.id,
    });

    return transaction;
  }

  /**
   * Refund a credit when event is deleted
   */
  async refundCredit(
    userId: string,
    eventId: string,
  ): Promise<EventCreditTransaction | null> {
    // Find the original usage transaction
    const usageTransaction = await this.creditRepository.getTransactionByEventId(eventId);

    if (!usageTransaction) {
      this.logger.warn(`No credit transaction found for event ${eventId}`);
      return null;
    }

    // Don't refund free events
    if (usageTransaction.type === EventCreditTransactionType.FREE_GRANT) {
      this.logger.log(`Free event credit not refundable for event ${eventId}`);
      return null;
    }

    // Refund the credit
    await this.creditRepository.refundCredit(userId, usageTransaction.tier);

    // Create refund transaction
    const refundTransaction = await this.creditRepository.createTransaction({
      creditBalance: { connect: { userId } },
      type: EventCreditTransactionType.REFUND,
      tier: usageTransaction.tier,
      amount: 1,
      event: { connect: { id: eventId } },
      description: `${usageTransaction.tier} event credit refunded`,
    });

    this.logger.log(
      `Credit refunded: user=${userId}, event=${eventId}, tier=${usageTransaction.tier}`,
    );

    // Emit event
    this.eventEmitter.emit('event-credit.refunded', {
      userId,
      eventId,
      tier: usageTransaction.tier,
      transactionId: refundTransaction.id,
    });

    return refundTransaction;
  }

  // ============================================================================
  // Credit Purchase
  // ============================================================================

  /**
   * Process credit purchase after successful payment
   */
  async purchaseCredits(
    userId: string,
    productId: string,
    paymentId: string,
    razorpayPaymentId?: string,
  ): Promise<EventCreditTransaction> {
    const product = await this.creditRepository.getProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('This product is no longer available');
    }

    // Add credits to balance
    await this.creditRepository.addCredits(userId, product.tier, product.creditCount);

    // Create transaction record
    const transaction = await this.creditRepository.createTransaction({
      creditBalance: { connect: { userId } },
      type: EventCreditTransactionType.PURCHASE,
      tier: product.tier,
      amount: product.creditCount,
      bundleType: product.bundleType,
      priceInr: product.priceInr,
      payment: { connect: { id: paymentId } },
      razorpayPaymentId,
      description: `Purchased ${product.creditCount} ${product.tier} credit${product.creditCount > 1 ? 's' : ''} (${product.bundleType})`,
    });

    this.logger.log(
      `Credits purchased: user=${userId}, tier=${product.tier}, count=${product.creditCount}, price=${product.priceInr}`,
    );

    // Emit event for email and notification listeners
    this.eventEmitter.emit('event-credit.purchased', {
      userId,
      tier: product.tier,
      creditCount: product.creditCount,
      bundleType: product.bundleType,
      amount: Number(product.priceInr),
      currency: 'INR',
      transactionId: transaction.id,
      paymentId,
    });

    return transaction;
  }

  /**
   * Grant free credits (for promotions, admin actions, etc.)
   */
  async grantCredits(
    userId: string,
    tier: EventTier,
    amount: number,
    description: string,
  ): Promise<EventCreditTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
    }

    await this.creditRepository.addCredits(userId, tier, amount);

    const transaction = await this.creditRepository.createTransaction({
      creditBalance: { connect: { userId } },
      type: EventCreditTransactionType.FREE_GRANT,
      tier,
      amount,
      description,
    });

    this.logger.log(
      `Credits granted: user=${userId}, tier=${tier}, amount=${amount}`,
    );

    return transaction;
  }

  // ============================================================================
  // Products
  // ============================================================================

  /**
   * Get all available products with pricing details
   */
  async getAllProducts(): Promise<ProductWithPricing[]> {
    const products = await this.creditRepository.getAllActiveProducts();

    return products.map((product) => ({
      ...product,
      perEventPrice: Number(product.priceInr) / product.creditCount,
      originalPrice: this.calculateOriginalPrice(product),
    }));
  }

  /**
   * Get products by tier
   */
  async getProductsByTier(tier: EventTier): Promise<ProductWithPricing[]> {
    const products = await this.creditRepository.getProductsByTier(tier);

    return products.map((product) => ({
      ...product,
      perEventPrice: Number(product.priceInr) / product.creditCount,
      originalPrice: this.calculateOriginalPrice(product),
    }));
  }

  /**
   * Get a specific product
   */
  async getProduct(
    tier: EventTier,
    bundleType: BundleType,
  ): Promise<ProductWithPricing | null> {
    const product = await this.creditRepository.getProduct(tier, bundleType);
    if (!product) return null;

    return {
      ...product,
      perEventPrice: Number(product.priceInr) / product.creditCount,
      originalPrice: this.calculateOriginalPrice(product),
    };
  }

  private calculateOriginalPrice(product: EventCreditProduct): number {
    const price = Number(product.priceInr);
    const discount = product.discountPercent || 0;

    if (discount === 0) return price;

    // Calculate original price before discount
    return Math.round(price / (1 - discount / 100));
  }

  // ============================================================================
  // Tier Features
  // ============================================================================

  /**
   * Get features for a specific tier
   */
  async getTierFeatures(tier: EventTier): Promise<EventTierFeature[]> {
    return this.creditRepository.getFeaturesByTier(tier);
  }

  /**
   * Get feature limit for a specific event feature
   */
  async getFeatureLimit(
    tier: EventTier,
    featureKey: string,
  ): Promise<number | null> {
    const feature = await this.creditRepository.getFeature(tier, featureKey);
    if (!feature) {
      this.logger.warn(`Feature not found: ${tier}.${featureKey}`);
      return null;
    }

    // Return null for unlimited features (limitValue is null or -1)
    if (feature.limitValue === null || feature.limitValue === -1) {
      return null; // Unlimited
    }

    return feature.limitValue;
  }

  /**
   * Check if a boolean feature is enabled for a tier
   */
  async isFeatureEnabled(
    tier: EventTier,
    featureKey: string,
  ): Promise<boolean> {
    const feature = await this.creditRepository.getFeature(tier, featureKey);
    if (!feature) {
      return false;
    }

    // For boolean features, limitValue of 1 means enabled
    return feature.limitValue === 1;
  }

  /**
   * Get tier comparison for pricing page
   */
  async getTierComparison(): Promise<TierComparisonResponse> {
    const allFeatures = await this.creditRepository.getAllFeatures();

    // Group features by key
    const featureMap = new Map<string, {
      featureName: string;
      description: string | null;
      basicValue: number | null;
      premiumValue: number | null;
      isHighlighted: boolean;
      sortOrder: number;
    }>();

    for (const feature of allFeatures) {
      const existing = featureMap.get(feature.featureKey) || {
        featureName: feature.featureName,
        description: feature.description,
        basicValue: null,
        premiumValue: null,
        isHighlighted: feature.isHighlighted,
        sortOrder: feature.sortOrder,
      };

      if (feature.tier === EventTier.BASIC) {
        existing.basicValue = feature.limitValue;
      } else {
        existing.premiumValue = feature.limitValue;
      }

      featureMap.set(feature.featureKey, existing);
    }

    // Convert to response format
    const features = Array.from(featureMap.entries())
      .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
      .map(([featureKey, data]) => ({
        featureKey,
        featureName: data.featureName,
        description: data.description,
        basicValue: this.formatFeatureValue(data.basicValue),
        premiumValue: this.formatFeatureValue(data.premiumValue),
        isHighlighted: data.isHighlighted,
      }));

    return { features };
  }

  private formatFeatureValue(value: number | null): string {
    if (value === null || value === -1) return 'Unlimited';
    if (value === 0) return 'No';
    if (value === 1) return 'Yes';
    return value.toLocaleString('en-IN');
  }

  // ============================================================================
  // Transaction History
  // ============================================================================

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    transactions: EventCreditTransaction[];
    total: number;
  }> {
    const [transactions, total] = await Promise.all([
      this.creditRepository.getTransactionHistory(userId, limit, offset),
      this.creditRepository.countUserTransactions(userId),
    ]);

    return { transactions, total };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    totalSpent: number;
    eventsCreated: number;
    creditsPurchased: number;
  }> {
    const [totalSpent, eventsCreated] = await Promise.all([
      this.creditRepository.getTotalSpentByUser(userId),
      this.creditRepository.getEventsCreditedByUser(userId),
    ]);

    const purchaseTransactions = await this.creditRepository.getTransactionsByType(
      userId,
      EventCreditTransactionType.PURCHASE,
    );

    const creditsPurchased = purchaseTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    return {
      totalSpent,
      eventsCreated,
      creditsPurchased,
    };
  }
}
