// ============================================================================
// COUPON DTOs - Subscription Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, Min, IsEnum, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// Enums
// ============================================================================

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponAppliesTo {
  ALL_PLANS = 'ALL_PLANS',
  SPECIFIC_PLAN = 'SPECIFIC_PLAN',
  PAID_PLANS_ONLY = 'PAID_PLANS_ONLY',
}

export enum CouponDuration {
  ONCE = 'ONCE',
  REPEATING = 'REPEATING',
  FOREVER = 'FOREVER',
}

// ============================================================================
// Request DTOs
// ============================================================================

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Plan ID to apply coupon to' })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({ description: 'Price amount for discount calculation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;
}

export class ApplyCouponDto {
  @ApiProperty({ description: 'Coupon code to apply' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Subscription ID (uses current subscription if not provided)' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;
}

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Internal name for the coupon' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the coupon' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Type of discount', enum: DiscountType })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value (percentage or fixed amount)' })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ description: 'What the coupon applies to', enum: CouponAppliesTo, default: CouponAppliesTo.ALL_PLANS })
  @IsOptional()
  @IsEnum(CouponAppliesTo)
  appliesTo?: CouponAppliesTo;

  @ApiPropertyOptional({ description: 'Specific plan ID (if appliesTo is SPECIFIC_PLAN)' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiProperty({ description: 'Duration of the discount', enum: CouponDuration })
  @IsEnum(CouponDuration)
  duration: CouponDuration;

  @ApiPropertyOptional({ description: 'Number of months (if duration is REPEATING)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationInMonths?: number;

  @ApiPropertyOptional({ description: 'Maximum total redemptions' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({ description: 'Maximum redemptions per user' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptionsPerUser?: number;

  @ApiProperty({ description: 'When the coupon becomes valid' })
  @Type(() => Date)
  @IsDate()
  validFrom: Date;

  @ApiPropertyOptional({ description: 'When the coupon expires' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Minimum purchase amount required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Whether the coupon is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'Internal name for the coupon' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the coupon' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Maximum total redemptions' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({ description: 'Maximum redemptions per user' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptionsPerUser?: number;

  @ApiPropertyOptional({ description: 'When the coupon expires' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Minimum purchase amount required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Whether the coupon is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class CouponValidationResultDto {
  @ApiProperty({ description: 'Whether the coupon is valid' })
  isValid: boolean;

  @ApiPropertyOptional({ description: 'Coupon details (if valid)' })
  coupon?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    discountType: DiscountType;
    discountValue: number;
    duration: CouponDuration;
    durationInMonths: number | null;
  };

  @ApiPropertyOptional({ description: 'Calculated discount amount' })
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Final price after discount' })
  finalPrice?: number;

  @ApiPropertyOptional({ description: 'Error message (if invalid)' })
  errorMessage?: string;
}

export class CouponResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: DiscountType })
  discountType: DiscountType;

  @ApiProperty()
  discountValue: number;

  @ApiProperty({ enum: CouponAppliesTo })
  appliesTo: CouponAppliesTo;

  @ApiPropertyOptional()
  planId?: string;

  @ApiProperty({ enum: CouponDuration })
  duration: CouponDuration;

  @ApiPropertyOptional()
  durationInMonths?: number;

  @ApiPropertyOptional()
  maxRedemptions?: number;

  @ApiProperty()
  timesRedeemed: number;

  @ApiPropertyOptional()
  maxRedemptionsPerUser?: number;

  @ApiProperty()
  validFrom: Date;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiPropertyOptional()
  minAmount?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ApplyCouponResultDto {
  @ApiProperty({ description: 'Whether the coupon was successfully applied' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Updated subscription info' })
  subscription?: {
    id: string;
    couponId: string;
    discountAmount: number;
  };

  @ApiPropertyOptional({ description: 'Error message (if failed)' })
  errorMessage?: string;
}

export class AvailableCouponDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: DiscountType })
  discountType: DiscountType;

  @ApiProperty()
  discountValue: number;

  @ApiProperty({ enum: CouponAppliesTo })
  appliesTo: CouponAppliesTo;

  @ApiProperty({ enum: CouponDuration })
  duration: CouponDuration;

  @ApiPropertyOptional()
  durationInMonths?: number;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiPropertyOptional()
  minAmount?: number;
}
