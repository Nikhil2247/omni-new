// ============================================================================
// GUEST UPLOAD DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsString, IsOptional, IsEmail, IsEnum, IsNumber, IsArray } from 'class-validator'
import { PlanningMediaType, UploadStatus } from '@prisma/client'

// DTO for creating a guest upload (public endpoint)
export class CreateGuestUploadDto {
  @ApiPropertyOptional({ description: 'Name of the person uploading' })
  @IsOptional()
  @IsString()
  uploaderName?: string

  @ApiPropertyOptional({ description: 'Email of the person uploading' })
  @IsOptional()
  @IsEmail()
  uploaderEmail?: string

  @ApiPropertyOptional({ description: 'Caption for the media' })
  @IsOptional()
  @IsString()
  caption?: string
}

// Internal DTO with all fields
export class CreateGuestUploadInternalDto extends CreateGuestUploadDto {
  @ApiProperty({ description: 'Event memory ID' })
  @IsUUID()
  eventMemoryId: string

  @ApiProperty({ description: 'URL of uploaded media' })
  @IsString()
  mediaUrl: string

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string

  @ApiProperty({ description: 'Media type', enum: ['IMAGE', 'VIDEO'] })
  @IsEnum(PlanningMediaType)
  mediaType: PlanningMediaType

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize: number
}

// DTO for updating upload status
export class UpdateUploadStatusDto {
  @ApiProperty({ description: 'New status', enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(UploadStatus)
  status: 'APPROVED' | 'REJECTED'
}

// DTO for bulk operations
export class BulkUploadActionDto {
  @ApiProperty({ description: 'Array of upload IDs' })
  @IsArray()
  @IsUUID('all', { each: true })
  ids: string[]
}

// Response DTO
export class GuestUploadResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  eventMemoryId: string

  @ApiPropertyOptional()
  uploaderName?: string | null

  @ApiPropertyOptional()
  uploaderEmail?: string | null

  @ApiProperty()
  mediaUrl: string

  @ApiPropertyOptional()
  thumbnailUrl?: string | null

  @ApiProperty({ enum: ['IMAGE', 'VIDEO'] })
  mediaType: PlanningMediaType

  @ApiProperty()
  fileSize: number

  @ApiPropertyOptional()
  caption?: string | null

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status: UploadStatus

  @ApiPropertyOptional()
  approvedAt?: Date | null

  @ApiPropertyOptional()
  rejectedAt?: Date | null

  @ApiProperty()
  createdAt: Date
}

// Memory settings response for public endpoint
export class MemorySettingsResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  qrCode: string

  @ApiProperty()
  isActive: boolean

  @ApiProperty()
  allowUploads: boolean

  @ApiProperty()
  requireApproval: boolean

  @ApiPropertyOptional()
  expiresAt?: Date | null

  @ApiPropertyOptional()
  event?: {
    id: string
    name: string
    date?: Date | null
  }
}

// Legacy DTO for CSV guestlist import (renamed for clarity)
export class GuestlistCsvImportDto {
  @ApiProperty({ description: 'Guestlist ID' })
  @IsUUID()
  guestlistId: string

  @ApiProperty({ description: 'CSV file URL' })
  @IsString()
  fileUrl: string
}

// Keep old name as alias for backwards compatibility
export { GuestlistCsvImportDto as GuestUploadLegacyDto }
