// ============================================================================
// CONVERT LEAD BY VENDOR DTO - Vendor Acceptance Flow
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsOptional, IsString, IsNumber, Min } from 'class-validator'

export class ConvertLeadByVendorDto {
  @ApiPropertyOptional({ description: 'Lead ID to accept and convert (provided via URL param)' })
  @IsOptional()
  @IsUUID()
  leadId?: string

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
}
