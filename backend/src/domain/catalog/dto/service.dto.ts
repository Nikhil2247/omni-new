// ============================================================================
// SERVICE DTOs - Catalog Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, Min, ValidateNested, IsInt } from 'class-validator'
import { Type } from 'class-transformer'

export enum PricingType {
  FIXED = 'FIXED',
  RANGE = 'RANGE',
  STARTING_AT = 'STARTING_AT',
  TIERED = 'TIERED',
  CONTACT_FOR_QUOTE = 'CONTACT_FOR_QUOTE',
}

export class CreatePricingTierDto {
  @ApiProperty({ description: 'Tier name' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number

  @ApiProperty({ description: 'Unit', example: 'per event' })
  @IsString()
  unit: string

  @ApiPropertyOptional({ description: 'Min quantity', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  minQuantity?: number

  @ApiPropertyOptional({ description: 'Max quantity', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxQuantity?: number

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class CreateServiceDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string

  @ApiPropertyOptional({ description: 'Service type ID', nullable: true })
  @IsOptional()
  @IsUUID()
  serviceTypeId?: string

  @ApiProperty({ description: 'Service name' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Pricing type', enum: PricingType })
  @IsEnum(PricingType)
  pricingType: PricingType

  @ApiPropertyOptional({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiPropertyOptional({ description: 'Starting price', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  startingPrice?: number

  @ApiPropertyOptional({ description: 'Max price', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number

  @ApiPropertyOptional({ description: 'Pricing tiers', type: [CreatePricingTierDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePricingTierDto)
  pricingTiers?: CreatePricingTierDto[]
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Service name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Pricing type', enum: PricingType })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType

  @ApiPropertyOptional({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiPropertyOptional({ description: 'Starting price', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  startingPrice?: number

  @ApiPropertyOptional({ description: 'Max price', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number

  @ApiPropertyOptional({ description: 'Active' })
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  sortOrder?: number
}

export class ServiceResponseDto {
  @ApiProperty({ description: 'Service ID' })
  id: string

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string

  @ApiPropertyOptional({ description: 'Service type ID', nullable: true })
  serviceTypeId: string | null

  @ApiProperty({ description: 'Service name' })
  name: string

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  description: string | null

  @ApiProperty({ description: 'Pricing type', enum: PricingType })
  pricingType: PricingType

  @ApiProperty({ description: 'Currency' })
  currency: string

  @ApiPropertyOptional({ description: 'Starting price', nullable: true })
  startingPrice: number | null

  @ApiPropertyOptional({ description: 'Max price', nullable: true })
  maxPrice: number | null

  @ApiProperty({ description: 'Active' })
  isActive: boolean

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date
}
