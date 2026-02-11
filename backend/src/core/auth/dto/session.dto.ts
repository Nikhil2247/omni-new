// ============================================================================
// SESSION DTOs - Session Management Request/Response
// ============================================================================

import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SessionInfoDto {
  @ApiProperty({ description: 'Session ID' })
  id: string

  @ApiProperty({
    description: 'Device type (mobile, desktop, tablet)',
    nullable: true,
  })
  deviceType: string | null

  @ApiProperty({
    description: 'Device name (e.g., "Chrome on Windows")',
    nullable: true,
  })
  deviceName: string | null

  @ApiProperty({
    description: 'Browser name',
    nullable: true,
  })
  browser: string | null

  @ApiProperty({
    description: 'Operating system',
    nullable: true,
  })
  os: string | null

  @ApiProperty({
    description: 'Location (city, country)',
    nullable: true,
  })
  location: string | null

  @ApiProperty({
    description: 'IP address',
    nullable: true,
  })
  ipAddress: string | null

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActiveAt: Date

  @ApiProperty({ description: 'Session creation timestamp' })
  createdAt: Date

  @ApiProperty({ description: 'Session expiration timestamp' })
  expiresAt: Date

  @ApiProperty({ description: 'Whether this is the current session' })
  isCurrent: boolean
}

export class SessionListResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean

  @ApiProperty({
    description: 'List of active sessions',
    type: [SessionInfoDto],
  })
  sessions: SessionInfoDto[]

  @ApiProperty({ description: 'Total number of active sessions' })
  totalSessions: number
}

export class RevokeSessionDto {
  @ApiProperty({
    description: 'Session ID to revoke',
    example: 'uuid-here',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean

  @ApiProperty({ description: 'Response message' })
  message: string
}

export class LoginActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string

  @ApiProperty({ description: 'Whether login was successful' })
  success: boolean

  @ApiProperty({ description: 'Login method used' })
  loginMethod: string

  @ApiProperty({ description: 'IP address' })
  ipAddress: string

  @ApiProperty({
    description: 'Device type',
    nullable: true,
  })
  deviceType: string | null

  @ApiProperty({
    description: 'Country',
    nullable: true,
  })
  country: string | null

  @ApiProperty({ description: 'Timestamp' })
  createdAt: Date
}

export class LoginActivitySummaryResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean

  @ApiProperty({ description: 'Total login attempts' })
  totalAttempts: number

  @ApiProperty({ description: 'Successful login attempts' })
  successfulAttempts: number

  @ApiProperty({ description: 'Failed login attempts' })
  failedAttempts: number

  @ApiProperty({ description: 'Number of unique IPs' })
  uniqueIPs: number

  @ApiProperty({ description: 'Number of unique devices' })
  uniqueDevices: number

  @ApiProperty({ description: 'Number of suspicious attempts' })
  suspiciousAttempts: number

  @ApiProperty({
    description: 'Recent login activities',
    type: [LoginActivityDto],
  })
  recentActivities: LoginActivityDto[]
}
