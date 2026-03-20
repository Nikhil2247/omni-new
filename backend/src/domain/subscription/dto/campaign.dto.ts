// ============================================================================
// CAMPAIGN DTOs - Subscription Domain
// ============================================================================
// Data transfer objects for campaign management
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { CampaignType, CampaignStatus } from '@prisma/client';

// Re-export enums for convenience
export { CampaignType, CampaignStatus };

// ============================================================================
// Create/Update DTOs
// ============================================================================

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign type',
    enum: CampaignType,
    example: CampaignType.PROFILE_BOOST,
  })
  @IsEnum(CampaignType)
  type: CampaignType;

  @ApiProperty({
    description: 'Campaign name',
    example: 'Summer Wedding Promotion',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'Boost visibility for summer wedding season',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Target entity ID (portfolio/album ID for promotions)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  targetEntityId?: string;

  @ApiPropertyOptional({
    description: 'Target entity type (portfolio, service, etc.)',
    example: 'portfolio',
  })
  @IsOptional()
  @IsString()
  targetEntityType?: string;

  @ApiProperty({
    description: 'Daily budget in credits',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  dailyBudget: number;

  @ApiProperty({
    description: 'Total budget in credits',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  totalBudget: number;

  @ApiProperty({
    description: 'Campaign start date (ISO 8601)',
    example: '2025-01-15T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'Campaign end date (ISO 8601)',
    example: '2025-02-15T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    description: 'Campaign name',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Target entity ID',
  })
  @IsOptional()
  @IsUUID()
  targetEntityId?: string;

  @ApiPropertyOptional({
    description: 'Target entity type',
  })
  @IsOptional()
  @IsString()
  targetEntityType?: string;

  @ApiPropertyOptional({
    description: 'Daily budget in credits',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyBudget?: number;

  @ApiPropertyOptional({
    description: 'Total budget in credits',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalBudget?: number;

  @ApiPropertyOptional({
    description: 'Campaign start date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Campaign end date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class CampaignResponseDto {
  @ApiProperty({ description: 'Campaign ID' })
  id: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;

  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  type: CampaignType;

  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Target entity ID' })
  targetEntityId?: string;

  @ApiPropertyOptional({ description: 'Target entity type' })
  targetEntityType?: string;

  @ApiProperty({ description: 'Daily budget in credits' })
  dailyBudget: number;

  @ApiProperty({ description: 'Total budget in credits' })
  totalBudget: number;

  @ApiProperty({ description: 'Credits spent so far' })
  creditsSpent: number;

  @ApiProperty({ description: 'Campaign start date' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  endDate?: Date;

  @ApiProperty({ description: 'Campaign status', enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty({ description: 'Total impressions' })
  impressions: number;

  @ApiProperty({ description: 'Total clicks' })
  clicks: number;

  @ApiProperty({ description: 'Total conversions' })
  conversions: number;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class DailyStatDto {
  @ApiProperty({ description: 'Date of stats' })
  date: Date;

  @ApiProperty({ description: 'Impressions for the day' })
  impressions: number;

  @ApiProperty({ description: 'Clicks for the day' })
  clicks: number;

  @ApiProperty({ description: 'Conversions for the day' })
  conversions: number;

  @ApiProperty({ description: 'Credits spent for the day' })
  creditsSpent: number;
}

export class CampaignStatsDto {
  @ApiProperty({ description: 'Campaign ID' })
  campaignId: string;

  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  type: CampaignType;

  @ApiProperty({ description: 'Campaign status', enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty({ description: 'Total impressions' })
  impressions: number;

  @ApiProperty({ description: 'Total clicks' })
  clicks: number;

  @ApiProperty({ description: 'Total conversions' })
  conversions: number;

  @ApiProperty({ description: 'Total credits spent' })
  creditsSpent: number;

  @ApiProperty({ description: 'Total budget' })
  totalBudget: number;

  @ApiProperty({ description: 'Daily budget' })
  dailyBudget: number;

  @ApiProperty({ description: 'Remaining budget' })
  remainingBudget: number;

  @ApiProperty({
    description: 'Click-through rate (percentage)',
    example: 2.5,
  })
  ctr: number;

  @ApiProperty({
    description: 'Conversion rate (percentage)',
    example: 5.0,
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Cost per click (credits)',
    example: 10.5,
  })
  costPerClick: number;

  @ApiProperty({
    description: 'Cost per conversion (credits)',
    example: 100.0,
  })
  costPerConversion: number;

  @ApiProperty({
    description: 'Budget utilization percentage',
    example: 45.5,
  })
  budgetUtilization: number;

  @ApiProperty({ description: 'Campaign start date' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  endDate?: Date | null;

  @ApiProperty({
    description: 'Daily statistics (last 30 days)',
    type: [DailyStatDto],
  })
  dailyStats: DailyStatDto[];
}

// ============================================================================
// Ad Credit DTOs
// ============================================================================

export class AdCreditBalanceDto {
  @ApiProperty({ description: 'Current credit balance' })
  balance: number;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;
}

export class AdCreditTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;

  @ApiProperty({
    description: 'Transaction type',
    example: 'SUBSCRIPTION_GRANT',
  })
  type: string;

  @ApiProperty({
    description: 'Transaction amount (positive for credits, negative for debits)',
  })
  amount: number;

  @ApiProperty({ description: 'Balance after transaction' })
  balance: number;

  @ApiPropertyOptional({ description: 'Reference type' })
  referenceType?: string | null;

  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string | null;

  @ApiPropertyOptional({ description: 'Transaction description' })
  description?: string | null;

  @ApiProperty({ description: 'Transaction timestamp' })
  createdAt: Date;
}

export class PurchaseCreditsDto {
  @ApiProperty({
    description: 'Number of credits to purchase',
    minimum: 100,
    example: 1000,
  })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment method ID',
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;
}

export class CreditSpendingSummaryDto {
  @ApiProperty({ description: 'Total credits granted in period' })
  totalGranted: number;

  @ApiProperty({ description: 'Total credits spent in period' })
  totalSpent: number;

  @ApiProperty({ description: 'Net change in credits' })
  netChange: number;

  @ApiProperty({ description: 'Current balance' })
  currentBalance: number;
}
