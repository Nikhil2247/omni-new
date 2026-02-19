// ============================================================================
// CONVERSATION DTOs - Messaging Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateVendorConversationDto {
  @ApiProperty({
    description: 'Vendor profile ID to start a direct conversation with',
  })
  @IsUUID()
  vendorProfileId: string;
}

export class CreateDirectConversationDto {
  @ApiProperty({
    description: 'Target user ID to start a direct conversation with',
  })
  @IsUUID()
  participantUserId: string;
}

export class GetConversationsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
