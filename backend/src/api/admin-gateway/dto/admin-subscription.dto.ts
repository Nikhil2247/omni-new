import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by vendor profile ID' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Filter by plan ID' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'Filter by subscription status' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Filter by cancel at period end flag' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Filter subscriptions expiring before date (ISO format)' })
  @IsOptional()
  @IsString()
  expiringBefore?: string;

  @ApiPropertyOptional({ description: 'Filter subscriptions created from date (ISO format)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter subscriptions created to date (ISO format)' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Search by vendor business name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ModifySubscriptionDto {
  @ApiPropertyOptional({ description: 'New plan ID (for plan change)' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ description: 'New price ID (for plan change)' })
  @IsOptional()
  @IsUUID()
  priceId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus, description: 'New status' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Extend trial end date (ISO format)' })
  @IsOptional()
  @IsString()
  trialEnd?: string;

  @ApiPropertyOptional({ description: 'Extend current period end date (ISO format)' })
  @IsOptional()
  @IsString()
  currentPeriodEnd?: string;

  @ApiPropertyOptional({ description: 'Cancel at period end flag' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional({ description: 'Reason for modification (for audit)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AdminCancelSubscriptionDto {
  @ApiProperty({ description: 'Cancel immediately or at period end' })
  @IsBoolean()
  immediate: boolean;

  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Process refund for remaining period' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  processRefund?: boolean;

  @ApiPropertyOptional({ description: 'Internal notes (admin only)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNotes?: string;
}

export class SubscriptionStatsFilterDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Filter by plan ID' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ description: 'Group by period (day, week, month)' })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';
}
