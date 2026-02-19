// ============================================================================
// MEDIA TAG DTOs - Catalog Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class AddMediaTagsDto {
  @ApiProperty({ description: 'Media item ID' })
  @IsUUID()
  mediaItemId: string;

  @ApiProperty({
    description: 'Tags to apply',
    example: ['wedding', 'outdoor'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class RemoveMediaTagDto {
  @ApiProperty({ description: 'Media item ID' })
  @IsUUID()
  mediaItemId: string;

  @ApiProperty({ description: 'Tag to remove' })
  @IsString()
  tag: string;
}

export class ListMediaTagsDto {
  @ApiPropertyOptional({ description: 'Search query for tags' })
  @IsOptional()
  @IsString()
  query?: string;
}
