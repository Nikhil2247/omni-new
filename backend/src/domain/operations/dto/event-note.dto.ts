// ============================================================================
// EVENT NOTE DTO - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateEventNoteDto {
  @ApiProperty({ description: 'Active event ID' })
  @IsUUID()
  activeEventId: string;

  @ApiProperty({ description: 'Author user ID' })
  @IsUUID()
  authorId: string;

  @ApiProperty({ description: 'Note content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Is internal note', default: true })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
