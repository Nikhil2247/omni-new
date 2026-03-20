// ============================================================================
// USER SUBSCRIPTION PLAN SERVICE - User Subscription Domain
// ============================================================================
// Service for managing user subscription plans (FREE, BASIC, PREMIUM)

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserPlanRepository } from '../repositories/user-plan.repository';
import {
  CreateUserPlanDto,
  UpdateUserPlanDto,
  UserPlanDisplayDto,
} from '../dto/user-plan.dto';
import { UserPlanTier } from '@prisma/client';

@Injectable()
export class UserSubscriptionPlanService {
  private readonly logger = new Logger(UserSubscriptionPlanService.name);

  constructor(
    private readonly planRepository: UserPlanRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new user subscription plan
   */
  async create(dto: CreateUserPlanDto) {
    this.logger.log(`Creating user subscription plan: ${dto.name}`);

    // Generate slug from name
    const slug = dto.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const plan = await this.planRepository.create({
      name: dto.name,
      slug,
      tier: dto.tier,
      description: dto.description,
      displayOrder: dto.displayOrder ?? 0,
      isPopular: dto.isPopular ?? false,
      trialDays: dto.trialDays ?? 0,
      isActive: dto.isActive ?? true,
      isPublic: dto.isPublic ?? true,
      features: {
        create: dto.features.map((f) => ({
          featureKey: f.featureKey,
          featureName: f.featureName,
          description: f.description,
          limitType: f.limitType,
          limitValue: f.limitValue,
          isHighlighted: f.isHighlighted ?? false,
          sortOrder: f.sortOrder ?? 0,
        })),
      },
      prices: {
        create: dto.prices.map((p) => ({
          billingCycle: p.billingCycle,
          amount: p.amount,
          currency: p.currency,
          stripePriceId: p.stripePriceId,
          razorpayPlanId: p.razorpayPlanId,
        })),
      },
    });

    this.eventEmitter.emit('user-plan.created', { planId: plan.id });
    return plan;
  }

  /**
   * Find all plans
   */
  async findAll(includeInactive = false) {
    return this.planRepository.findAll(includeInactive);
  }

  /**
   * Find plan by ID
   */
  async findById(id: string) {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new NotFoundException('User subscription plan not found');
    }

    return plan;
  }

  /**
   * Find plan by tier
   */
  async findByTier(tier: UserPlanTier) {
    const plan = await this.planRepository.findByTier(tier);

    if (!plan) {
      throw new NotFoundException(`Plan for tier ${tier} not found`);
    }

    return plan;
  }

  /**
   * Find plan by slug
   */
  async findBySlug(slug: string) {
    const plan = await this.planRepository.findBySlug(slug);

    if (!plan) {
      throw new NotFoundException(`Plan with slug ${slug} not found`);
    }

    return plan;
  }

  /**
   * Find all public (displayable) plans
   */
  async findPublicPlans() {
    return this.planRepository.findPublicPlans();
  }

  /**
   * Get plans formatted for display (pricing page)
   */
  async getPlansForDisplay(): Promise<UserPlanDisplayDto[]> {
    const plans = await this.findPublicPlans();

    return plans.map((plan) => {
      const planWithRelations = plan as any;
      const monthlyPrice = planWithRelations.prices?.find(
        (p: any) => p.billingCycle === 'MONTHLY',
      );

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        tier: plan.tier,
        description: plan.description ?? undefined,
        displayOrder: plan.displayOrder,
        isPopular: plan.isPopular,
        trialDays: plan.trialDays,
        monthlyPrice: monthlyPrice
          ? {
              amount: Number(monthlyPrice.amount),
              currency: monthlyPrice.currency,
              formattedPrice: this.formatPrice(
                Number(monthlyPrice.amount),
                monthlyPrice.currency,
              ),
            }
          : null,
        features: planWithRelations.features?.map((f: any) => ({
          key: f.featureKey,
          name: f.featureName,
          description: f.description,
          limitType: f.limitType,
          limitValue: f.limitValue,
          isHighlighted: f.isHighlighted,
          displayValue: this.formatFeatureLimit(f.limitType, f.limitValue),
        })),
        allPrices: planWithRelations.prices?.map((p: any) => ({
          id: p.id,
          billingCycle: p.billingCycle,
          amount: Number(p.amount),
          currency: p.currency,
          formattedPrice: this.formatPrice(Number(p.amount), p.currency),
        })),
      };
    });
  }

  /**
   * Update a plan
   */
  async update(id: string, dto: UpdateUserPlanDto) {
    await this.findById(id);

    const updated = await this.planRepository.update(id, {
      name: dto.name,
      description: dto.description,
      displayOrder: dto.displayOrder,
      isPopular: dto.isPopular,
      trialDays: dto.trialDays,
      isActive: dto.isActive,
      isPublic: dto.isPublic,
    });

    this.eventEmitter.emit('user-plan.updated', { planId: id });
    return updated;
  }

  /**
   * Deactivate a plan
   */
  async deactivate(id: string) {
    await this.findById(id);
    return this.planRepository.update(id, { isActive: false });
  }

  /**
   * Activate a plan
   */
  async activate(id: string) {
    await this.findById(id);
    return this.planRepository.update(id, { isActive: true });
  }

  /**
   * Get features for a plan
   */
  async getFeatures(planId: string) {
    const plan = await this.findById(planId);
    return (plan as any).features || [];
  }

  /**
   * Get prices for a plan
   */
  async getPrices(planId: string) {
    const plan = await this.findById(planId);
    return (plan as any).prices || [];
  }

  /**
   * Get the FREE tier plan
   */
  async getFreePlan() {
    return this.planRepository.getFreePlan();
  }

  /**
   * Compare two plans (for upgrade/downgrade)
   */
  async comparePlans(currentPlanId: string, targetPlanId: string) {
    const [currentPlan, targetPlan] = await Promise.all([
      this.findById(currentPlanId),
      this.findById(targetPlanId),
    ]);

    const tierOrder = { FREE: 0, BASIC: 1, PREMIUM: 2 };
    const currentTierOrder = tierOrder[currentPlan.tier] ?? 0;
    const targetTierOrder = tierOrder[targetPlan.tier] ?? 0;

    return {
      currentPlan,
      targetPlan,
      isUpgrade: targetTierOrder > currentTierOrder,
      isDowngrade: targetTierOrder < currentTierOrder,
      isSameTier: targetTierOrder === currentTierOrder,
    };
  }

  /**
   * Format price for display
   */
  private formatPrice(amount: number, currency: string): string {
    if (amount === 0) {
      return 'Free';
    }

    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(amount);
  }

  /**
   * Format feature limit for display
   */
  private formatFeatureLimit(limitType: string, limitValue?: number): string {
    switch (limitType) {
      case 'UNLIMITED':
        return 'Unlimited';
      case 'BOOLEAN':
        return limitValue ? 'Included' : 'Not included';
      case 'COUNT':
      case 'COUNT_PER_EVENT':
        return limitValue?.toString() ?? '0';
      default:
        return limitValue?.toString() ?? '-';
    }
  }
}
