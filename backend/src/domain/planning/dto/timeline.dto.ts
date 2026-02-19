// ============================================================================
// TIMELINE DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTimelineItemDto {
  @ApiProperty({ description: 'Item title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Scheduled time (ISO 8601)' })
  @IsDateString()
  scheduledTime: string;

  @ApiPropertyOptional({ description: 'Duration (minutes)', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}

export class CreateTimelineDto {
  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ description: 'Timeline name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Event date (ISO 8601)' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({
    description: 'Timeline items',
    type: [CreateTimelineItemDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTimelineItemDto)
  items?: CreateTimelineItemDto[];
}

export class UpdateTimelineItemDto {
  @ApiPropertyOptional({ description: 'Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Scheduled time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @ApiPropertyOptional({ description: 'Duration (minutes)', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Is completed' })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}

export class TimelineItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Timeline ID' })
  timelineId: string;

  @ApiProperty({ description: 'Title' })
  title: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Scheduled time' })
  scheduledTime: Date;

  @ApiPropertyOptional({ description: 'Duration', nullable: true })
  duration: number | null;

  @ApiProperty({ description: 'Is completed' })
  isCompleted: boolean;

  @ApiPropertyOptional({ description: 'Completed at', nullable: true })
  completedAt: Date | null;
}

export class TimelineResponseDto {
  @ApiProperty({ description: 'Timeline ID' })
  id: string;

  @ApiProperty({ description: 'Event ID' })
  eventId: string;

  @ApiProperty({ description: 'Name' })
  name: string;

  @ApiProperty({ description: 'Event date' })
  eventDate: Date;

  @ApiPropertyOptional({
    description: 'Items',
    type: [TimelineItemResponseDto],
  })
  items?: TimelineItemResponseDto[];
}
