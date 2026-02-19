// ============================================================================
// API KEY DTOs - API Key Management Request/Response
// ============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Name/description for the API key',
    example: 'Production Integration Key',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Permission scopes for the API key',
    example: ['read:vendors', 'write:leads'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({
    description: 'Number of days until the API key expires (null for never)',
    example: 365,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3650) // Max 10 years
  expiresInDays?: number;
}

export class CreateApiKeyResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({
    description: 'The API key (only shown once, store securely)',
    example: 'oc_abc123def456...',
  })
  key: string;

  @ApiProperty({
    description: 'Key prefix for identification',
    example: 'oc_abc123',
  })
  keyPrefix: string;

  @ApiProperty({ description: 'Response message' })
  message: string;
}

export class ApiKeyInfoDto {
  @ApiProperty({ description: 'API key ID' })
  id: string;

  @ApiProperty({ description: 'API key name' })
  name: string;

  @ApiProperty({
    description: 'Key prefix for identification',
    example: 'oc_abc123',
  })
  keyPrefix: string;

  @ApiProperty({
    description: 'Permission scopes',
    type: [String],
  })
  scopes: string[];

  @ApiProperty({
    description: 'Last time the key was used',
    nullable: true,
  })
  lastUsedAt: Date | null;

  @ApiProperty({
    description: 'Expiration date',
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Whether the key is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class ApiKeyListResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({
    description: 'List of API keys',
    type: [ApiKeyInfoDto],
  })
  keys: ApiKeyInfoDto[];
}

export class RevokeApiKeyDto {
  @ApiProperty({
    description: 'API key ID to revoke',
    example: 'uuid-here',
  })
  @IsString()
  @IsNotEmpty()
  keyId: string;
}

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;
}
