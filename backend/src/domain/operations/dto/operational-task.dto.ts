// ============================================================================
// OPERATIONAL TASK DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum OperationalTaskStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class OperationalTaskResponseDto {
  @ApiProperty({ description: 'Task ID' })
  id: string;

  @ApiProperty({ description: 'Active event ID' })
  activeEventId: string;

  @ApiProperty({ description: 'Title' })
  title: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Category', nullable: true })
  category: string | null;

  @ApiProperty({ description: 'Priority', enum: TaskPriority })
  priority: TaskPriority;

  @ApiPropertyOptional({ description: 'Due date', nullable: true })
  dueDate: Date | null;

  @ApiPropertyOptional({ description: 'Assigned user ID', nullable: true })
  assignedToUserId: string | null;

  @ApiPropertyOptional({ description: 'Assigned vendor ID', nullable: true })
  assignedToVendorId: string | null;

  @ApiProperty({ description: 'Assigned by user ID' })
  assignedBy: string;

  @ApiProperty({ description: 'Status', enum: OperationalTaskStatus })
  status: OperationalTaskStatus;

  @ApiPropertyOptional({ description: 'Submitted at', nullable: true })
  submittedAt: Date | null;

  @ApiPropertyOptional({ description: 'Reviewed by', nullable: true })
  reviewedBy: string | null;

  @ApiPropertyOptional({ description: 'Reviewed at', nullable: true })
  reviewedAt: Date | null;

  @ApiPropertyOptional({ description: 'Review notes', nullable: true })
  reviewNotes: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class UpdateOperationalTaskDto {
  @ApiPropertyOptional({ description: 'Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category', nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Priority', enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Due date', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Assigned to user', nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({ description: 'Assigned to vendor', nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToVendorId?: string;

  @ApiPropertyOptional({ description: 'Status', enum: OperationalTaskStatus })
  @IsOptional()
  @IsEnum(OperationalTaskStatus)
  status?: OperationalTaskStatus;
}
