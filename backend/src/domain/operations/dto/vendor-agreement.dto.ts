// ============================================================================
// VENDOR AGREEMENT DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsBoolean, Min } from 'class-validator'

export enum AgreementStatus {
  DRAFT = 'DRAFT',
  NEGOTIATING = 'NEGOTIATING',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  LOCKED = 'LOCKED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateVendorAgreementDto {
  @ApiProperty({ description: 'Active event ID' })
  @IsUUID()
  activeEventId: string

  @ApiPropertyOptional({ description: 'Requirement item ID', nullable: true })
  @IsOptional()
  @IsUUID()
  requirementItemId?: string

  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string

  @ApiProperty({ description: 'Vendor business name' })
  @IsString()
  vendorName: string

  @ApiProperty({ description: 'Agreed amount', example: 5000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  agreedAmount: number

  @ApiPropertyOptional({ description: 'Advance paid', example: 1000.00, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  advancePaid?: number

  @ApiPropertyOptional({ description: 'Contract terms', nullable: true })
  @IsOptional()
  @IsString()
  contractTerms?: string

  @ApiPropertyOptional({ description: 'Special requirements', nullable: true })
  @IsOptional()
  @IsString()
  specialRequirements?: string
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateVendorAgreementDto {
  @ApiPropertyOptional({ description: 'Agreed amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  agreedAmount?: number

  @ApiPropertyOptional({ description: 'Advance paid' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  advancePaid?: number

  @ApiPropertyOptional({ description: 'Contract terms', nullable: true })
  @IsOptional()
  @IsString()
  contractTerms?: string

  @ApiPropertyOptional({ description: 'Special requirements', nullable: true })
  @IsOptional()
  @IsString()
  specialRequirements?: string

  @ApiPropertyOptional({ description: 'Status', enum: AgreementStatus })
  @IsOptional()
  @IsEnum(AgreementStatus)
  status?: AgreementStatus

  @ApiPropertyOptional({ description: 'Signed by vendor' })
  @IsOptional()
  @IsBoolean()
  signedByVendor?: boolean

  @ApiPropertyOptional({ description: 'Signed by ops' })
  @IsOptional()
  @IsBoolean()
  signedByOps?: boolean
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class VendorAgreementResponseDto {
  @ApiProperty({ description: 'Agreement ID' })
  id: string

  @ApiProperty({ description: 'Active event ID' })
  activeEventId: string

  @ApiPropertyOptional({ description: 'Requirement item ID', nullable: true })
  requirementItemId: string | null

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string

  @ApiProperty({ description: 'Vendor name' })
  vendorName: string

  @ApiProperty({ description: 'Agreed amount' })
  agreedAmount: number

  @ApiProperty({ description: 'Advance paid' })
  advancePaid: number

  @ApiProperty({ description: 'Balance due' })
  balanceDue: number

  @ApiPropertyOptional({ description: 'Contract terms', nullable: true })
  contractTerms: string | null

  @ApiPropertyOptional({ description: 'Special requirements', nullable: true })
  specialRequirements: string | null

  @ApiProperty({ description: 'Status', enum: AgreementStatus })
  status: AgreementStatus

  @ApiProperty({ description: 'Signed by vendor' })
  signedByVendor: boolean

  @ApiProperty({ description: 'Signed by ops' })
  signedByOps: boolean

  @ApiPropertyOptional({ description: 'Locked at', nullable: true })
  lockedAt: Date | null

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date
} 
