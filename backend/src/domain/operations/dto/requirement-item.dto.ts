// ============================================================================
// REQUIREMENT ITEM DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { RequirementStatus } from './requirement-sheet.dto';

export class CreateRequirementItemDto {
  @ApiProperty({ description: 'Category' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Quantity', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Estimated budget', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedBudget?: number;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRequirementItemDto {
  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Estimated budget', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedBudget?: number;

  @ApiPropertyOptional({ description: 'Status', enum: RequirementStatus })
  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
