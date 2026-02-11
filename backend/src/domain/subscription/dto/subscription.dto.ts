// ============================================================================
// SUBSCRIPTION DTOs - Subscription Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator'

export enum SubscriptionStatus {
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

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string

  @ApiProperty({ description: 'Subscription plan ID' })
  @IsUUID()
  planId: string

  @ApiProperty({ description: 'Plan price ID' })
  @IsUUID()
  priceId: string

  @ApiPropertyOptional({ description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  couponCode?: string

  @ApiPropertyOptional({ description: 'Payment method ID' })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'New plan ID (for upgrades/downgrades)' })
  @IsOptional()
  @IsUUID()
  planId?: string

  @ApiPropertyOptional({ description: 'New plan price ID' })
  @IsOptional()
  @IsUUID()
  priceId?: string

  @ApiPropertyOptional({ description: 'Cancel at period end' })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  reason?: string

  @ApiPropertyOptional({ description: 'Cancel immediately or at period end', default: false })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean
}

// ============================================================================
// Response DTOs
// ============================================================================

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  vendorProfileId: string

  @ApiProperty()
  planId: string

  @ApiProperty()
  priceId: string

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus

  @ApiProperty()
  currentPeriodStart: Date

  @ApiProperty()
  currentPeriodEnd: Date

  @ApiPropertyOptional()
  cancelledAt?: Date

  @ApiPropertyOptional()
  cancelAtPeriodEnd?: boolean

  @ApiPropertyOptional()
  trialEnd?: Date

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  plan?: any
  price?: any
  paymentMethods?: any
}

// ============================================================================
// Usage DTOs
// ============================================================================

export class UsageRecordDto {
  @ApiProperty({ description: 'Feature type being tracked' })
  @IsString()
  featureKey: string

  @ApiProperty({ description: 'Usage quantity' })
  quantity: number
}

export class CheckFeatureLimitDto {
  @ApiProperty({ description: 'Feature type to check' })
  @IsString()
  featureKey: string
}

export class FeatureLimitResponseDto {
  @ApiProperty()
  featureKey: string

  @ApiProperty()
  limit: number

  @ApiProperty()
  used: number

  @ApiProperty()
  remaining: number

  @ApiProperty()
  isUnlimited: boolean
}
