// ============================================================================
// WISHLIST DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  ValidateIf,
} from 'class-validator';

export class CreateWishlistDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Wishlist name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is default wishlist', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class AddWishlistItemDto {
  @ApiPropertyOptional({
    description: 'Wishlist ID (from route)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  wishlistId?: string;

  @ApiPropertyOptional({
    description: 'Vendor profile ID (for profile wishlisting)',
  })
  @IsOptional()
  @ValidateIf((dto: AddWishlistItemDto) => !dto.mediaItemId)
  @IsUUID()
  vendorProfileId?: string;

  @ApiPropertyOptional({
    description: 'Media item ID (for portfolio/media wishlisting)',
  })
  @IsOptional()
  @ValidateIf((dto: AddWishlistItemDto) => !dto.vendorProfileId)
  @IsUUID()
  mediaItemId?: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WishlistResponseDto {
  @ApiProperty({ description: 'Wishlist ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Name' })
  name: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}
