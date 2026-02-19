// ============================================================================
// EVENT VENDOR DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

export enum EventVendorStatus {
  SHORTLISTED = 'SHORTLISTED',
  CONTACTED = 'CONTACTED',
  BOOKED = 'BOOKED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class AddEventVendorDto {
  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string;

  @ApiPropertyOptional({ description: 'Contract amount', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contractAmount?: number;

  @ApiPropertyOptional({ description: 'Deposit paid', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositPaid?: number;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Status', enum: EventVendorStatus })
  @IsOptional()
  @IsEnum(EventVendorStatus)
  status?: EventVendorStatus;
}

export class UpdateEventVendorDto {
  @ApiPropertyOptional({ description: 'Contract amount', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contractAmount?: number;

  @ApiPropertyOptional({ description: 'Deposit paid', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositPaid?: number;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Status', enum: EventVendorStatus })
  @IsOptional()
  @IsEnum(EventVendorStatus)
  status?: EventVendorStatus;
}
