// ============================================================================
// VENDOR KYC DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';

export enum KYCStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateVendorKYCDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string;

  @ApiProperty({
    description: 'Legal business name',
    example: 'ABC Photography LLC',
  })
  @IsString()
  @MaxLength(255)
  legalName: string;

  @ApiProperty({ description: 'Business type', example: 'LLC' })
  @IsString()
  @MaxLength(100)
  businessType: string;

  @ApiPropertyOptional({ description: 'Tax ID / GSTIN / EIN', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateVendorKYCDto {
  @ApiPropertyOptional({ description: 'Legal business name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ description: 'Business type' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessType?: string;

  @ApiPropertyOptional({ description: 'Tax ID / GSTIN / EIN', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;
}

export class SubmitKYCDto {
  @ApiProperty({ description: 'KYC ID to submit for review' })
  @IsUUID()
  kycId: string;
}

export class ReviewKYCDto {
  @ApiProperty({ description: 'KYC ID' })
  @IsUUID()
  kycId: string;

  @ApiProperty({
    description: 'Approval decision',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsEnum(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    description: 'Rejection reason (required if rejected)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

// ============================================================================
// SEARCH DTOs
// ============================================================================

export class SearchVendorKYCDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: KYCStatus })
  @IsOptional()
  @IsEnum(KYCStatus)
  status?: KYCStatus;

  @ApiPropertyOptional({ description: 'Filter by vendor profile ID' })
  @IsOptional()
  @IsUUID()
  vendorProfileId?: string;

  @ApiPropertyOptional({ description: 'Search by legal name' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class VendorKYCResponseDto {
  @ApiProperty({ description: 'KYC ID' })
  id: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;

  @ApiProperty({ description: 'Legal business name' })
  legalName: string;

  @ApiProperty({ description: 'Business type' })
  businessType: string;

  @ApiPropertyOptional({ description: 'Tax ID', nullable: true })
  taxId: string | null;

  @ApiProperty({ description: 'KYC status', enum: KYCStatus })
  status: KYCStatus;

  @ApiPropertyOptional({ description: 'Submitted at', nullable: true })
  submittedAt: Date | null;

  @ApiPropertyOptional({ description: 'Approved at', nullable: true })
  approvedAt: Date | null;

  @ApiPropertyOptional({ description: 'Rejected at', nullable: true })
  rejectedAt: Date | null;

  @ApiPropertyOptional({ description: 'Rejection reason', nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}
