// ============================================================================
// PUBLIC RSVP DTO - Public Gateway
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export enum PublicRSVPStatus {
  ATTENDING = 'ATTENDING',
  NOT_ATTENDING = 'NOT_ATTENDING',
  MAYBE = 'MAYBE',
}

export class PublicRsvpSubmitDto {
  @ApiProperty({
    description: 'RSVP status',
    enum: PublicRSVPStatus,
    example: 'ATTENDING',
  })
  @IsEnum(PublicRSVPStatus)
  rsvpStatus: PublicRSVPStatus;

  @ApiPropertyOptional({
    description: 'Number of additional guests (plus ones)',
    minimum: 0,
    maximum: 10,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  plusOne?: number;

  @ApiPropertyOptional({
    description: 'Dietary requirements',
    example: 'Vegetarian',
  })
  @IsOptional()
  @IsString()
  dietaryReq?: string;

  @ApiPropertyOptional({
    description: 'Message for the hosts',
    example: 'Looking forward to celebrating with you!',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
