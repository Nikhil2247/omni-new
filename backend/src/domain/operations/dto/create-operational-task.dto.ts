// ============================================================================
// CREATE OPERATIONAL TASK DTO - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { TaskPriority } from './operational-task.dto';

export class CreateOperationalTaskDto {
  @ApiProperty({ description: 'Active event ID' })
  @IsUUID()
  activeEventId: string;

  @ApiProperty({ description: 'Task title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Task description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Task category', nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Priority',
    enum: TaskPriority,
    default: TaskPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Assign to user ID', nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Assign to vendor ID', nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToVendorId?: string;

  @ApiProperty({ description: 'Assigned by user ID' })
  @IsUUID()
  assignedBy: string;
}
