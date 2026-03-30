// ============================================================================
// SERVICE ITEM DTOs - Catalog Domain
// ============================================================================
// DTOs for managing menu items/line items within services
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  IsInt,
  IsBoolean,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a service item
 */
export class CreateServiceItemDto {
  @ApiProperty({ description: 'Item name', example: 'Paneer Tikka' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'Marinated cottage cheese grilled to perfection',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Item image URL',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Item price', example: 250 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Currency',
    default: 'INR',
    example: 'INR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Pricing unit',
    example: 'per plate',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({
    description: 'Minimum quantity',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({
    description: 'Maximum quantity',
    nullable: true,
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxQuantity?: number;

  @ApiPropertyOptional({
    description: 'Whether item is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether item must be included in service',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Display order',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/**
 * DTO for updating a service item
 */
export class UpdateServiceItemDto {
  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Item description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Item image URL', nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Item price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Pricing unit', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ description: 'Minimum quantity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity', nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Whether item is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether item must be included' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/**
 * DTO for reordering service items
 */
export class ReorderServiceItemsDto {
  @ApiProperty({
    description: 'Array of item IDs in new order',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsUUID('4', { each: true })
  itemIds: string[];
}

/**
 * Response DTO for service item
 */
export class ServiceItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Service ID' })
  serviceId: string;

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiPropertyOptional({ description: 'Item description', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Item image URL', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ description: 'Item price' })
  price: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Pricing unit', nullable: true })
  unit: string | null;

  @ApiProperty({ description: 'Minimum quantity' })
  minQuantity: number;

  @ApiPropertyOptional({ description: 'Maximum quantity', nullable: true })
  maxQuantity: number | null;

  @ApiProperty({ description: 'Whether item is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether item must be included' })
  isRequired: boolean;

  @ApiProperty({ description: 'Display order' })
  sortOrder: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}
