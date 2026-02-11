// ============================================================================
// REGISTER DTOs - User Registration Request/Response
// ============================================================================

import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsIn,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiPropertyOptional({
    description: 'Account type for registration',
    enum: ['USER', 'VENDOR'],
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  @IsIn(['USER', 'VENDOR'], { message: 'Account type must be USER or VENDOR' })
  accountType?: 'USER' | 'VENDOR'

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string

  @ApiProperty({
    description: 'User password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'SecureP@ss123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string
}

export class RegisterResponseDto {
  @ApiProperty({ description: 'Registration success status' })
  success: boolean

  @ApiProperty({ description: 'Response message' })
  message: string

  @ApiProperty({ description: 'User ID' })
  userId: string

  @ApiProperty({ description: 'User email' })
  email: string
}
