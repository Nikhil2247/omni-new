// ============================================================================
// MESSAGE DTOs - Leads Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateMessageDto {
  @ApiProperty({ description: 'Lead ID' })
  @IsUUID()
  leadId: string;

  @ApiProperty({ description: 'Sender user ID' })
  @IsUUID()
  senderId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I am interested in your services',
  })
  @IsString()
  content: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id: string;

  @ApiProperty({ description: 'Lead ID' })
  leadId: string;

  @ApiProperty({ description: 'Sender ID' })
  senderId: string;

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiPropertyOptional({ description: 'Read at timestamp', nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

export class GetMessagesDto {
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
