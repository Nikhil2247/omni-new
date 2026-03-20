// ============================================================================
// USER SUBSCRIPTION DTOs - User Subscription Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';

export enum UserSubscriptionStatus {
  PENDING = 'PENDING',
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAUSED = 'PAUSED',
}

// ============================================================================
// Create/Update DTOs
// ============================================================================

export class CreateUserSubscriptionDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'User subscription plan ID' })
  @IsUUID()
  planId: string;

  @ApiProperty({ description: 'Plan price ID' })
  @IsUUID()
  priceId: string;

  @ApiPropertyOptional({ description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class UpdateUserSubscriptionDto {
  @ApiPropertyOptional({ description: 'Cancel at period end' })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Auto renew subscription' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

export class CancelUserSubscriptionDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Cancel immediately or at period end',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}

export class UpgradeUserSubscriptionDto {
  @ApiProperty({ description: 'Target plan ID to upgrade/downgrade to' })
  @IsUUID()
  targetPlanId: string;

  @ApiProperty({ description: 'Target price ID for the new plan' })
  @IsUUID()
  targetPriceId: string;

  @ApiPropertyOptional({ description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class UserSubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  planId: string;

  @ApiProperty()
  priceId: string;

  @ApiProperty({ enum: UserSubscriptionStatus })
  status: UserSubscriptionStatus;

  @ApiProperty()
  currentPeriodStart: Date;

  @ApiProperty()
  currentPeriodEnd: Date;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional()
  trialEnd?: Date;

  @ApiPropertyOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  cancellationReason?: string;

  @ApiPropertyOptional()
  scheduledPlanId?: string;

  @ApiPropertyOptional()
  scheduledPriceId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  plan?: UserSubscriptionPlanSummaryDto;
  price?: UserPlanPriceSummaryDto;
}

export class UserSubscriptionPlanSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  tier: string;

  @ApiPropertyOptional()
  description?: string;
}

export class UserPlanPriceSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  billingCycle: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;
}

// ============================================================================
// Usage DTOs
// ============================================================================

export class RecordUserUsageDto {
  @ApiProperty({ description: 'Event ID for which usage is being recorded' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ description: 'Feature key being used' })
  @IsString()
  featureKey: string;

  @ApiPropertyOptional({ description: 'Usage quantity', default: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;
}

export class CheckUserFeatureLimitDto {
  @ApiProperty({ description: 'Event ID to check usage against' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ description: 'Feature key to check' })
  @IsString()
  featureKey: string;
}

export class UserFeatureLimitResponseDto {
  @ApiProperty()
  featureKey: string;

  @ApiProperty({ description: 'Maximum allowed usage (-1 for unlimited)' })
  limit: number;

  @ApiProperty({ description: 'Current usage count' })
  used: number;

  @ApiProperty({ description: 'Remaining usage (-1 for unlimited)' })
  remaining: number;

  @ApiProperty({ description: 'Whether this feature has unlimited usage' })
  isUnlimited: boolean;
}

export class EventUsageSummaryResponseDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty({ type: [UserFeatureLimitResponseDto] })
  features: UserFeatureLimitResponseDto[];

  @ApiProperty()
  totalFeaturesUsed: number;
}

// ============================================================================
// Subscription Status DTOs
// ============================================================================

export class UserSubscriptionStatusDto {
  @ApiProperty()
  hasActiveSubscription: boolean;

  @ApiProperty()
  tier: string | null;

  @ApiProperty()
  status: UserSubscriptionStatus | null;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  willRenew?: boolean;

  @ApiPropertyOptional()
  daysUntilExpiration?: number;
}

export class SubscriptionComparisonDto {
  @ApiProperty()
  currentPlanId: string;

  @ApiProperty()
  currentTier: string;

  @ApiProperty()
  targetPlanId: string;

  @ApiProperty()
  targetTier: string;

  @ApiProperty()
  isUpgrade: boolean;

  @ApiProperty()
  isDowngrade: boolean;

  @ApiProperty()
  isSameTier: boolean;

  @ApiPropertyOptional()
  priceDifference?: number;
}
