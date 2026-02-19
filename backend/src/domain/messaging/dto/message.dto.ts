// ============================================================================
// MESSAGE DTOs - Messaging Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MessageAttachmentTypeDto {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

export class MessageAttachmentInputDto {
  @ApiProperty({
    description: 'Attachment type',
    enum: MessageAttachmentTypeDto,
  })
  @IsEnum(MessageAttachmentTypeDto)
  type: MessageAttachmentTypeDto;

  @ApiProperty({ description: 'File URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File size (bytes)' })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({ description: 'Mime type' })
  @IsString()
  mimeType: string;
}

export class SendMessageDto {
  @ApiPropertyOptional({
    description: 'Conversation ID (optional if provided by route)',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Attachments',
    type: [MessageAttachmentInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentInputDto)
  attachments?: MessageAttachmentInputDto[];
}

export class GetConversationMessagesDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Messages per page',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class MarkReadDto {
  @ApiProperty({ description: 'Message ID' })
  @IsUUID()
  messageId: string;
}

export class AddReactionDto {
  @ApiPropertyOptional({ description: 'Message ID (provided via route param)' })
  @IsOptional()
  @IsUUID()
  messageId?: string;

  @ApiProperty({ description: 'Emoji or reaction code' })
  @IsString()
  emoji: string;
}

export class DeleteMessageDto {
  @ApiProperty({ description: 'Message ID' })
  @IsUUID()
  messageId: string;
}
