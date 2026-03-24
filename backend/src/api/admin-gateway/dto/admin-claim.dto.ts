// ============================================================================
// ADMIN CLAIM DTOs
// ============================================================================
// DTOs for admin vendor claim management and approval workflow
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus, DocumentStatus, DocumentType } from '@prisma/client';
import { VendorClaimResponseDto } from '../../../domain/catalog/dto/vendor-claim.dto';

// Re-export enum for convenience
export { ClaimStatus };

// ============================================================================
// Filter DTOs
// ============================================================================

export class ClaimFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by claim status',
    enum: ClaimStatus,
  })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiPropertyOptional({
    description: 'Filter by vendor profile ID',
  })
  @IsOptional()
  @IsUUID()
  vendorProfileId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Number of items to return',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

// ============================================================================
// Action DTOs
// ============================================================================

export class ApproveClaimDto {
  @ApiPropertyOptional({
    description: 'Optional notes for the approval (visible to admins)',
    example: 'Verified ownership through phone call',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class RejectClaimDto {
  @ApiProperty({
    description: 'Reason for rejection (shown to vendor)',
    example: 'Unable to verify ownership of this business',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    description: 'Internal notes (only visible to admins)',
    example: 'User could not provide business registration documents',
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

export class AdminClaimUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiPropertyOptional({ description: 'First name' })
  firstName?: string | null;

  @ApiPropertyOptional({ description: 'Last name' })
  lastName?: string | null;
}

export class ClaimDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Document URL' })
  url: string;

  @ApiPropertyOptional({ description: 'Original file name' })
  fileName?: string | null;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSize?: number | null;

  @ApiPropertyOptional({ description: 'MIME type' })
  mimeType?: string | null;

  @ApiProperty({ description: 'Document type', enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ description: 'Document verification status', enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional({ description: 'When document was reviewed' })
  reviewedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Reason for rejection if rejected' })
  rejectionReason?: string | null;
}

export class AdminClaimResponseDto extends VendorClaimResponseDto {
  @ApiPropertyOptional({
    description: 'User details for the claimant',
    type: AdminClaimUserDto,
  })
  user?: AdminClaimUserDto;

  @ApiPropertyOptional({
    description: 'Documents submitted for claim verification',
    type: [ClaimDocumentDto],
  })
  documents?: ClaimDocumentDto[];
}

export class ClaimStatusCountsDto {
  @ApiProperty({ description: 'Count of PENDING claims' })
  pending: number;

  @ApiProperty({ description: 'Count of VERIFICATION_SENT claims' })
  verificationSent: number;

  @ApiProperty({ description: 'Count of VERIFIED claims' })
  verified: number;

  @ApiProperty({ description: 'Count of APPROVED claims' })
  approved: number;

  @ApiProperty({ description: 'Count of REJECTED claims' })
  rejected: number;

  @ApiProperty({ description: 'Count of EXPIRED claims' })
  expired: number;
}

export class AdminClaimListResponseDto {
  @ApiProperty({
    description: 'List of claims',
    type: [AdminClaimResponseDto],
  })
  claims: AdminClaimResponseDto[];

  @ApiProperty({ description: 'Total count of matching claims' })
  total: number;

  @ApiProperty({ description: 'Number of items returned' })
  limit: number;

  @ApiProperty({ description: 'Number of items skipped' })
  offset: number;
}

export class ClaimApprovalResultDto {
  @ApiProperty({ description: 'Whether the action was successful' })
  success: boolean;

  @ApiProperty({ description: 'Updated claim', type: AdminClaimResponseDto })
  claim: AdminClaimResponseDto;

  @ApiPropertyOptional({ description: 'Result message' })
  message?: string;
}
