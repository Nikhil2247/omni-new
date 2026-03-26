// ============================================================================
// E-INVITE DTOs
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsArray,
  IsObject,
  IsDateString,
} from 'class-validator';
import { EInviteCategory, EInviteChannel } from '@prisma/client';

// ============================================================================
// TEMPLATE DTOs
// ============================================================================

export class CreateEInviteTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: EInviteCategory, description: 'Template category' })
  @IsEnum(EInviteCategory)
  category: EInviteCategory;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Fabric.js canvas JSON' })
  @IsObject()
  canvasJson: Record<string, any>;

  @ApiPropertyOptional({ description: 'Default colors' })
  @IsOptional()
  @IsObject()
  defaultColors?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Is premium template' })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  sortOrder?: number;
}

export class UpdateEInviteTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: EInviteCategory, description: 'Template category' })
  @IsOptional()
  @IsEnum(EInviteCategory)
  category?: EInviteCategory;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Fabric.js canvas JSON' })
  @IsOptional()
  @IsObject()
  canvasJson?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Default colors' })
  @IsOptional()
  @IsObject()
  defaultColors?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is premium template' })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  sortOrder?: number;
}

// ============================================================================
// E-INVITE DTOs
// ============================================================================

export class CreateEInviteDto {
  @ApiProperty({ description: 'Event ID' })
  @IsUUID()
  eventId: string;

  @ApiPropertyOptional({ description: 'Template ID to use' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Custom title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Fabric.js canvas JSON' })
  @IsObject()
  canvasJson: Record<string, any>;

  @ApiPropertyOptional({ description: 'Event name on invite' })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional({ description: 'Event date' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ description: 'Event time' })
  @IsOptional()
  @IsString()
  eventTime?: string;

  @ApiPropertyOptional({ description: 'Venue name' })
  @IsOptional()
  @IsString()
  eventVenue?: string;

  @ApiPropertyOptional({ description: 'Venue address' })
  @IsOptional()
  @IsString()
  eventAddress?: string;

  @ApiPropertyOptional({ description: 'Host names' })
  @IsOptional()
  @IsString()
  hostNames?: string;

  @ApiPropertyOptional({ description: 'Custom message' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class UpdateEInviteDto {
  @ApiPropertyOptional({ description: 'Custom title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Fabric.js canvas JSON' })
  @IsOptional()
  @IsObject()
  canvasJson?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Preview image URL' })
  @IsOptional()
  @IsString()
  previewUrl?: string;

  @ApiPropertyOptional({ description: 'Event name on invite' })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional({ description: 'Event date' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ description: 'Event time' })
  @IsOptional()
  @IsString()
  eventTime?: string;

  @ApiPropertyOptional({ description: 'Venue name' })
  @IsOptional()
  @IsString()
  eventVenue?: string;

  @ApiPropertyOptional({ description: 'Venue address' })
  @IsOptional()
  @IsString()
  eventAddress?: string;

  @ApiPropertyOptional({ description: 'Host names' })
  @IsOptional()
  @IsString()
  hostNames?: string;

  @ApiPropertyOptional({ description: 'Custom message' })
  @IsOptional()
  @IsString()
  customMessage?: string;

  @ApiPropertyOptional({ description: 'Is published' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

// ============================================================================
// SEND E-INVITE DTOs
// ============================================================================

export class SendEInviteDto {
  @ApiProperty({ description: 'Guest IDs to send invite to', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  guestIds: string[];

  @ApiProperty({ enum: EInviteChannel, description: 'Channel to send through' })
  @IsEnum(EInviteChannel)
  channel: EInviteChannel;

  @ApiPropertyOptional({ description: 'Custom message to include' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class BulkSendEInviteDto {
  @ApiProperty({ enum: EInviteChannel, description: 'Channel to send through' })
  @IsEnum(EInviteChannel)
  channel: EInviteChannel;

  @ApiPropertyOptional({ description: 'Custom message to include' })
  @IsOptional()
  @IsString()
  customMessage?: string;

  @ApiPropertyOptional({ description: 'Only send to guests who haven\'t received invite yet' })
  @IsOptional()
  @IsBoolean()
  excludeAlreadySent?: boolean;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class EInviteTemplateResponseDto {
  id: string;
  name: string;
  category: EInviteCategory;
  thumbnailUrl: string | null;
  canvasJson: Record<string, any>;
  defaultColors: Record<string, string> | null;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
  createdAt: Date;
}

export class EInviteResponseDto {
  id: string;
  eventId: string;
  templateId: string | null;
  title: string | null;
  canvasJson: Record<string, any>;
  previewUrl: string | null;
  eventName: string | null;
  eventDate: Date | null;
  eventTime: string | null;
  eventVenue: string | null;
  eventAddress: string | null;
  hostNames: string | null;
  customMessage: string | null;
  shareCode: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  template?: EInviteTemplateResponseDto | null;
  sentCount?: number;
  viewedCount?: number;
}

export class EInviteSentResponseDto {
  id: string;
  einviteId: string;
  guestId: string;
  channel: EInviteChannel;
  status: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  viewedAt: Date | null;
  guest?: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  };
}
