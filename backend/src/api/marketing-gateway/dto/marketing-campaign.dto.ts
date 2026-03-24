// ============================================================================
// MARKETING CAMPAIGN DTOs
// ============================================================================
// DTOs for marketing team campaign management and approval workflow
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsArray,
  ArrayMinSize,
  Min,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CampaignStatus, CampaignType } from '@prisma/client';

// Re-export enums for convenience
export { CampaignStatus, CampaignType };

// ============================================================================
// Filter DTOs
// ============================================================================

export class MarketingCampaignFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by campaign status',
    enum: CampaignStatus,
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Filter by vendor profile ID',
  })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by campaign type',
    enum: CampaignType,
  })
  @IsOptional()
  @IsEnum(CampaignType)
  type?: CampaignType;

  @ApiPropertyOptional({
    description: 'Filter campaigns created from this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter campaigns created until this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Search by campaign name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

// ============================================================================
// Action DTOs
// ============================================================================

export class RejectCampaignDto {
  @ApiProperty({
    description: 'Reason for rejection (shown to vendor)',
    example: 'Campaign content violates our advertising guidelines',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    description: 'Internal notes (only visible to marketing team)',
    example: 'Discussed with team - needs content revision',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;
}

export class BulkCampaignIdsDto {
  @ApiProperty({
    description: 'Array of campaign IDs to process',
    example: ['uuid1', 'uuid2', 'uuid3'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  campaignIds: string[];
}

export class BulkRejectCampaignsDto extends BulkCampaignIdsDto {
  @ApiProperty({
    description: 'Reason for rejection (shown to vendors)',
    example: 'Campaign content violates our advertising guidelines',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    description: 'Internal notes (only visible to marketing team)',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class MarketingCampaignVendorDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  id: string;

  @ApiProperty({ description: 'Business name' })
  businessName: string;

  @ApiPropertyOptional({ description: 'Vendor slug' })
  slug?: string;
}

export class MarketingCampaignUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string | null;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string | null;

  @ApiProperty({ description: 'Email' })
  email: string;
}

export class MarketingCampaignResponseDto {
  @ApiProperty({ description: 'Campaign ID' })
  id: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;

  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  type: CampaignType;

  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Target entity ID' })
  targetEntityId?: string | null;

  @ApiPropertyOptional({ description: 'Target entity type' })
  targetEntityType?: string | null;

  @ApiProperty({ description: 'Daily budget in credits' })
  dailyBudget: number;

  @ApiProperty({ description: 'Total budget in credits' })
  totalBudget: number;

  @ApiProperty({ description: 'Credits spent so far' })
  creditsSpent: number;

  @ApiProperty({ description: 'Campaign start date' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  endDate?: Date | null;

  @ApiProperty({ description: 'Campaign status', enum: CampaignStatus })
  status: CampaignStatus;

  // Approval workflow fields
  @ApiPropertyOptional({ description: 'Date submitted for approval' })
  submittedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Date approved' })
  approvedAt?: Date | null;

  @ApiPropertyOptional({ description: 'User who approved', type: MarketingCampaignUserDto })
  approvedBy?: MarketingCampaignUserDto | null;

  @ApiPropertyOptional({ description: 'Date rejected' })
  rejectedAt?: Date | null;

  @ApiPropertyOptional({ description: 'User who rejected', type: MarketingCampaignUserDto })
  rejectedBy?: MarketingCampaignUserDto | null;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string | null;

  @ApiPropertyOptional({ description: 'Internal marketing notes' })
  internalNotes?: string | null;

  // Performance metrics
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

  // Related entities
  @ApiPropertyOptional({ description: 'Vendor profile details', type: MarketingCampaignVendorDto })
  vendorProfile?: MarketingCampaignVendorDto;
}

export class MarketingCampaignListResponseDto {
  @ApiProperty({
    description: 'List of campaigns',
    type: [MarketingCampaignResponseDto],
  })
  data: MarketingCampaignResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class CampaignStatusCountsDto {
  @ApiProperty({ description: 'Count of DRAFT campaigns' })
  DRAFT: number;

  @ApiProperty({ description: 'Count of PENDING_APPROVAL campaigns' })
  PENDING_APPROVAL: number;

  @ApiProperty({ description: 'Count of APPROVED campaigns' })
  APPROVED: number;

  @ApiProperty({ description: 'Count of REJECTED campaigns' })
  REJECTED: number;

  @ApiProperty({ description: 'Count of SCHEDULED campaigns' })
  SCHEDULED: number;

  @ApiProperty({ description: 'Count of ACTIVE campaigns' })
  ACTIVE: number;

  @ApiProperty({ description: 'Count of PAUSED campaigns' })
  PAUSED: number;

  @ApiProperty({ description: 'Count of COMPLETED campaigns' })
  COMPLETED: number;

  @ApiProperty({ description: 'Count of CANCELLED campaigns' })
  CANCELLED: number;

  @ApiProperty({ description: 'Total count of all campaigns' })
  TOTAL: number;
}

export class CampaignApprovalResultDto {
  @ApiProperty({ description: 'Whether the action was successful' })
  success: boolean;

  @ApiProperty({ description: 'Updated campaign', type: MarketingCampaignResponseDto })
  campaign: MarketingCampaignResponseDto;

  @ApiPropertyOptional({ description: 'Result message' })
  message?: string;
}

export class BulkOperationResultDto {
  @ApiProperty({ description: 'Whether the bulk operation was successful overall' })
  success: boolean;

  @ApiProperty({ description: 'Total number of campaigns processed' })
  total: number;

  @ApiProperty({ description: 'Number of successful operations' })
  succeeded: number;

  @ApiProperty({ description: 'Number of failed operations' })
  failed: number;

  @ApiProperty({
    description: 'Results for each campaign',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        campaignId: { type: 'string' },
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  results: Array<{
    campaignId: string;
    success: boolean;
    message?: string;
    campaign?: MarketingCampaignResponseDto;
  }>;
}

// ============================================================================
// Performance Metrics DTOs
// ============================================================================

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

export class CampaignPerformanceDto {
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

  // Vendor info for marketing context
  @ApiPropertyOptional({ description: 'Vendor profile details', type: MarketingCampaignVendorDto })
  vendorProfile?: MarketingCampaignVendorDto;
}
