// ============================================================================
// VENDOR PLANS CONTROLLER - Plans API
// ============================================================================
// Public endpoints for displaying vendor subscription plan pricing
// ============================================================================

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { SubscriptionPlanService } from '../../../domain/subscription/services/subscription-plan.service';
import {
  SubscriptionPlanResponseDto,
  PlanTier,
  FeatureLimitType,
  BillingCycle,
} from '../../../domain/subscription/dto/subscription-plan.dto';

// Display DTOs for pricing page
class VendorPlanFeatureDisplayDto {
  key: string;
  name: string;
  description?: string;
  limitType: FeatureLimitType;
  limitValue?: number;
  isHighlighted: boolean;
  displayValue: string;
  sortOrder: number;
}

class VendorPlanPriceDisplayDto {
  id: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  formattedPrice: string;
  savingsPercent?: number;
}

class VendorPlanDisplayDto {
  id: string;
  name: string;
  slug: string;
  tier: PlanTier;
  description?: string;
  displayOrder: number;
  isPopular: boolean;
  trialDays: number;
  monthlyPrice?: number;
  features: VendorPlanFeatureDisplayDto[];
  allPrices: VendorPlanPriceDisplayDto[];
}

class VendorPlansComparisonFeatureDto {
  featureKey: string;
  featureName: string;
  freeValue: string;
  starterValue: string;
  professionalValue: string;
  enterpriseValue: string;
}

class VendorPlansComparisonResponseDto {
  plans: VendorPlanDisplayDto[];
  featureComparison: VendorPlansComparisonFeatureDto[];
}

@Controller('plans/vendor')
@ApiTags('Vendor Plans')
@Public()
export class VendorPlansController {
  constructor(
    private readonly planService: SubscriptionPlanService,
  ) {}

  /**
   * Get all available vendor subscription plans
   * Returns plans formatted for display on the pricing page
   */
  @Get()
  @ApiOperation({ summary: 'Get all available vendor plans' })
  @ApiResponse({
    status: 200,
    description: 'List of available vendor subscription plans',
    type: [VendorPlanDisplayDto],
  })
  async getAvailablePlans(): Promise<VendorPlanDisplayDto[]> {
    const plans = await this.planService.findActive();
    return this.transformToDisplayDtos(plans);
  }

  /**
   * Get plans comparison for pricing page
   * Returns all plans with a side-by-side feature comparison
   */
  @Get('compare')
  @ApiOperation({ summary: 'Get plans comparison for pricing page' })
  @ApiResponse({
    status: 200,
    description: 'Plans comparison data for pricing page',
    type: VendorPlansComparisonResponseDto,
  })
  async comparePlans(): Promise<VendorPlansComparisonResponseDto> {
    const plans = await this.planService.findActive();
    const displayPlans = this.transformToDisplayDtos(plans);

    // Build feature comparison across tiers
    const featureMap = new Map<
      string,
      {
        featureKey: string;
        featureName: string;
        free: string;
        starter: string;
        professional: string;
        enterprise: string;
      }
    >();

    // Collect all unique features from all plans
    for (const plan of displayPlans) {
      for (const feature of plan.features || []) {
        if (!featureMap.has(feature.key)) {
          featureMap.set(feature.key, {
            featureKey: feature.key,
            featureName: feature.name,
            free: '-',
            starter: '-',
            professional: '-',
            enterprise: '-',
          });
        }

        const entry = featureMap.get(feature.key)!;
        const displayValue = feature.displayValue || '-';

        switch (plan.tier) {
          case PlanTier.FREE:
            entry.free = displayValue;
            break;
          case PlanTier.STARTER:
            entry.starter = displayValue;
            break;
          case PlanTier.PROFESSIONAL:
            entry.professional = displayValue;
            break;
          case PlanTier.ENTERPRISE:
            entry.enterprise = displayValue;
            break;
        }
      }
    }

    // Convert map to array
    const featureComparison: VendorPlansComparisonFeatureDto[] = Array.from(
      featureMap.values(),
    ).map((entry) => ({
      featureKey: entry.featureKey,
      featureName: entry.featureName,
      freeValue: entry.free,
      starterValue: entry.starter,
      professionalValue: entry.professional,
      enterpriseValue: entry.enterprise,
    }));

    return {
      plans: displayPlans,
      featureComparison,
    };
  }

  /**
   * Get specific plan details by ID
   */
  @Get(':planId')
  @ApiOperation({ summary: 'Get plan details' })
  @ApiParam({
    name: 'planId',
    description: 'The unique identifier of the plan',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Plan details retrieved successfully',
    type: SubscriptionPlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async getPlanDetails(
    @Param('planId') planId: string,
  ): Promise<SubscriptionPlanResponseDto> {
    try {
      const plan = await this.planService.findById(planId);
      return plan as SubscriptionPlanResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Plan not found');
    }
  }

  /**
   * Transform database plans to display DTOs
   */
  private transformToDisplayDtos(plans: any[]): VendorPlanDisplayDto[] {
    return plans
      .filter((plan) => plan.isPublic)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((plan) => {
        const features: VendorPlanFeatureDisplayDto[] = (plan.features || [])
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((f: any) => ({
            key: f.featureKey,
            name: f.featureName,
            description: f.description,
            limitType: f.limitType,
            limitValue: f.limitValue,
            isHighlighted: f.isHighlighted,
            sortOrder: f.sortOrder,
            displayValue: this.formatFeatureValue(f.limitType, f.limitValue),
          }));

        const allPrices: VendorPlanPriceDisplayDto[] = (plan.prices || [])
          .filter((p: any) => p.isActive !== false)
          .map((p: any) => ({
            id: p.id,
            billingCycle: p.billingCycle,
            amount: Number(p.amount),
            currency: p.currency,
            formattedPrice: this.formatPrice(Number(p.amount), p.currency),
            savingsPercent: p.savingsPercent,
          }));

        const monthlyPrice = allPrices.find(
          (p) => p.billingCycle === BillingCycle.MONTHLY,
        );

        return {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          tier: plan.tier,
          description: plan.description,
          displayOrder: plan.displayOrder,
          isPopular: plan.isPopular,
          trialDays: plan.trialDays,
          monthlyPrice: monthlyPrice?.amount,
          features,
          allPrices,
        };
      });
  }

  private formatFeatureValue(
    limitType: FeatureLimitType,
    limitValue?: number,
  ): string {
    switch (limitType) {
      case FeatureLimitType.BOOLEAN:
        return limitValue === 1 ? 'Yes' : 'No';
      case FeatureLimitType.UNLIMITED:
        return 'Unlimited';
      case FeatureLimitType.COUNT:
      case FeatureLimitType.COUNT_PER_MONTH:
      case FeatureLimitType.COUNT_PER_YEAR:
        return limitValue?.toString() || '0';
      default:
        return '-';
    }
  }

  private formatPrice(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  }
}
