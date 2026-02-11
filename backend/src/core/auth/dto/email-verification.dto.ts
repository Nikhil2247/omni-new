// ============================================================================
// EMAIL VERIFICATION DTOs - Email Verification Request/Response
// ============================================================================

import { IsEmail, IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string
}

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address to resend verification to',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string
}

export class UpdateEmailDto {
  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  newEmail: string
}

export class EmailVerificationStatusDto {
  @ApiProperty({ description: 'Whether email is verified' })
  emailVerified: boolean

  @ApiProperty({
    description: 'Date when email was verified',
    nullable: true,
  })
  emailVerifiedAt: Date | null

  @ApiProperty({ description: 'Whether a new verification email can be sent' })
  canResend: boolean
}

export class EmailVerificationResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean

  @ApiProperty({ description: 'Response message' })
  message: string

  @ApiProperty({
    description: 'Verified email address',
    nullable: true,
  })
  email?: string
}
