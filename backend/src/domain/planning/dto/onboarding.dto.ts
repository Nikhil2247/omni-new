// ============================================================================
// ONBOARDING DTOs - Planning Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  IsDateString,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { WeddingEventType, PartnerInviteStatus } from '@prisma/client'

// Re-export Prisma enums for convenience
export { WeddingEventType, PartnerInviteStatus }

// ============================================================================
// VIBE QUIZ DTOs
// ============================================================================

export class SubmitVibeQuizDto {
  @ApiProperty({
    description: 'Array of selected image IDs (5-10 images)',
    example: ['uuid1', 'uuid2', 'uuid3', 'uuid4', 'uuid5'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(5)
  @ArrayMaxSize(10)
  selectedImageIds: string[]
}

export class VibeQuizImageResponseDto {
  @ApiProperty({ description: 'Image ID' })
  id: string

  @ApiProperty({ description: 'Full URL of the image' })
  url: string

  @ApiProperty({ description: 'Thumbnail URL' })
  thumbnailUrl: string

  @ApiProperty({ description: 'Image category', example: 'Decor' })
  category: string

  @ApiProperty({ description: 'Style tag', example: 'Royal' })
  style: string

  @ApiProperty({ description: 'Additional tags', type: [String] })
  tags: string[]
}

export class VibeQuizResultResponseDto {
  @ApiProperty({ description: 'Result ID' })
  id: string

  @ApiProperty({ description: 'User ID' })
  userId: string

  @ApiProperty({ description: 'Top preferred styles', type: [String] })
  topStyles: string[]

  @ApiProperty({ description: 'Top preferred colors', type: [String] })
  topColors: string[]

  @ApiProperty({ description: 'Top preferred categories', type: [String] })
  topCategories: string[]

  @ApiProperty({ description: 'Completion timestamp' })
  completedAt: Date
}

export class VibeQuizStatusResponseDto {
  @ApiProperty({ description: 'Whether quiz has been completed' })
  completed: boolean

  @ApiPropertyOptional({ description: 'Quiz result if completed' })
  result?: VibeQuizResultResponseDto
}

// ============================================================================
// WEDDING IDENTITY DTOs
// ============================================================================

export class CreateWeddingIdentityDto {
  @ApiProperty({ description: 'First partner name', example: 'Rohit' })
  @IsString()
  @MinLength(2)
  partnerOneName: string

  @ApiProperty({ description: 'Second partner name', example: 'Riya' })
  @IsString()
  @MinLength(2)
  partnerTwoName: string

  @ApiPropertyOptional({ description: 'Event date' })
  @IsOptional()
  @ValidateIf((o) => o.eventDate !== undefined && o.eventDate !== '')
  @IsDateString()
  eventDate?: string

  @ApiPropertyOptional({ description: 'Event type', enum: WeddingEventType })
  @IsOptional()
  @IsEnum(WeddingEventType)
  eventType?: WeddingEventType
}

export class UpdateWeddingIdentityDto {
  @ApiPropertyOptional({ description: 'Display name', example: 'Rohit & Riya' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string

  @ApiPropertyOptional({ description: 'Event date' })
  @IsOptional()
  @ValidateIf((o) => o.eventDate !== undefined && o.eventDate !== '')
  @IsDateString()
  eventDate?: string

  @ApiPropertyOptional({ description: 'Event type', enum: WeddingEventType })
  @IsOptional()
  @IsEnum(WeddingEventType)
  eventType?: WeddingEventType
}

export class InvitePartnerDto {
  @ApiProperty({ description: 'Partner email address' })
  @IsEmail()
  email: string

  @ApiPropertyOptional({ description: 'Partner phone number' })
  @IsOptional()
  @IsString()
  phone?: string
}

export class WeddingPartnerResponseDto {
  @ApiProperty({ description: 'Partner ID' })
  id: string

  @ApiProperty({ description: 'Partner name' })
  name: string

  @ApiPropertyOptional({ description: 'Partner email', nullable: true })
  email: string | null

  @ApiPropertyOptional({ description: 'Partner phone', nullable: true })
  phone: string | null

  @ApiProperty({ description: 'Whether this partner is the owner' })
  isOwner: boolean

  @ApiProperty({ description: 'Invite status', enum: PartnerInviteStatus })
  inviteStatus: PartnerInviteStatus

  @ApiPropertyOptional({ description: 'When invite was sent', nullable: true })
  invitedAt: Date | null

  @ApiPropertyOptional({ description: 'When invite was accepted', nullable: true })
  acceptedAt: Date | null
}

export class WeddingIdentityResponseDto {
  @ApiProperty({ description: 'Wedding identity ID' })
  id: string

  @ApiProperty({ description: 'Display name', example: 'Rohit & Riya' })
  displayName: string

  @ApiPropertyOptional({ description: 'Event date', nullable: true })
  eventDate: Date | null

  @ApiProperty({ description: 'Event type', enum: WeddingEventType })
  eventType: WeddingEventType

  @ApiProperty({ description: 'Partners', type: [WeddingPartnerResponseDto] })
  partners: WeddingPartnerResponseDto[]

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date
}

// ============================================================================
// ONBOARDING STATUS DTOs
// ============================================================================

export class OnboardingStatusResponseDto {
  @ApiProperty({ description: 'Whether vibe quiz is completed' })
  vibeQuizCompleted: boolean

  @ApiProperty({ description: 'Whether wedding identity is created' })
  weddingIdentityCreated: boolean

  @ApiProperty({ description: 'Overall onboarding completion status' })
  isOnboardingComplete: boolean
}
