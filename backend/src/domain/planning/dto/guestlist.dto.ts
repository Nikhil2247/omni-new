// ============================================================================
// GUESTLIST DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
  isBoolean,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export enum RSVPStatus {
  PENDING = 'PENDING',
  ATTENDING = 'ATTENDING',
  NOT_ATTENDING = 'NOT_ATTENDING',
  MAYBE = 'MAYBE',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateGuestDto {
  @ApiProperty({ description: 'Guest first name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'Guest last name',
    example: 'Doe',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Guest email',
    example: 'john@example.com',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Guest phone',
    example: '+1234567890',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Number of plus ones',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  plusOne?: number;

  @ApiPropertyOptional({
    description: 'Table number assignment',
    example: 5,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  tableNumber?: number;

  @ApiPropertyOptional({
    description: 'Dietary requirements',
    example: 'Vegetarian, No nuts',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  dietaryReq?: string;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateGuestlistDto {
  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  eventId: string;
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateGuestDto {
  @ApiPropertyOptional({ description: 'Guest first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Guest last name', nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Guest email', nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Guest phone', nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'RSVP status', enum: RSVPStatus })
  @IsOptional()
  @IsEnum(RSVPStatus)
  rsvpStatus?: RSVPStatus;

  @ApiPropertyOptional({ description: 'Number of plus ones' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  plusOne?: number;

  @ApiPropertyOptional({
    description: 'Table number assignment',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  tableNumber?: number;

  @ApiPropertyOptional({ description: 'Dietary requirements', nullable: true })
  @IsOptional()
  @IsString()
  dietaryReq?: string;

  @ApiPropertyOptional({ description: 'Additional notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGuestlistDto {
  @ApiPropertyOptional({ description: 'Guestlist name' })
  @IsOptional()
  @IsString()
  @Length(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @Length(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Maximum capacity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Whether RSVP is required' })
  @IsOptional()
  @IsBoolean()
  rsvpRequired?: boolean;

  @ApiPropertyOptional({ description: 'RSVP deadline date' })
  @IsOptional()
  @IsDateString()
  rsvpDeadline?: string;
}

export class UpdateRSVPDto {
  @ApiProperty({ description: 'RSVP status', enum: RSVPStatus })
  @IsEnum(RSVPStatus)
  rsvpStatus: RSVPStatus;

  @ApiPropertyOptional({ description: 'Number of plus ones' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  plusOne?: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class GuestResponseDto {
  @ApiProperty({ description: 'Guest ID' })
  id: string;

  @ApiProperty({ description: 'Guestlist ID' })
  guestlistId: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name', nullable: true })
  lastName: string | null;

  @ApiPropertyOptional({ description: 'Email', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ description: 'Phone', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'RSVP status', enum: RSVPStatus })
  rsvpStatus: RSVPStatus;

  @ApiProperty({ description: 'Plus ones count' })
  plusOne: number;

  @ApiPropertyOptional({ description: 'Table number', nullable: true })
  tableNumber: number | null;

  @ApiPropertyOptional({ description: 'Dietary requirements', nullable: true })
  dietaryReq: string | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

export class GuestlistResponseDto {
  @ApiProperty({ description: 'Guestlist ID' })
  id: string;

  @ApiProperty({ description: 'Event ID' })
  eventId: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Guests', type: [GuestResponseDto] })
  guests?: GuestResponseDto[];
}

export class GuestlistStatsDto {
  @ApiProperty({ description: 'Total guests invited' })
  totalInvited: number;

  @ApiProperty({ description: 'Confirmed guests' })
  confirmed: number;

  @ApiProperty({ description: 'Declined guests' })
  declined: number;

  @ApiProperty({ description: 'Pending responses' })
  pending: number;

  @ApiProperty({ description: 'Total expected (including plus ones)' })
  totalExpected: number;
}
