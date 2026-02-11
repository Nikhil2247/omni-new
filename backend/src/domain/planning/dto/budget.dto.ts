// ============================================================================
// BUDGET DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsNumber, IsBoolean, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateBudgetItemDto {
  @ApiProperty({ description: 'Category', example: 'Venue' })
  @IsString()
  category: string

  @ApiProperty({ description: 'Item name', example: 'Venue rental fee' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'Estimated cost', example: 5000.00, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost?: number

  @ApiPropertyOptional({ description: 'Actual cost', example: 4800.00, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actualCost?: number

  @ApiPropertyOptional({ description: 'Payment status', default: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string
}

export class CreateBudgetDto {
  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  eventId: string

  @ApiProperty({ description: 'Total budget amount', example: 50000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalBudget: number

  @ApiPropertyOptional({ description: 'Initial budget items', type: [CreateBudgetItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetItemDto)
  items?: CreateBudgetItemDto[]
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateBudgetItemDto {
  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ description: 'Item name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Estimated cost', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost?: number

  @ApiPropertyOptional({ description: 'Actual cost', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actualCost?: number

  @ApiPropertyOptional({ description: 'Payment status' })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: 'Total budget amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalBudget?: number
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class BudgetItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string

  @ApiProperty({ description: 'Budget ID' })
  budgetId: string

  @ApiProperty({ description: 'Category' })
  category: string

  @ApiProperty({ description: 'Item name' })
  name: string

  @ApiPropertyOptional({ description: 'Estimated cost', nullable: true })
  estimatedCost: number | null

  @ApiPropertyOptional({ description: 'Actual cost', nullable: true })
  actualCost: number | null

  @ApiProperty({ description: 'Payment status' })
  isPaid: boolean

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null

  @ApiProperty({ description: 'Created at' })
  createdAt: Date
}

export class BudgetResponseDto {
  @ApiProperty({ description: 'Budget ID' })
  id: string

  @ApiProperty({ description: 'Event ID' })
  eventId: string

  @ApiProperty({ description: 'Total budget' })
  totalBudget: number

  @ApiProperty({ description: 'Total spent' })
  totalSpent: number

  @ApiProperty({ description: 'Remaining budget' })
  remaining: number

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Last updated' })
  updatedAt: Date

  @ApiPropertyOptional({ description: 'Budget items', type: [BudgetItemResponseDto] })
  items?: BudgetItemResponseDto[]
} 
