// ============================================================================
// USER PLANS CONTROLLER - Public API Gateway
// ============================================================================
// Public endpoints for displaying user subscription plan pricing
// ============================================================================

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { UserSubscriptionPlanService } from '../../../domain/subscription/services/user-subscription-plan.service';
import {
  UserPlanResponseDto,
  UserPlanDisplayDto,
  PlansComparisonResponseDto,
  PlanComparisonFeatureDto,
} from '../../../domain/subscription/dto/user-plan.dto';

@Controller('plans/user')
@ApiTags('User Plans')
@Public()
export class UserPlansController {
  constructor(
    private readonly planService: UserSubscriptionPlanService,
  ) {}

  /**
   * Get all available user subscription plans
   * Returns plans formatted for display on the pricing page
   */
  @Get()
  @ApiOperation({ summary: 'Get all available user plans' })
  @ApiResponse({
    status: 200,
    description: 'List of available user subscription plans',
    type: [UserPlanDisplayDto],
  })
  async getAvailablePlans(): Promise<UserPlanDisplayDto[]> {
    return this.planService.getPlansForDisplay();
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
    type: PlansComparisonResponseDto,
  })
  async comparePlans(): Promise<PlansComparisonResponseDto> {
    const plans = await this.planService.getPlansForDisplay();

    // Build feature comparison across tiers
    const featureMap = new Map<
      string,
      { featureKey: string; featureName: string; free: string; basic: string; premium: string }
    >();

    // Collect all unique features from all plans
    for (const plan of plans) {
      for (const feature of plan.features || []) {
        if (!featureMap.has(feature.key)) {
          featureMap.set(feature.key, {
            featureKey: feature.key,
            featureName: feature.name,
            free: '-',
            basic: '-',
            premium: '-',
          });
        }

        const entry = featureMap.get(feature.key)!;
        const displayValue = feature.displayValue || '-';

        switch (plan.tier) {
          case 'FREE':
            entry.free = displayValue;
            break;
          case 'BASIC':
            entry.basic = displayValue;
            break;
          case 'PREMIUM':
            entry.premium = displayValue;
            break;
        }
      }
    }

    // Convert map to array and sort by feature name
    const featureComparison: PlanComparisonFeatureDto[] = Array.from(
      featureMap.values(),
    ).map((entry) => ({
      featureKey: entry.featureKey,
      featureName: entry.featureName,
      freeValue: entry.free,
      basicValue: entry.basic,
      premiumValue: entry.premium,
    }));

    return {
      plans,
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
    type: UserPlanResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plan not found',
  })
  async getPlanDetails(
    @Param('planId') planId: string,
  ): Promise<UserPlanResponseDto> {
    try {
      const plan = await this.planService.findById(planId);
      return plan as UserPlanResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Plan not found');
    }
  }
}
