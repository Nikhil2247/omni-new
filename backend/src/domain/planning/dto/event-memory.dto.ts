// ============================================================================
// EVENT MEMORY DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateEventMemoryDto {
  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  eventId: string;

  @ApiPropertyOptional({ description: 'QR code value', nullable: true })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional({ description: 'QR code image URL', nullable: true })
  @IsOptional()
  @IsString()
  qrCodeUrl?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Allow uploads', default: true })
  @IsOptional()
  @IsBoolean()
  allowUploads?: boolean;

  @ApiPropertyOptional({ description: 'Require approval', default: false })
  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @ApiPropertyOptional({ description: 'Expires at (ISO 8601)', nullable: true })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
