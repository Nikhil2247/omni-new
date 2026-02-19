// ============================================================================
// LOGIN DTOs - Authentication Request/Response
// ============================================================================

import { IsEmail, IsString, IsNotEmpty, IsOptional, Length } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string

  @ApiProperty({
    description: 'User password',
    example: 'SecureP@ss123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string
}

export class TwoFactorLoginDto {
  @ApiProperty({
    description: 'Temporary token received after initial login',
    example: '2fa_abc123...',
  })
  @IsString()
  @IsNotEmpty()
  tempToken: string

  @ApiProperty({
    description: 'Two-factor authentication code (6-digit TOTP or backup code)',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID token returned by Google Identity Services',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string

  @ApiPropertyOptional({
    description: 'Account type used when creating a new account via Google login',
    enum: ['USER', 'VENDOR'],
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  accountType?: 'USER' | 'VENDOR'
}

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string

  @ApiProperty({ description: 'Token expiry time in seconds' })
  expiresIn: number

  @ApiPropertyOptional({ description: 'Session ID' })
  sessionId?: string
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Authentication success status' })
  success: boolean

  @ApiProperty({ description: 'Whether two-factor authentication is required' })
  requiresTwoFactor: boolean

  @ApiPropertyOptional({ type: TokenResponseDto })
  tokens?: TokenResponseDto

  @ApiPropertyOptional({ description: 'User information' })
  user?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    roles: string[]
    emailVerified: boolean
    twoFactorEnabled: boolean
    hasCompletedOnboarding: boolean
  }
}

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Specific session ID to logout (optional, logs out current session if not provided)',
  })
  @IsOptional()
  @IsString()
  sessionId?: string

  @ApiPropertyOptional({
    description: 'Logout from all devices',
    default: false,
  })
  @IsOptional()
  allDevices?: boolean
}
