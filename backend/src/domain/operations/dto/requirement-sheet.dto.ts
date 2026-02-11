// ============================================================================
// REQUIREMENT SHEET DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsInt, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export enum RequirementStatus {
  PENDING = 'PENDING',
  SOURCING = 'SOURCING',
  VENDOR_SELECTED = 'VENDOR_SELECTED',
  CONTRACTED = 'CONTRACTED',
  FULFILLED = 'FULFILLED',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateRequirementItemDto {
  @ApiProperty({ description: 'Category', example: 'Photography' })
  @IsString()
  category: string

  @ApiProperty({ description: 'Description', example: '1 Professional Photographer with editing' })
  @IsString()
  description: string

  @ApiPropertyOptional({ description: 'Quantity', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number

  @ApiPropertyOptional({ description: 'Estimated budget', example: 5000.00, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedBudget?: number

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string
}

export class CreateRequirementSheetDto {
  @ApiProperty({ description: 'Active event ID' })
  @IsUUID()
  activeEventId: string

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ description: 'Initial requirement items', type: [CreateRequirementItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRequirementItemDto)
  items?: CreateRequirementItemDto[]
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateRequirementItemDto {
  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number

  @ApiPropertyOptional({ description: 'Estimated budget', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedBudget?: number

  @ApiPropertyOptional({ description: 'Status', enum: RequirementStatus })
  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateRequirementSheetDto {
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class RequirementItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string

  @ApiProperty({ description: 'Requirement sheet ID' })
  requirementSheetId: string

  @ApiProperty({ description: 'Category' })
  category: string

  @ApiProperty({ description: 'Description' })
  description: string

  @ApiProperty({ description: 'Quantity' })
  quantity: number

  @ApiPropertyOptional({ description: 'Estimated budget', nullable: true })
  estimatedBudget: number | null

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null

  @ApiProperty({ description: 'Status', enum: RequirementStatus })
  status: RequirementStatus

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date
}

export class RequirementSheetResponseDto {
  @ApiProperty({ description: 'Sheet ID' })
  id: string

  @ApiProperty({ description: 'Active event ID' })
  activeEventId: string

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date

  @ApiPropertyOptional({ description: 'Requirement items', type: [RequirementItemResponseDto] })
  items?: RequirementItemResponseDto[]
} 
