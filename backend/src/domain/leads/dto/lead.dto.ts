// ============================================================================
// LEAD DTOs - Leads Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator'

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATING = 'NEGOTIATING',
  WON = 'WON',
  LOST = 'LOST',
  ARCHIVED = 'ARCHIVED',
}

export enum LeadSource {
  INQUIRY = 'INQUIRY',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  PHONE = 'PHONE',
  EXTERNAL = 'EXTERNAL',
  REFERRAL = 'REFERRAL',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateLeadDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string

  @ApiProperty({ description: 'Planner/user ID' })
  @IsUUID()
  plannerId: string

  @ApiPropertyOptional({ description: 'Event ID (if linked)', nullable: true })
  @IsOptional()
  @IsUUID()
  eventId?: string

  @ApiProperty({ description: 'Lead source', enum: LeadSource, default: LeadSource.INQUIRY })
  @IsEnum(LeadSource)
  source: LeadSource

  @ApiPropertyOptional({ description: 'Event date (ISO 8601)', nullable: true })
  @IsOptional()
  @IsDateString()
  eventDate?: string

  @ApiPropertyOptional({ description: 'Event type', example: 'Wedding', nullable: true })
  @IsOptional()
  @IsString()
  eventType?: string

  @ApiPropertyOptional({ description: 'Guest count', example: 150, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number

  @ApiPropertyOptional({ description: 'Budget', example: 10000.00, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget?: number

  @ApiPropertyOptional({ description: 'Initial message from user', nullable: true })
  @IsOptional()
  @IsString()
  initialMessage?: string
}

// DTO for vendors creating leads from messaging (vendorProfileId auto-injected)
export class CreateLeadFromConversationDto {
  @ApiProperty({ description: 'Planner/user ID' })
  @IsUUID()
  plannerId: string

  @ApiProperty({ description: 'Lead source', enum: LeadSource, default: LeadSource.DIRECT_MESSAGE })
  @IsEnum(LeadSource)
  source: LeadSource

  @ApiPropertyOptional({ description: 'Event date (ISO 8601)', nullable: true })
  @IsOptional()
  @IsDateString()
  eventDate?: string

  @ApiPropertyOptional({ description: 'Event type', example: 'Wedding', nullable: true })
  @IsOptional()
  @IsString()
  eventType?: string

  @ApiPropertyOptional({ description: 'Guest count', example: 150, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number

  @ApiPropertyOptional({ description: 'Budget', example: 10000.00, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget?: number

  @ApiPropertyOptional({ description: 'Initial message from user', nullable: true })
  @IsOptional()
  @IsString()
  initialMessage?: string
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateLeadDto {
  @ApiPropertyOptional({ description: 'Lead status', enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus

  @ApiPropertyOptional({ description: 'Event date', nullable: true })
  @IsOptional()
  @IsDateString()
  eventDate?: string

  @ApiPropertyOptional({ description: 'Event type', nullable: true })
  @IsOptional()
  @IsString()
  eventType?: string

  @ApiPropertyOptional({ description: 'Guest count', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number

  @ApiPropertyOptional({ description: 'Budget', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget?: number
}

// ============================================================================
// SEARCH DTOs
// ============================================================================

export class SearchLeadsDto {
  @ApiPropertyOptional({ description: 'Filter by vendor profile ID' })
  @IsOptional()
  @IsUUID()
  vendorProfileId?: string

  @ApiPropertyOptional({ description: 'Filter by planner ID' })
  @IsOptional()
  @IsUUID()
  plannerId?: string

  @ApiPropertyOptional({ description: 'Filter by status', enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus

  @ApiPropertyOptional({ description: 'Filter by source', enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class LeadResponseDto {
  @ApiProperty({ description: 'Lead ID' })
  id: string

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string

  @ApiProperty({ description: 'Planner ID' })
  plannerId: string

  @ApiPropertyOptional({ description: 'Event ID', nullable: true })
  eventId: string | null

  @ApiProperty({ description: 'Lead status', enum: LeadStatus })
  status: LeadStatus

  @ApiProperty({ description: 'Lead source', enum: LeadSource })
  source: LeadSource

  @ApiPropertyOptional({ description: 'Event date', nullable: true })
  eventDate: Date | null

  @ApiPropertyOptional({ description: 'Event type', nullable: true })
  eventType: string | null

  @ApiPropertyOptional({ description: 'Guest count', nullable: true })
  guestCount: number | null

  @ApiPropertyOptional({ description: 'Budget', nullable: true })
  budget: number | null

  @ApiPropertyOptional({ description: 'Initial message', nullable: true })
  initialMessage: string | null

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date

  @ApiPropertyOptional({ description: 'Responded at', nullable: true })
  respondedAt: Date | null

  @ApiPropertyOptional({ description: 'Converted at', nullable: true })
  convertedAt: Date | null
}
