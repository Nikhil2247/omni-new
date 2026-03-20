// ============================================================================
// KYC DOCUMENT DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { DocumentType, DocumentStatus } from '@prisma/client';

// Re-export for convenience
export { DocumentType, DocumentStatus };

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateKYCDocumentDto {
  @ApiProperty({ description: 'KYC ID this document belongs to' })
  @IsUUID()
  kycId: string;

  @ApiProperty({ description: 'Document type', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Document URL (S3/MinIO path)' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Document notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UploadKYCDocumentDto {
  @ApiProperty({ description: 'KYC ID this document belongs to' })
  @IsUUID()
  kycId: string;

  @ApiProperty({ description: 'Document type', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional({ description: 'Document notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateKYCDocumentDto {
  @ApiPropertyOptional({ description: 'Document type', enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({ description: 'Document notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ReviewKYCDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  @IsUUID()
  documentId: string;

  @ApiProperty({
    description: 'Review decision',
    enum: ['VERIFIED', 'REJECTED'],
  })
  @IsEnum(['VERIFIED', 'REJECTED'])
  decision: 'VERIFIED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Review notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class KYCDocumentResponseDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'KYC ID' })
  kycId: string;

  @ApiProperty({ description: 'Document type', enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ description: 'Document URL' })
  url: string;

  @ApiProperty({ description: 'Document status', enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}
