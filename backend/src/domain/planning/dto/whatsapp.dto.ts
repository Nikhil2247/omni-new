// ============================================================================
// WHATSAPP DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WhatsAppMessageType, WhatsAppMessageStatus } from '@prisma/client';

// Re-export Prisma enums for convenience
export { WhatsAppMessageType, WhatsAppMessageStatus };

// ============================================================================
// REQUEST DTOs
// ============================================================================

export class SendWhatsAppInviteDto {
  @ApiProperty({ description: 'Array of guest IDs to send invites to' })
  @IsArray()
  @IsUUID('4', { each: true })
  guestIds: string[];

  @ApiPropertyOptional({ description: 'Template ID to use' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Custom message to send' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class WhatsAppFilterDto {
  @ApiPropertyOptional({ description: 'Filter by RSVP status', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rsvpStatus?: string[];

  @ApiPropertyOptional({ description: 'Filter only guests with phone numbers' })
  @IsOptional()
  @IsBoolean()
  hasPhone?: boolean;
}

export class SendWhatsAppBulkDto {
  @ApiProperty({ description: 'Guestlist ID' })
  @IsUUID()
  guestlistId: string;

  @ApiPropertyOptional({ description: 'Filter criteria' })
  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppFilterDto)
  filter?: WhatsAppFilterDto;

  @ApiPropertyOptional({ description: 'Template ID to use' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Custom message to send' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class WhatsAppMessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Guest ID' })
  guestId: string;

  @ApiProperty({ description: 'Guest name' })
  guestName: string;

  @ApiProperty({ description: 'Guest phone' })
  guestPhone: string;

  @ApiProperty({ description: 'Message type', enum: WhatsAppMessageType })
  messageType: WhatsAppMessageType;

  @ApiProperty({ description: 'Message status', enum: WhatsAppMessageStatus })
  status: WhatsAppMessageStatus;

  @ApiPropertyOptional({ description: 'When message was sent', nullable: true })
  sentAt: Date | null;

  @ApiPropertyOptional({
    description: 'When message was delivered',
    nullable: true,
  })
  deliveredAt: Date | null;

  @ApiPropertyOptional({ description: 'When message was read', nullable: true })
  readAt: Date | null;

  @ApiPropertyOptional({
    description: 'Error message if failed',
    nullable: true,
  })
  errorMessage: string | null;
}

export class WhatsAppTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Message type', enum: WhatsAppMessageType })
  type: WhatsAppMessageType;

  @ApiProperty({ description: 'Template content with variables' })
  content: string;

  @ApiProperty({ description: 'List of variable names', type: [String] })
  variables: string[];
}

export class WhatsAppInviteResponseDto {
  @ApiProperty({ description: 'Whether operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Number of messages sent' })
  sent: number;

  @ApiProperty({ description: 'Number of messages that failed' })
  failed: number;

  @ApiPropertyOptional({
    description: 'Error details for failed messages',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        guestId: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  errors?: { guestId: string; error: string }[];
}

export class WhatsAppSummaryResponseDto {
  @ApiProperty({ description: 'Total messages sent' })
  totalSent: number;

  @ApiProperty({ description: 'Messages delivered' })
  delivered: number;

  @ApiProperty({ description: 'Messages read' })
  read: number;

  @ApiProperty({ description: 'Messages pending' })
  pending: number;

  @ApiProperty({ description: 'Messages failed' })
  failed: number;
}
