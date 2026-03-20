// ============================================================================
// SUBSCRIPTION SERVICE - Subscription Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { SubscriptionPlanService } from './subscription-plan.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionStatus,
} from '../dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planService: SubscriptionPlanService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateSubscriptionDto) {
    this.logger.log(`Creating subscription for vendor: ${dto.vendorProfileId}`);

    // Verify plan exists and is active
    const plan = await this.planService.findById(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    const price = (plan as any).prices?.find((p: any) => p.id === dto.priceId);
    if (!price) {
      throw new BadRequestException(
        'Selected price is not available for this plan',
      );
    }

    // Check if vendor already has an active subscription
    const existing =
      await this.subscriptionRepository.findActiveByVendorProfile(
        dto.vendorProfileId,
      );
    if (existing) {
      throw new BadRequestException(
        'Vendor already has an active subscription. Please upgrade or cancel first.',
      );
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, price.billingCycle);

    const subscription = await this.subscriptionRepository.create({
      vendorProfile: { connect: { id: dto.vendorProfileId } },
      plan: { connect: { id: dto.planId } },
      price: { connect: { id: dto.priceId } },
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentMethods: dto.paymentMethodId
        ? { connect: { id: dto.paymentMethodId } }
        : undefined,
    });

    this.eventEmitter.emit('subscription.created', {
      subscriptionId: subscription.id,
      vendorProfileId: dto.vendorProfileId,
      planId: dto.planId,
    });

    return subscription;
  }

  async findById(id: string) {
    const subscription = await this.subscriptionRepository.findById(id, {
      plan: {
        include: {
          features: true,
          prices: true,
        },
      },
      price: true,
      paymentMethods: true,
      invoices: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async findByVendorProfile(vendorProfileId: string) {
    return this.subscriptionRepository.findByVendorProfile(vendorProfileId);
  }

  async findActiveByVendorProfile(vendorProfileId: string) {
    return this.subscriptionRepository.findActiveByVendorProfile(
      vendorProfileId,
    );
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.findById(id);

    // Handle plan change (upgrade/downgrade)
    if (dto.planId && dto.planId !== subscription.planId) {
      await this.planService.findById(dto.planId);

      this.eventEmitter.emit('subscription.plan-changed', {
        subscriptionId: id,
        oldPlanId: subscription.planId,
        newPlanId: dto.planId,
      });
    }

    return this.subscriptionRepository.update(id, {
      plan: dto.planId ? { connect: { id: dto.planId } } : undefined,
      price: dto.priceId ? { connect: { id: dto.priceId } } : undefined,
      cancelAtPeriodEnd: dto.cancelAtPeriodEnd,
    });
  }

  async cancel(id: string, dto: CancelSubscriptionDto) {
    const subscription = await this.findById(id);

    if (subscription.status === 'CANCELLED') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updateData: any = {
      cancelledAt: new Date(),
    };

    if (dto.immediate) {
      updateData.status = 'CANCELLED';
      updateData.currentPeriodEnd = new Date();
    } else {
      updateData.cancelAtPeriodEnd = true;
    }

    const updated = await this.subscriptionRepository.update(id, updateData);

    // Record cancellation reason
    await this.subscriptionRepository.createStatusHistory(id, {
      fromStatus: subscription.status,
      toStatus: dto.immediate ? 'CANCELLED' : subscription.status,
      reason: dto.reason,
    });

    this.eventEmitter.emit('subscription.cancelled', {
      subscriptionId: id,
      vendorProfileId: subscription.vendorProfileId,
      immediate: dto.immediate,
      reason: dto.reason,
    });

    return updated;
  }

  async reactivate(id: string) {
    const subscription = await this.findById(id);

    if (
      subscription.status !== 'CANCELLED' &&
      !subscription.cancelAtPeriodEnd
    ) {
      throw new BadRequestException('Subscription is not cancelled');
    }

    return this.subscriptionRepository.update(id, {
      status: 'ACTIVE',
      cancelledAt: null,
      cancelAtPeriodEnd: false,
    });
  }

  async pause(id: string) {
    const subscription = await this.findById(id);

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    const updated = await this.subscriptionRepository.update(id, {
      status: 'PAUSED',
    });

    this.eventEmitter.emit('subscription.paused', { subscriptionId: id });
    return updated;
  }

  async resume(id: string) {
    const subscription = await this.findById(id);

    if (subscription.status !== 'PAUSED') {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    const updated = await this.subscriptionRepository.update(id, {
      status: 'ACTIVE',
    });

    this.eventEmitter.emit('subscription.resumed', { subscriptionId: id });
    return updated;
  }

  /**
   * Get usage details for a subscription
   * Returns usage records for metered features
   */
  async getUsageDetails(subscriptionId: string) {
    const usageRecords = await this.subscriptionRepository.getUsageRecords(subscriptionId);

    return usageRecords.map((record: any) => ({
      featureKey: record.featureKey,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      usageCount: record.usageCount,
      usageLimit: record.usageLimit,
      percentUsed: record.usageLimit
        ? Math.round((record.usageCount / record.usageLimit) * 100)
        : null,
      isOverLimit: record.usageLimit
        ? record.usageCount > record.usageLimit
        : false,
    }));
  }

  async renewSubscription(id: string) {
    const subscription = (await this.findById(id)) as any;

    const newPeriodStart = subscription.currentPeriodEnd;
    const billingCycle = subscription.price?.billingCycle || 'MONTHLY';
    const newPeriodEnd = this.calculatePeriodEnd(newPeriodStart, billingCycle);

    const updated = await this.subscriptionRepository.update(id, {
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      status: 'ACTIVE',
    });

    this.eventEmitter.emit('subscription.renewed', { subscriptionId: id });
    return updated;
  }

  // ============================================================================
  // WEBHOOK SUPPORT METHODS
  // ============================================================================

  /**
   * Activate subscription after successful payment (called from webhook)
   * @param vendorProfileId - Vendor profile ID
   * @param planId - Plan ID to activate
   * @param paymentId - Gateway payment ID for reference
   */
  async activateAfterPayment(
    vendorProfileId: string,
    planId: string,
    paymentId: string,
  ) {
    this.logger.log(
      `Activating subscription for vendor ${vendorProfileId} after payment ${paymentId}`,
    );

    // Check if vendor already has a subscription
    const existing =
      await this.subscriptionRepository.findActiveByVendorProfile(
        vendorProfileId,
      );

    // Verify plan exists
    const plan = await this.planService.findById(planId);
    if (!plan) {
      throw new NotFoundException(`Plan not found: ${planId}`);
    }

    const planWithPrices = plan as any;
    // Get the default price (first monthly price or first price)
    const price =
      planWithPrices.prices?.find((p: any) => p.billingCycle === 'MONTHLY') ||
      planWithPrices.prices?.[0];

    if (!price) {
      throw new BadRequestException('No price found for plan');
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, price.billingCycle);

    if (existing) {
      // Update existing subscription (upgrade scenario)
      this.logger.log(`Upgrading existing subscription ${existing.id}`);

      const updated = await this.subscriptionRepository.update(existing.id, {
        plan: { connect: { id: planId } },
        price: { connect: { id: price.id } },
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });

      this.eventEmitter.emit('subscription.activated-after-payment', {
        subscriptionId: updated.id,
        vendorProfileId,
        planId,
        paymentId,
        isUpgrade: true,
      });

      return updated;
    }

    // Create new subscription
    const subscription = await this.subscriptionRepository.create({
      vendorProfile: { connect: { id: vendorProfileId } },
      plan: { connect: { id: planId } },
      price: { connect: { id: price.id } },
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    this.eventEmitter.emit('subscription.activated-after-payment', {
      subscriptionId: subscription.id,
      vendorProfileId,
      planId,
      paymentId,
      isUpgrade: false,
    });

    return subscription;
  }

  private calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
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
}
