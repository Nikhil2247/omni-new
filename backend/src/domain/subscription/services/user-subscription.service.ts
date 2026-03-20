// ============================================================================
// USER SUBSCRIPTION SERVICE - User Subscription Domain
// ============================================================================
// Service for managing user subscriptions (create, upgrade, downgrade, cancel)

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UserSubscriptionRepository } from '../repositories/user-subscription.repository';
import { UserSubscriptionPlanService } from './user-subscription-plan.service';
import {
  CreateUserSubscriptionDto,
  UpdateUserSubscriptionDto,
  CancelUserSubscriptionDto,
  UpgradeUserSubscriptionDto,
} from '../dto/user-subscription.dto';
import { SubscriptionStatus, UserPlanTier } from '@prisma/client';

@Injectable()
export class UserSubscriptionService {
  private readonly logger = new Logger(UserSubscriptionService.name);

  constructor(
    private readonly subscriptionRepository: UserSubscriptionRepository,
    private readonly planService: UserSubscriptionPlanService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new user subscription
   */
  async create(dto: CreateUserSubscriptionDto) {
    this.logger.log(`Creating subscription for user: ${dto.userId}`);

    // Verify plan exists and is active
    const plan = await this.planService.findById(dto.planId);
    if (!(plan as any).isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    // Verify price exists and belongs to plan
    const planWithPrices = plan as any;
    const price = planWithPrices.prices?.find((p: any) => p.id === dto.priceId);
    if (!price) {
      throw new BadRequestException(
        'Selected price is not available for this plan',
      );
    }

    // Check if user already has a subscription
    const existing = await this.subscriptionRepository.findByUserId(dto.userId);
    if (existing) {
      throw new BadRequestException(
        'User already has a subscription. Please upgrade or cancel first.',
      );
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, price.billingCycle);

    // Handle trial period
    let status: SubscriptionStatus = 'ACTIVE';
    let trialEnd: Date | null = null;

    if (plan.trialDays > 0 && plan.tier !== 'FREE') {
      status = 'TRIALING';
      trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
    }

    const subscription = await this.subscriptionRepository.create({
      user: { connect: { id: dto.userId } },
      plan: { connect: { id: dto.planId } },
      price: { connect: { id: dto.priceId } },
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEnd,
    });

    this.eventEmitter.emit('user-subscription.created', {
      subscriptionId: subscription.id,
      userId: dto.userId,
      planId: dto.planId,
      tier: plan.tier,
    });

    return subscription;
  }

  /**
   * Find subscription by ID
   */
  async findById(id: string) {
    const subscription = await this.subscriptionRepository.findById(id);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  /**
   * Find subscription by user ID
   */
  async findByUserId(userId: string) {
    return this.subscriptionRepository.findByUserId(userId);
  }

  /**
   * Find active subscription by user ID
   */
  async findActiveByUserId(userId: string) {
    return this.subscriptionRepository.findActiveByUserId(userId);
  }

  /**
   * Update a subscription
   */
  async update(id: string, dto: UpdateUserSubscriptionDto) {
    const subscription = await this.findById(id);

    return this.subscriptionRepository.update(id, {
      cancelAtPeriodEnd: dto.cancelAtPeriodEnd,
      autoRenew: dto.autoRenew,
    });
  }

  /**
   * Upgrade user subscription to a higher tier
   */
  async upgrade(userId: string, dto: UpgradeUserSubscriptionDto) {
    this.logger.log(`Upgrading subscription for user: ${userId}`);

    const currentSubscription =
      await this.subscriptionRepository.findActiveByUserId(userId);
    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Verify target plan
    const targetPlan = await this.planService.findById(dto.targetPlanId);
    const targetPlanWithPrices = targetPlan as any;

    // Compare plans
    const comparison = await this.planService.comparePlans(
      currentSubscription.planId,
      dto.targetPlanId,
    );

    if (!comparison.isUpgrade) {
      throw new BadRequestException(
        'Target plan is not an upgrade. Use downgrade instead.',
      );
    }

    // Get target price
    const targetPrice = targetPlanWithPrices.prices?.find(
      (p: any) => p.id === dto.targetPriceId,
    );
    if (!targetPrice) {
      throw new BadRequestException(
        'Selected price is not available for target plan',
      );
    }

    // Calculate new period (immediate upgrade)
    const now = new Date();
    const newPeriodEnd = this.calculatePeriodEnd(now, targetPrice.billingCycle);

    const updated = await this.subscriptionRepository.update(
      currentSubscription.id,
      {
        plan: { connect: { id: dto.targetPlanId } },
        price: { connect: { id: dto.targetPriceId } },
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      },
    );

    this.eventEmitter.emit('user-subscription.upgraded', {
      subscriptionId: currentSubscription.id,
      userId,
      fromPlanId: currentSubscription.planId,
      toPlanId: dto.targetPlanId,
      fromTier: comparison.currentPlan.tier,
      toTier: comparison.targetPlan.tier,
    });

    return updated;
  }

  /**
   * Downgrade user subscription to a lower tier
   */
  async downgrade(userId: string, dto: UpgradeUserSubscriptionDto) {
    this.logger.log(`Downgrading subscription for user: ${userId}`);

    const currentSubscription =
      await this.subscriptionRepository.findActiveByUserId(userId);
    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Verify target plan
    const targetPlan = await this.planService.findById(dto.targetPlanId);
    const targetPlanWithPrices = targetPlan as any;

    // Compare plans
    const comparison = await this.planService.comparePlans(
      currentSubscription.planId,
      dto.targetPlanId,
    );

    if (!comparison.isDowngrade) {
      throw new BadRequestException(
        'Target plan is not a downgrade. Use upgrade instead.',
      );
    }

    // Get target price
    const targetPrice = targetPlanWithPrices.prices?.find(
      (p: any) => p.id === dto.targetPriceId,
    );
    if (!targetPrice) {
      throw new BadRequestException(
        'Selected price is not available for target plan',
      );
    }

    // Downgrade takes effect at end of current period
    const updated = await this.subscriptionRepository.update(
      currentSubscription.id,
      {
        scheduledPlanId: dto.targetPlanId,
        scheduledPriceId: dto.targetPriceId,
      },
    );

    this.eventEmitter.emit('user-subscription.downgrade-scheduled', {
      subscriptionId: currentSubscription.id,
      userId,
      fromPlanId: currentSubscription.planId,
      toPlanId: dto.targetPlanId,
      effectiveAt: currentSubscription.currentPeriodEnd,
    });

    return updated;
  }

  /**
   * Cancel user subscription
   */
  async cancel(userId: string, dto: CancelUserSubscriptionDto) {
    this.logger.log(`Cancelling subscription for user: ${userId}`);

    const subscription =
      await this.subscriptionRepository.findActiveByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.status === 'CANCELLED') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updateData: any = {
      cancelledAt: new Date(),
      cancellationReason: dto.reason,
    };

    if (dto.immediate) {
      // Immediate cancellation
      updateData.status = 'CANCELLED';
      updateData.currentPeriodEnd = new Date();
    } else {
      // Cancel at end of period
      updateData.cancelAtPeriodEnd = true;
    }

    const updated = await this.subscriptionRepository.update(
      subscription.id,
      updateData,
    );

    this.eventEmitter.emit('user-subscription.cancelled', {
      subscriptionId: subscription.id,
      userId,
      immediate: dto.immediate,
      reason: dto.reason,
    });

    return updated;
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivate(userId: string) {
    this.logger.log(`Reactivating subscription for user: ${userId}`);

    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    if (
      subscription.status !== 'CANCELLED' &&
      !subscription.cancelAtPeriodEnd
    ) {
      throw new BadRequestException('Subscription is not cancelled');
    }

    // Check if subscription period has expired
    if (
      subscription.status === 'CANCELLED' &&
      new Date() > subscription.currentPeriodEnd
    ) {
      throw new BadRequestException(
        'Subscription period has expired. Please create a new subscription.',
      );
    }

    const updated = await this.subscriptionRepository.update(subscription.id, {
      status: 'ACTIVE',
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      cancellationReason: null,
    });

    this.eventEmitter.emit('user-subscription.reactivated', {
      subscriptionId: subscription.id,
      userId,
    });

    return updated;
  }

  /**
   * Renew subscription for a new period
   */
  async renewSubscription(subscriptionId: string) {
    this.logger.log(`Renewing subscription: ${subscriptionId}`);

    const subscription = (await this.findById(subscriptionId)) as any;

    // Check if there's a scheduled plan change
    if (subscription.scheduledPlanId && subscription.scheduledPriceId) {
      // Apply the scheduled plan change
      const newPeriodStart = subscription.currentPeriodEnd;
      const newPeriodEnd = this.calculatePeriodEnd(
        newPeriodStart,
        subscription.price?.billingCycle || 'MONTHLY',
      );

      const updated = await this.subscriptionRepository.update(subscriptionId, {
        plan: { connect: { id: subscription.scheduledPlanId } },
        price: { connect: { id: subscription.scheduledPriceId } },
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        scheduledPlanId: null,
        scheduledPriceId: null,
        status: 'ACTIVE',
      });

      this.eventEmitter.emit('user-subscription.plan-changed', {
        subscriptionId,
        fromPlanId: subscription.planId,
        toPlanId: subscription.scheduledPlanId,
      });

      return updated;
    }

    // Normal renewal
    const newPeriodStart = subscription.currentPeriodEnd;
    const billingCycle = subscription.price?.billingCycle || 'MONTHLY';
    const newPeriodEnd = this.calculatePeriodEnd(newPeriodStart, billingCycle);

    const updated = await this.subscriptionRepository.update(subscriptionId, {
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      status: 'ACTIVE',
    });

    this.eventEmitter.emit('user-subscription.renewed', {
      subscriptionId,
      userId: subscription.userId,
    });

    return updated;
  }

  /**
   * Auto-assign FREE plan on user registration
   */
  @OnEvent('user.registered')
  async handleUserRegistered(payload: { userId: string }) {
    this.logger.log(
      `Auto-assigning FREE plan for new user: ${payload.userId}`,
    );

    try {
      // Get FREE plan
      const freePlan = await this.planService.getFreePlan();
      if (!freePlan) {
        this.logger.warn('FREE plan not found. Cannot auto-assign.');
        return;
      }

      // Get monthly price for FREE plan (should be 0)
      const freePlanWithPrices = freePlan as any;
      const freePrice = freePlanWithPrices.prices?.find(
        (p: any) => p.billingCycle === 'MONTHLY',
      );

      if (!freePrice) {
        this.logger.warn('FREE plan price not found. Cannot auto-assign.');
        return;
      }

      // Check if user already has a subscription
      const existing = await this.subscriptionRepository.findByUserId(
        payload.userId,
      );
      if (existing) {
        this.logger.debug('User already has a subscription. Skipping.');
        return;
      }

      // Create FREE subscription
      await this.create({
        userId: payload.userId,
        planId: freePlan.id,
        priceId: freePrice.id,
      });

      this.logger.log(`FREE plan assigned to user: ${payload.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-assign FREE plan: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Calculate period end date based on billing cycle
   */
  calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'LIFETIME':
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
  }

  /**
   * Get user's current tier
   */
  async getUserTier(userId: string): Promise<UserPlanTier | null> {
    const subscription = await this.findActiveByUserId(userId);
    if (!subscription) {
      return null;
    }
    return (subscription as any).plan?.tier ?? null;
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.findActiveByUserId(userId);
    return !!subscription;
  }

  /**
   * Check if user has specific tier or higher
   */
  async hasTierOrHigher(userId: string, requiredTier: UserPlanTier): Promise<boolean> {
    const tierOrder: Record<UserPlanTier, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ENTERPRISE: 3,
    };

    const userTier = await this.getUserTier(userId);
    if (!userTier) {
      return false;
    }

    return tierOrder[userTier] >= tierOrder[requiredTier];
  }

  // ============================================================================
  // WEBHOOK SUPPORT METHODS
  // ============================================================================

  /**
   * Activate subscription after successful payment (called from webhook)
   * @param userId - User ID
   * @param planId - Plan ID to activate
   * @param paymentId - Gateway payment ID for reference
   */
  async activateAfterPayment(
    userId: string,
    planId: string,
    paymentId: string,
  ) {
    this.logger.log(
      `Activating user subscription for user ${userId} after payment ${paymentId}`,
    );

    // Check if user already has a subscription
    const existing = await this.subscriptionRepository.findByUserId(userId);

    // Verify plan exists
    const plan = await this.planService.findById(planId);
    if (!plan) {
      this.logger.error(`Plan not found: ${planId}`);
      throw new Error(`Plan not found: ${planId}`);
    }

    const planWithPrices = plan as any;
    // Get the default price (first monthly price or first price)
    const price =
      planWithPrices.prices?.find((p: any) => p.billingCycle === 'MONTHLY') ||
      planWithPrices.prices?.[0];

    if (!price) {
      this.logger.error('No price found for plan');
      throw new Error('No price found for plan');
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, price.billingCycle);

    if (existing) {
      // Update existing subscription (upgrade scenario)
      this.logger.log(`Upgrading existing user subscription ${existing.id}`);

      const updated = await this.subscriptionRepository.update(existing.id, {
        plan: { connect: { id: planId } },
        price: { connect: { id: price.id } },
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd: null, // End trial if active
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        cancellationReason: null,
      });

      this.eventEmitter.emit('user-subscription.activated-after-payment', {
        subscriptionId: updated.id,
        userId,
        planId,
        paymentId,
        isUpgrade: true,
        previousPlanId: existing.planId,
      });

      return updated;
    }

    // Create new subscription
    const subscription = await this.subscriptionRepository.create({
      user: { connect: { id: userId } },
      plan: { connect: { id: planId } },
      price: { connect: { id: price.id } },
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    this.eventEmitter.emit('user-subscription.activated-after-payment', {
      subscriptionId: subscription.id,
      userId,
      planId,
      paymentId,
      isUpgrade: false,
    });

    return subscription;
  }
}
