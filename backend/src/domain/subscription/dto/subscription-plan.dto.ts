// ============================================================================
// SUBSCRIPTION PLAN DTOs - Subscription Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

export enum PlanTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  LIFETIME = 'LIFETIME',
}

export enum FeatureLimitType {
  BOOLEAN = 'BOOLEAN',
  COUNT = 'COUNT',
  COUNT_PER_MONTH = 'COUNT_PER_MONTH',
  COUNT_PER_YEAR = 'COUNT_PER_YEAR',
  UNLIMITED = 'UNLIMITED',
}

// ============================================================================
// Feature DTOs
// ============================================================================

export class CreatePlanFeatureDto {
  @ApiProperty({ description: 'Feature key (unique)' })
  @IsString()
  featureKey: string

  @ApiProperty({ description: 'Feature name (display)' })
  @IsString()
  featureName: string

  @ApiPropertyOptional({ description: 'Feature description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Limit type', enum: FeatureLimitType })
  @IsEnum(FeatureLimitType)
  limitType: FeatureLimitType

  @ApiPropertyOptional({ description: 'Limit value (null for unlimited)' })
  @IsOptional()
  @IsNumber()
  limitValue?: number

  @ApiPropertyOptional({ description: 'Highlight this feature', default: false })
  @IsOptional()
  @IsBoolean()
  isHighlighted?: boolean

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number
}

export class CreatePlanPriceDto {
  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle

  @ApiProperty({ description: 'Price amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  currency: string

  @ApiPropertyOptional({ description: 'Stripe price ID' })
  @IsOptional()
  @IsString()
  stripePriceId?: string

  @ApiPropertyOptional({ description: 'Razorpay plan ID' })
  @IsOptional()
  @IsString()
  razorpayPlanId?: string
}

// ============================================================================
// Plan DTOs
// ============================================================================

export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Plan name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Plan tier', enum: PlanTier })
  @IsEnum(PlanTier)
  tier: PlanTier

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Plan features', type: [CreatePlanFeatureDto] })
  @ValidateNested({ each: true })
  @Type(() => CreatePlanFeatureDto)
  features: CreatePlanFeatureDto[]

  @ApiProperty({ description: 'Plan prices', type: [CreatePlanPriceDto] })
  @ValidateNested({ each: true })
  @Type(() => CreatePlanPriceDto)
  prices: CreatePlanPriceDto[]

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number

  @ApiPropertyOptional({ description: 'Is plan popular', default: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean

  @ApiPropertyOptional({ description: 'Trial days', default: 0 })
  @IsOptional()
  @IsNumber()
  trialDays?: number

  @ApiPropertyOptional({ description: 'Is plan active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ description: 'Is plan public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ description: 'Plan name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number

  @ApiPropertyOptional({ description: 'Is plan popular' })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean

  @ApiPropertyOptional({ description: 'Trial days' })
  @IsOptional()
  @IsNumber()
  trialDays?: number

  @ApiPropertyOptional({ description: 'Is plan active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ description: 'Is plan public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean
}

export class SubscriptionPlanResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty({ enum: PlanTier })
  tier: PlanTier

  @ApiPropertyOptional()
  description?: string

  @ApiProperty()
  isActive: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  features?: any[]
  prices?: any[]
}
