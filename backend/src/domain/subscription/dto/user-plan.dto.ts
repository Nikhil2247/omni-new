// ============================================================================
// USER PLAN DTOs - User Subscription Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  UserPlanTier,
  FeatureLimitType,
  BillingCycle,
} from '@prisma/client';

// Note: FeatureLimitType and BillingCycle are already exported from subscription-plan.dto.ts
// Only re-export UserPlanTier which is specific to user plans
export { UserPlanTier };

// ============================================================================
// Feature DTOs
// ============================================================================

export class CreateUserPlanFeatureDto {
  @ApiProperty({ description: 'Feature key (unique identifier)' })
  @IsString()
  featureKey: string;

  @ApiProperty({ description: 'Feature name (for display)' })
  @IsString()
  featureName: string;

  @ApiPropertyOptional({ description: 'Feature description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Limit type', enum: FeatureLimitType })
  @IsEnum(FeatureLimitType)
  limitType: FeatureLimitType;

  @ApiPropertyOptional({ description: 'Limit value (null for unlimited)' })
  @IsOptional()
  @IsNumber()
  limitValue?: number;

  @ApiPropertyOptional({
    description: 'Highlight this feature',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isHighlighted?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateUserPlanPriceDto {
  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Price amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Stripe price ID' })
  @IsOptional()
  @IsString()
  stripePriceId?: string;

  @ApiPropertyOptional({ description: 'Razorpay plan ID' })
  @IsOptional()
  @IsString()
  razorpayPlanId?: string;
}

// ============================================================================
// Plan DTOs
// ============================================================================

export class CreateUserPlanDto {
  @ApiProperty({ description: 'Plan name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Plan tier', enum: UserPlanTier })
  @IsEnum(UserPlanTier)
  tier: UserPlanTier;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Plan features',
    type: [CreateUserPlanFeatureDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateUserPlanFeatureDto)
  features: CreateUserPlanFeatureDto[];

  @ApiProperty({ description: 'Plan prices', type: [CreateUserPlanPriceDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateUserPlanPriceDto)
  prices: CreateUserPlanPriceDto[];

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is plan popular', default: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ description: 'Trial days', default: 0 })
  @IsOptional()
  @IsNumber()
  trialDays?: number;

  @ApiPropertyOptional({ description: 'Is plan active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is plan public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateUserPlanDto {
  @ApiPropertyOptional({ description: 'Plan name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is plan popular' })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ description: 'Trial days' })
  @IsOptional()
  @IsNumber()
  trialDays?: number;

  @ApiPropertyOptional({ description: 'Is plan active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is plan public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class UserPlanFeatureResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  featureKey: string;

  @ApiProperty()
  featureName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: FeatureLimitType })
  limitType: FeatureLimitType;

  @ApiPropertyOptional()
  limitValue?: number;

  @ApiProperty()
  isHighlighted: boolean;

  @ApiProperty()
  sortOrder: number;
}

export class UserPlanPriceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BillingCycle })
  billingCycle: BillingCycle;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  stripePriceId?: string;

  @ApiPropertyOptional()
  razorpayPlanId?: string;

  @ApiProperty()
  isActive: boolean;
}

export class UserPlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: UserPlanTier })
  tier: UserPlanTier;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isPopular: boolean;

  @ApiProperty()
  trialDays: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [UserPlanFeatureResponseDto] })
  features?: UserPlanFeatureResponseDto[];

  @ApiProperty({ type: [UserPlanPriceResponseDto] })
  prices?: UserPlanPriceResponseDto[];
}

// ============================================================================
// Display DTOs (for pricing page)
// ============================================================================

export class UserPlanPriceDisplayDto {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  formattedPrice: string;
}

export class UserPlanFeatureDisplayDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: FeatureLimitType })
  limitType: FeatureLimitType;

  @ApiPropertyOptional()
  limitValue?: number;

  @ApiProperty()
  isHighlighted: boolean;

  @ApiProperty({ description: 'Formatted display value (e.g., "50", "Unlimited")' })
  displayValue: string;
}

export class UserPlanDisplayDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: UserPlanTier })
  tier: UserPlanTier;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isPopular: boolean;

  @ApiProperty()
  trialDays: number;

  @ApiPropertyOptional({ type: UserPlanPriceDisplayDto })
  monthlyPrice?: UserPlanPriceDisplayDto | null;

  @ApiProperty({ type: [UserPlanFeatureDisplayDto] })
  features: UserPlanFeatureDisplayDto[];

  @ApiProperty({ description: 'All available prices for this plan' })
  allPrices: Array<{
    id: string;
    billingCycle: string;
    amount: number;
    currency: string;
    formattedPrice: string;
  }>;
}

// ============================================================================
// Plan Comparison DTOs
// ============================================================================

export class PlanComparisonFeatureDto {
  @ApiProperty()
  featureKey: string;

  @ApiProperty()
  featureName: string;

  @ApiProperty({ description: 'Value in FREE tier' })
  freeValue: string;

  @ApiProperty({ description: 'Value in BASIC tier' })
  basicValue: string;

  @ApiProperty({ description: 'Value in PREMIUM tier' })
  premiumValue: string;
}

export class PlansComparisonResponseDto {
  @ApiProperty({ type: [UserPlanDisplayDto] })
  plans: UserPlanDisplayDto[];

  @ApiProperty({ type: [PlanComparisonFeatureDto] })
  featureComparison: PlanComparisonFeatureDto[];
}
