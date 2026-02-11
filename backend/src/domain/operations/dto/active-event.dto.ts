// ============================================================================
// ACTIVE EVENT DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { EventOrigin, ActiveEventStatus } from '@prisma/client'

// Re-export Prisma enums for convenience
export { EventOrigin, ActiveEventStatus }

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateActiveEventDto {
  @ApiProperty({ description: 'Event origin', enum: EventOrigin })
  @IsEnum(EventOrigin)
  origin: EventOrigin

  @ApiPropertyOptional({ description: 'Converted from lead ID (for Digital Lead origin)', nullable: true })
  @IsOptional()
  @IsUUID()
  convertedFromLeadId?: string

  @ApiPropertyOptional({ description: 'Reference image ID', nullable: true })
  @IsOptional()
  @IsUUID()
  referenceImageId?: string

  @ApiProperty({ description: 'Client name', example: 'John Doe' })
  @IsString()
  clientName: string

  @ApiPropertyOptional({ description: 'Client phone', example: '+1234567890', nullable: true })
  @IsOptional()
  @IsString()
  clientPhone?: string

  @ApiPropertyOptional({ description: 'Client email', example: 'john@example.com', nullable: true })
  @IsOptional()
  @IsString()
  clientEmail?: string

  @ApiPropertyOptional({ description: 'Event date (ISO 8601)', example: '2024-08-15T10:00:00Z', nullable: true })
  @IsOptional()
  @IsDateString()
  eventDate?: string

  @ApiPropertyOptional({ description: 'Event end date (ISO 8601)', nullable: true })
  @IsOptional()
  @IsDateString()
  eventEndDate?: string

  @ApiProperty({ description: 'Event type', example: 'Wedding' })
  @IsString()
  eventType: string

  @ApiPropertyOptional({ description: 'Venue name', nullable: true })
  @IsOptional()
  @IsString()
  venueName?: string

  @ApiPropertyOptional({ description: 'Venue address ID', nullable: true })
  @IsOptional()
  @IsUUID()
  venueAddressId?: string

  @ApiPropertyOptional({ description: 'Total budget', example: 50000.00, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalBudget?: number

  @ApiPropertyOptional({ description: 'Ops manager ID', nullable: true })
  @IsOptional()
  @IsUUID()
  opsManagerId?: string
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateActiveEventDto {
  @ApiPropertyOptional({ description: 'Client name' })
  @IsOptional()
  @IsString()
  clientName?: string

  @ApiPropertyOptional({ description: 'Client phone', nullable: true })
  @IsOptional()
  @IsString()
  clientPhone?: string

  @ApiPropertyOptional({ description: 'Client email', nullable: true })
  @IsOptional()
  @IsString()
  clientEmail?: string

  @ApiPropertyOptional({ description: 'Event date', nullable: true })
  @IsOptional()
  @IsDateString()
  eventDate?: string

  @ApiPropertyOptional({ description: 'Event end date', nullable: true })
  @IsOptional()
  @IsDateString()
  eventEndDate?: string

  @ApiPropertyOptional({ description: 'Event type' })
  @IsOptional()
  @IsString()
  eventType?: string

  @ApiPropertyOptional({ description: 'Venue name', nullable: true })
  @IsOptional()
  @IsString()
  venueName?: string

  @ApiPropertyOptional({ description: 'Venue address ID', nullable: true })
  @IsOptional()
  @IsUUID()
  venueAddressId?: string

  @ApiPropertyOptional({ description: 'Total budget', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalBudget?: number

  @ApiPropertyOptional({ description: 'Status', enum: ActiveEventStatus })
  @IsOptional()
  @IsEnum(ActiveEventStatus)
  status?: ActiveEventStatus

  @ApiPropertyOptional({ description: 'Ops manager ID', nullable: true })
  @IsOptional()
  @IsUUID()
  opsManagerId?: string
}

// ============================================================================
// SEARCH DTOs
// ============================================================================

export class SearchActiveEventsDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ActiveEventStatus })
  @IsOptional()
  @IsEnum(ActiveEventStatus)
  status?: ActiveEventStatus

  @ApiPropertyOptional({ description: 'Filter by origin', enum: EventOrigin })
  @IsOptional()
  @IsEnum(EventOrigin)
  origin?: EventOrigin

  @ApiPropertyOptional({ description: 'Filter by ops manager ID' })
  @IsOptional()
  @IsUUID()
  opsManagerId?: string

  @ApiPropertyOptional({ description: 'Search by client name' })
  @IsOptional()
  @IsString()
  clientName?: string

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}

// ============================================================================
// LINK TO USER EVENT DTO
// ============================================================================

export class LinkActiveEventToUserDto {
  @ApiPropertyOptional({ description: 'User ID to link (optional when lead exists)', nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string

  @ApiPropertyOptional({ description: 'Event type ID override', nullable: true })
  @IsOptional()
  @IsUUID()
  eventTypeId?: string

  @ApiPropertyOptional({ description: 'Event date override (ISO 8601)', nullable: true })
  @IsOptional()
  @IsDateString()
  eventDate?: string
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class ActiveEventResponseDto {
  @ApiProperty({ description: 'Active event ID' })
  id: string

  @ApiProperty({ description: 'Event origin', enum: EventOrigin })
  origin: EventOrigin

  @ApiPropertyOptional({ description: 'Converted from lead ID', nullable: true })
  convertedFromLeadId: string | null

  @ApiPropertyOptional({ description: 'Reference image ID', nullable: true })
  referenceImageId: string | null

  @ApiProperty({ description: 'Client name' })
  clientName: string

  @ApiPropertyOptional({ description: 'Client phone', nullable: true })
  clientPhone: string | null

  @ApiPropertyOptional({ description: 'Client email', nullable: true })
  clientEmail: string | null

  @ApiPropertyOptional({ description: 'Event date', nullable: true })
  eventDate: Date | null

  @ApiPropertyOptional({ description: 'Event end date', nullable: true })
  eventEndDate: Date | null

  @ApiProperty({ description: 'Event type' })
  eventType: string

  @ApiPropertyOptional({ description: 'Venue name', nullable: true })
  venueName: string | null

  @ApiPropertyOptional({ description: 'Venue address ID', nullable: true })
  venueAddressId: string | null

  @ApiPropertyOptional({ description: 'Total budget', nullable: true })
  totalBudget: number | null

  @ApiProperty({ description: 'Total spend' })
  totalSpend: number

  @ApiPropertyOptional({ description: 'Ops admin ID', nullable: true })
  opsAdminId: string | null

  @ApiPropertyOptional({ description: 'Ops manager ID', nullable: true })
  opsManagerId: string | null

  @ApiProperty({ description: 'Status', enum: ActiveEventStatus })
  status: ActiveEventStatus

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date

  @ApiPropertyOptional({ description: 'Completed at', nullable: true })
  completedAt: Date | null
} 
