// ============================================================================
// ADMIN CAMPAIGN DTOs
// ============================================================================
// DTOs for admin campaign management and approval workflow
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CampaignStatus, CampaignType } from '@prisma/client';

// ============================================================================
// Filter DTOs
// ============================================================================

export class CampaignFilterDto {
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
    description: 'Internal notes (only visible to admins)',
    example: 'Discussed with team - needs content revision',
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

export class AdminCampaignVendorDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  id: string;

  @ApiProperty({ description: 'Business name' })
  businessName: string;

  @ApiPropertyOptional({ description: 'Vendor slug' })
  slug?: string;
}

export class AdminCampaignUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string | null;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string | null;

  @ApiProperty({ description: 'Email' })
  email: string;
}

export class AdminCampaignResponseDto {
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

  @ApiPropertyOptional({ description: 'Admin who approved', type: AdminCampaignUserDto })
  approvedBy?: AdminCampaignUserDto | null;

  @ApiPropertyOptional({ description: 'Date rejected' })
  rejectedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Admin who rejected', type: AdminCampaignUserDto })
  rejectedBy?: AdminCampaignUserDto | null;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string | null;

  @ApiPropertyOptional({ description: 'Internal admin notes' })
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
  @ApiPropertyOptional({ description: 'Vendor profile details', type: AdminCampaignVendorDto })
  vendorProfile?: AdminCampaignVendorDto;
}

export class AdminCampaignListResponseDto {
  @ApiProperty({
    description: 'List of campaigns',
    type: [AdminCampaignResponseDto],
  })
  data: AdminCampaignResponseDto[];

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

export class AdminCampaignStatusCountsDto {
  @ApiProperty({ description: 'Count of DRAFT campaigns' })
  draft: number;

  @ApiProperty({ description: 'Count of PENDING_APPROVAL campaigns' })
  pendingApproval: number;

  @ApiProperty({ description: 'Count of APPROVED campaigns' })
  approved: number;

  @ApiProperty({ description: 'Count of REJECTED campaigns' })
  rejected: number;

  @ApiProperty({ description: 'Count of SCHEDULED campaigns' })
  scheduled: number;

  @ApiProperty({ description: 'Count of ACTIVE campaigns' })
  active: number;

  @ApiProperty({ description: 'Count of PAUSED campaigns' })
  paused: number;

  @ApiProperty({ description: 'Count of COMPLETED campaigns' })
  completed: number;

  @ApiProperty({ description: 'Count of CANCELLED campaigns' })
  cancelled: number;

  @ApiProperty({ description: 'Total count of all campaigns' })
  total: number;
}

export class CampaignApprovalResultDto {
  @ApiProperty({ description: 'Whether the action was successful' })
  success: boolean;

  @ApiProperty({ description: 'Updated campaign', type: AdminCampaignResponseDto })
  campaign: AdminCampaignResponseDto;

  @ApiPropertyOptional({ description: 'Result message' })
  message?: string;
}
