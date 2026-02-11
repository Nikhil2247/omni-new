// ============================================================================
// TWO-FACTOR DTOs - 2FA Management Request/Response
// ============================================================================

import { IsString, IsNotEmpty, Length, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SetupTwoFactorResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean

  @ApiProperty({
    description: 'Base32-encoded secret for TOTP',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string

  @ApiProperty({
    description: 'otpauth URL for QR code generation',
    example: 'otpauth://totp/Omnicassion:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Omnicassion',
  })
  qrCodeUrl: string

  @ApiProperty({
    description: 'Backup codes for account recovery',
    example: ['ABCD-1234', 'EFGH-5678'],
    type: [String],
  })
  backupCodes: string[]
}

export class VerifyTwoFactorDto {
  @ApiProperty({
    description: 'Six-digit TOTP code from authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  @Matches(/^[0-9]{6}$/, { message: 'Code must be exactly 6 digits' })
  code: string
}

export class DisableTwoFactorDto {
  @ApiProperty({
    description: 'Six-digit TOTP code or backup code to confirm identity',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  code: string
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description: 'Current TOTP code to confirm identity',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  code: string
}

export class TwoFactorStatusResponseDto {
  @ApiProperty({ description: 'Whether 2FA is enabled' })
  enabled: boolean

  @ApiProperty({ description: 'Number of remaining backup codes' })
  backupCodesRemaining: number

  @ApiProperty({
    description: 'Date when 2FA was enabled',
    nullable: true,
  })
  enabledAt: Date | null
}

export class TwoFactorResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean

  @ApiProperty({ description: 'Response message' })
  message: string
}

export class BackupCodesResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean

  @ApiProperty({
    description: 'New backup codes',
    example: ['ABCD-1234', 'EFGH-5678'],
    type: [String],
  })
  backupCodes: string[]

  @ApiProperty({ description: 'Response message' })
  message: string
}
