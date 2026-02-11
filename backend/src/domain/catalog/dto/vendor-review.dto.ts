// ============================================================================
// VENDOR REVIEW DTOs - Catalog Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsOptional, IsString, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class ReviewMediaInputDto {
  @ApiProperty({ description: 'Media URL' })
  @IsString()
  url: string

  @ApiProperty({ description: 'Mime type' })
  @IsString()
  mimeType: string

  @ApiProperty({ description: 'File size (bytes)' })
  @IsInt()
  @Min(1)
  fileSize: number

  @ApiPropertyOptional({ description: 'Thumbnail URL', nullable: true })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string
}

export class CreateVendorReviewDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string

  @ApiPropertyOptional({ description: 'Event ID', nullable: true })
  @IsOptional()
  @IsUUID()
  eventId?: string

  @ApiProperty({ description: 'Rating (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @ApiPropertyOptional({ description: 'Review title', nullable: true })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: 'Review body', nullable: true })
  @IsOptional()
  @IsString()
  body?: string

  @ApiPropertyOptional({ description: 'Review media', type: [ReviewMediaInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewMediaInputDto)
  media?: ReviewMediaInputDto[]
}

export class UpdateVendorReviewDto {
  @ApiPropertyOptional({ description: 'Rating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number

  @ApiPropertyOptional({ description: 'Review title', nullable: true })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: 'Review body', nullable: true })
  @IsOptional()
  @IsString()
  body?: string
}

export class RespondVendorReviewDto {
  @ApiProperty({ description: 'Response text' })
  @IsString()
  response: string
}
