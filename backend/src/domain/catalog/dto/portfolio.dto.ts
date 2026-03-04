// ============================================================================
// PORTFOLIO DTOs - Catalog Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CatalogMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class CreateMediaItemDto {
  @ApiProperty({ description: 'Media type', enum: CatalogMediaType })
  @IsEnum(CatalogMediaType)
  type: CatalogMediaType;

  @ApiProperty({ description: 'Media URL' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL', nullable: true })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'CDN URL', nullable: true })
  @IsOptional()
  @IsString()
  cdnUrl?: string;

  @ApiPropertyOptional({ description: 'Alt text', nullable: true })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'Caption/description', nullable: true })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ description: 'Width', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ description: 'Height', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ description: 'Duration (seconds)', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiProperty({ description: 'Size in bytes' })
  @IsInt()
  @Min(0)
  size: number;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is approved', default: true })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}

export class CreatePortfolioDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string;

  @ApiProperty({ description: 'Title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is featured', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Media items',
    type: [CreateMediaItemDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaItemDto)
  mediaItems?: CreateMediaItemDto[];
}

export class UpdatePortfolioDto {
  @ApiPropertyOptional({ description: 'Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is featured' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateMediaItemDto {
  @ApiPropertyOptional({ description: 'Alt text', nullable: true })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'Caption/description', nullable: true })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class PortfolioResponseDto {
  @ApiProperty({ description: 'Portfolio ID' })
  id: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;

  @ApiProperty({ description: 'Title' })
  title: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Is featured' })
  isFeatured: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export enum PortfolioMediaOrderBy {
  RANDOM = 'random',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class SearchPortfolioMediaDto {
  @ApiPropertyOptional({
    description: 'Search query (vendor name or description)',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by city ID' })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 24;

  @ApiPropertyOptional({
    description: 'Order by',
    enum: PortfolioMediaOrderBy,
    default: PortfolioMediaOrderBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(PortfolioMediaOrderBy)
  orderBy?: PortfolioMediaOrderBy = PortfolioMediaOrderBy.NEWEST;
}

export class PortfolioMediaVendorDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  id: string;

  @ApiProperty({ description: 'Vendor slug' })
  slug: string;

  @ApiProperty({ description: 'Business name' })
  businessName: string;

  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiPropertyOptional({ description: 'Category name', nullable: true })
  categoryName?: string | null;
}

export class PortfolioMediaItemResponseDto {
  @ApiProperty({ description: 'Media item ID' })
  id: string;

  @ApiProperty({ description: 'Portfolio ID' })
  portfolioId: string;

  @ApiProperty({ description: 'Media type', enum: CatalogMediaType })
  type: CatalogMediaType;

  @ApiProperty({ description: 'Media URL' })
  url: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL', nullable: true })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ description: 'CDN URL', nullable: true })
  cdnUrl?: string | null;

  @ApiPropertyOptional({ description: 'Alt text', nullable: true })
  altText?: string | null;

  @ApiPropertyOptional({ description: 'Caption/description', nullable: true })
  caption?: string | null;

  @ApiPropertyOptional({ description: 'Width', nullable: true })
  width?: number | null;

  @ApiPropertyOptional({ description: 'Height', nullable: true })
  height?: number | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Vendor info' })
  vendor: PortfolioMediaVendorDto;
}
