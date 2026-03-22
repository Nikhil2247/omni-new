import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const FEATURE_CATEGORIES = ['marketing', 'vendor', 'user', 'system'] as const;
type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export class CreateFeatureFlagDto {
  @ApiProperty({ description: 'Unique key for the feature flag' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_.-]+$/)
  key: string;

  @ApiProperty({ description: 'Display name for the feature' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the feature' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category of the feature',
    enum: FEATURE_CATEGORIES,
    default: 'system',
  })
  @IsOptional()
  @IsIn(FEATURE_CATEGORIES)
  category?: FeatureCategory;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a system flag (cannot be deleted)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ description: 'Display name for the feature' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the feature' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category of the feature',
    enum: FEATURE_CATEGORIES,
  })
  @IsOptional()
  @IsIn(FEATURE_CATEGORIES)
  category?: FeatureCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class BulkUpdateFeatureFlagsDto {
  @ApiProperty({ description: 'Array of feature flag IDs to update' })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];

  @ApiProperty({ description: 'Enable or disable the flags' })
  @IsBoolean()
  enabled: boolean;
}
