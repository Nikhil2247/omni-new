// ============================================================================
// DISPUTE DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

export enum DisputeType {
  SERVICE_QUALITY = 'SERVICE_QUALITY',
  PRICING = 'PRICING',
  NO_SHOW = 'NO_SHOW',
  HARASSMENT = 'HARASSMENT',
  FRAUD = 'FRAUD',
  OTHER = 'OTHER',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateDisputeDto {
  @ApiProperty({ description: 'Vendor profile ID being disputed' })
  @IsUUID()
  vendorProfileId: string;

  @ApiProperty({ description: 'Reporter user ID (who filed the dispute)' })
  @IsUUID()
  reporterId: string;

  @ApiProperty({ description: 'Dispute type', enum: DisputeType })
  @IsEnum(DisputeType)
  type: DisputeType;

  @ApiProperty({
    description: 'Dispute description',
    example: 'Vendor did not show up for the event',
  })
  @IsString()
  @MaxLength(2000)
  description: string;
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateDisputeDto {
  @ApiPropertyOptional({ description: 'Dispute type', enum: DisputeType })
  @IsOptional()
  @IsEnum(DisputeType)
  type?: DisputeType;

  @ApiPropertyOptional({ description: 'Dispute description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateDisputeStatusDto {
  @ApiProperty({ description: 'New dispute status', enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  status: DisputeStatus;

  @ApiPropertyOptional({
    description: 'Status change reason/notes',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ResolveDisputeDto {
  @ApiProperty({ description: 'Dispute ID' })
  @IsUUID()
  disputeId: string;

  @ApiProperty({ description: 'Resolution description' })
  @IsString()
  @MaxLength(2000)
  resolution: string;

  @ApiPropertyOptional({ description: 'Resolved by user ID', nullable: true })
  @IsOptional()
  @IsUUID()
  resolvedBy?: string;
}

export class EscalateDisputeDto {
  @ApiProperty({ description: 'Dispute ID' })
  @IsUUID()
  disputeId: string;

  @ApiProperty({ description: 'Escalation reason' })
  @IsString()
  @MaxLength(500)
  reason: string;
}

// ============================================================================
// SEARCH DTOs
// ============================================================================

export class SearchDisputesDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ description: 'Filter by type', enum: DisputeType })
  @IsOptional()
  @IsEnum(DisputeType)
  type?: DisputeType;

  @ApiPropertyOptional({ description: 'Filter by vendor profile ID' })
  @IsOptional()
  @IsUUID()
  vendorProfileId?: string;

  @ApiPropertyOptional({ description: 'Filter by reporter ID' })
  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class DisputeResponseDto {
  @ApiProperty({ description: 'Dispute ID' })
  id: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;

  @ApiProperty({ description: 'Reporter user ID' })
  reporterId: string;

  @ApiProperty({ description: 'Dispute type', enum: DisputeType })
  type: DisputeType;

  @ApiProperty({ description: 'Dispute status', enum: DisputeStatus })
  status: DisputeStatus;

  @ApiProperty({ description: 'Dispute description' })
  description: string;

  @ApiPropertyOptional({ description: 'Resolution', nullable: true })
  resolution: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Resolved at', nullable: true })
  resolvedAt: Date | null;

  @ApiPropertyOptional({ description: 'Resolved by user ID', nullable: true })
  resolvedBy: string | null;
}
