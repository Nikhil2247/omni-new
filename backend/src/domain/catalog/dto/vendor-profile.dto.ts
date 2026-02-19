// ============================================================================
// VENDOR PROFILE DTOs - Data Transfer Objects for Vendor Profile Operations
// ============================================================================

import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  IsUUID,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { VendorStatus } from '@prisma/client';

// ============================================================================
// CREATE VENDOR PROFILE
// ============================================================================

export class CreateVendorProfileDto {
  @ApiProperty({ description: 'User ID (owner of the profile)' })
  @IsOptional()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Business name' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ description: 'Business slug (unique identifier)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description:
      'Service category identifier (UUID, slug, name, or legacy cat-N)',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Business tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Business description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Address ID' })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional({ description: 'Service radius in miles' })
  @IsOptional()
  @IsInt()
  @Min(0)
  serviceRadius?: number;

  @ApiPropertyOptional({ description: 'Service area city IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serviceAreaCityIds?: string[];

  @ApiPropertyOptional({ description: 'Profile photo URL' })
  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;
}

// ============================================================================
// UPDATE VENDOR PROFILE
// ============================================================================

export class UpdateVendorProfileDto extends PartialType(
  CreateVendorProfileDto,
) {
  @ApiPropertyOptional({ enum: VendorStatus })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}

// ============================================================================
// SEARCH/FILTER VENDOR PROFILES
// ============================================================================

export class SearchVendorProfileDto {
  @ApiPropertyOptional({
    description: 'Search query (name, tagline, description)',
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

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'leadCount', 'viewCount'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'leadCount' | 'viewCount';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// SEARCH/FILTER VENDORS (SEARCH INDEX)
// ============================================================================

export class SearchVendorIndexDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by city name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by service area city ID' })
  @IsOptional()
  @IsUUID()
  serviceAreaCityId?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Filter verified vendors only' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'viewCount', 'leadCount', 'minPrice'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'viewCount' | 'leadCount' | 'minPrice';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// SEARCH NEARBY VENDORS (GEO SEARCH)
// ============================================================================

export class SearchNearbyVendorsDto {
  @ApiPropertyOptional({ description: 'Full-text search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Latitude' })
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude' })
  @Type(() => Number)
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ description: 'Radius in meters', default: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  radiusInMeters?: number = 50000;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

// ============================================================================
// SEARCH SUGGESTIONS
// ============================================================================

export class VendorSuggestionsDto {
  @ApiProperty({ description: 'Search query' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Number of suggestions', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 5;
}

// ============================================================================
// VENDOR PROFILE RESPONSE
// ============================================================================

export class VendorProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  categoryId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  tagline?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiPropertyOptional()
  contactPhone?: string | null;

  @ApiPropertyOptional()
  contactEmail?: string | null;

  @ApiPropertyOptional()
  website?: string | null;

  @ApiPropertyOptional()
  addressId?: string | null;

  @ApiPropertyOptional()
  serviceRadius?: number | null;

  @ApiPropertyOptional()
  profilePhotoUrl?: string | null;

  @ApiProperty({ enum: VendorStatus })
  status: VendorStatus;

  @ApiProperty()
  leadCount: number;

  @ApiProperty()
  viewCount: number;

  @ApiPropertyOptional()
  followersCount?: number;

  @ApiPropertyOptional()
  reviewsCount?: number;

  @ApiPropertyOptional()
  averageRating?: number | null;

  @ApiPropertyOptional()
  verifiedAt?: Date | null;

  @ApiPropertyOptional()
  featuredUntil?: Date | null;

  @ApiPropertyOptional({
    description: 'Whether the current user follows this vendor',
  })
  isFollowing?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations (optional, can be included)
  category?: any;
  address?: any;
  serviceAreas?: any[];
  services?: any[];
  portfolios?: any[];
  badges?: any[];
  eventHistory?: any[];
}
