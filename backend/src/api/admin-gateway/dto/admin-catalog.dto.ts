import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

// ============================================================================
// VENDORS
// ============================================================================

/** Statuses an admin may set on a vendor listing (DRAFT/PENDING_REVIEW are owned by the onboarding flow). */
export const ADMIN_VENDOR_STATUSES = [
  'ACTIVE',
  'UNCLAIMED',
  'SUSPENDED',
  'ARCHIVED',
] as const;
export type AdminVendorStatus = (typeof ADMIN_VENDOR_STATUSES)[number];

export class SearchAdminVendorsDto {
  @ApiPropertyOptional({ description: 'Search by name, slug, email or phone' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by vendor status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by category id' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by city id' })
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UpdateAdminVendorStatusDto {
  @ApiPropertyOptional({ enum: ADMIN_VENDOR_STATUSES })
  @IsEnum(ADMIN_VENDOR_STATUSES)
  status!: AdminVendorStatus;
}

// ============================================================================
// CATEGORIES
// ============================================================================

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateAdminCategoryDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @ApiPropertyOptional({ description: 'URL slug; generated from the name when omitted' })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug must be lowercase letters, numbers and hyphens' })
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

export class UpdateAdminCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug must be lowercase letters, numbers and hyphens' })
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  icon?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

// ============================================================================
// LOCATIONS (countries, states, cities)
// ============================================================================

export class CreateAdminCountryDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-3, e.g. IND' })
  @IsString()
  @Length(3, 3)
  code!: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2, e.g. IN' })
  @IsString()
  @Length(2, 2)
  code2!: string;

  @IsOptional()
  @IsString()
  dialCode?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdminCountryDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  code2?: string;

  @IsOptional()
  @IsString()
  dialCode?: string | null;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string | null;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAdminStateDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string;

  @IsUUID()
  countryId!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdminStateDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string | null;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAdminCityDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @IsUUID()
  stateId!: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdminCityDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsUUID()
  stateId?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class SearchAdminCitiesDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsUUID()
  stateId?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
