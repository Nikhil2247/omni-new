// ============================================================================
// CONVERT LEAD TO EVENT DTO - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class ConvertLeadToEventDto {
  @ApiProperty({ description: 'Lead ID to convert' })
  @IsUUID()
  leadId: string;

  @ApiProperty({ description: 'Ops admin ID performing conversion' })
  @IsUUID()
  opsAdminId: string;

  @ApiPropertyOptional({ description: 'Ops manager ID', nullable: true })
  @IsOptional()
  @IsUUID()
  opsManagerId?: string;

  @ApiPropertyOptional({ description: 'Reference image ID', nullable: true })
  @IsOptional()
  @IsUUID()
  referenceImageId?: string;

  @ApiPropertyOptional({ description: 'Venue name', nullable: true })
  @IsOptional()
  @IsString()
  venueName?: string;

  @ApiPropertyOptional({ description: 'Venue address ID', nullable: true })
  @IsOptional()
  @IsUUID()
  venueAddressId?: string;

  @ApiPropertyOptional({ description: 'Total budget', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalBudget?: number;
}
