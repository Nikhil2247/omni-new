// ============================================================================
// CHECKLIST DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsBoolean, IsInt, IsDateString, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateChecklistItemDto {
  @ApiProperty({ description: 'Task title', example: 'Book venue' })
  @IsString()
  title: string

  @ApiPropertyOptional({ description: 'Task description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)', example: '2024-06-15T10:00:00Z', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string

  @ApiPropertyOptional({ description: 'Sort order', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number
}

export class CreateChecklistDto {
  @ApiProperty({ description: 'Event ID this checklist belongs to' })
  @IsUUID()
  eventId: string

  @ApiProperty({ description: 'Checklist name', example: 'Venue Checklist' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'Sort order', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  @ApiPropertyOptional({ description: 'Initial items to create', type: [CreateChecklistItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items?: CreateChecklistItemDto[]
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateChecklistItemDto {
  @ApiPropertyOptional({ description: 'Task title' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: 'Task description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string

  @ApiPropertyOptional({ description: 'Completion status' })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number
}

export class UpdateChecklistDto {
  @ApiPropertyOptional({ description: 'Checklist name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class ChecklistItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string

  @ApiProperty({ description: 'Parent checklist ID' })
  checklistId: string

  @ApiProperty({ description: 'Task title' })
  title: string

  @ApiPropertyOptional({ description: 'Task description', nullable: true })
  description: string | null

  @ApiPropertyOptional({ description: 'Due date', nullable: true })
  dueDate: Date | null

  @ApiProperty({ description: 'Completion status' })
  isCompleted: boolean

  @ApiPropertyOptional({ description: 'Completion timestamp', nullable: true })
  completedAt: Date | null

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number

  @ApiProperty({ description: 'Created at' })
  createdAt: Date
}

export class ChecklistResponseDto {
  @ApiProperty({ description: 'Checklist ID' })
  id: string

  @ApiProperty({ description: 'Event ID' })
  eventId: string

  @ApiProperty({ description: 'Checklist name' })
  name: string

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiPropertyOptional({ description: 'Checklist items', type: [ChecklistItemResponseDto] })
  items?: ChecklistItemResponseDto[]
} 
