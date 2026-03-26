// ============================================================================
// EVENT DTOs - Planning Domain
// ============================================================================

import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EventTier } from '@prisma/client';

export enum EventStatus {
  PLANNING = 'PLANNING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Event type ID' })
  @IsUUID()
  eventTypeId: string;

  @ApiProperty({ description: 'Event date' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Venue/location' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ description: 'Expected guest count' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedGuests?: number;

  @ApiPropertyOptional({ description: 'Address ID' })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional({
    description: 'Event tier (BASIC or PREMIUM). Determines feature limits.',
    enum: ['BASIC', 'PREMIUM'],
    default: 'BASIC',
  })
  @IsOptional()
  @IsEnum(EventTier)
  tier?: EventTier;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class SearchEventDto {
  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Event type ID' })
  @IsOptional()
  @IsUUID()
  eventTypeId?: string;

  @ApiPropertyOptional({ description: 'From date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'To date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  eventTypeId: string;

  @ApiProperty()
  eventDate: Date;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  venue?: string;

  @ApiPropertyOptional()
  expectedGuests?: number;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  eventType?: unknown;
  address?: unknown;
  checklist?: unknown;
  budget?: unknown;
  guestList?: unknown;
  timeline?: unknown;
  vendors?: unknown[];
}
