// ============================================================================
// VENDOR CLAIM DTOs - Data Transfer Objects for Vendor Claim Operations
// ============================================================================

import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDate,
  IsEmail,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimStatus, ClaimVerificationMethod } from '@prisma/client';

// ============================================================================
// INITIATE CLAIM REQUEST
// ============================================================================

export class InitiateClaimDto {
  @ApiProperty({
    description: 'ID of the vendor profile to claim',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  vendorProfileId: string;

  @ApiProperty({
    description: 'Method of verification for the claim',
    enum: ClaimVerificationMethod,
    example: ClaimVerificationMethod.EMAIL,
  })
  @IsEnum(ClaimVerificationMethod)
  verificationMethod: ClaimVerificationMethod;
}

// ============================================================================
// VERIFY CLAIM
// ============================================================================

export class VerifyClaimDto {
  @ApiProperty({
    description: 'ID of the claim to verify',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  claimId: string;

  @ApiProperty({
    description: 'Verification code submitted by the user',
    example: '123456',
  })
  @IsString()
  @Length(4, 10)
  verificationCode: string;
}

// ============================================================================
// ADMIN REVIEW CLAIM
// ============================================================================

export class ReviewClaimDto {
  @ApiProperty({
    description: 'ID of the claim to review',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  claimId: string;

  @ApiProperty({
    description: 'Whether to approve the claim',
    example: true,
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Admin notes about the review decision',
    example: 'Verified ownership through phone call',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================================================
// RESEND VERIFICATION
// ============================================================================

export class ResendVerificationDto {
  @ApiProperty({
    description: 'ID of the claim to resend verification for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  claimId: string;
}

// ============================================================================
// VENDOR CLAIM RESPONSE
// ============================================================================

export class VendorClaimResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the claim',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the vendor profile being claimed',
  })
  vendorProfileId: string;

  @ApiProperty({
    description: 'ID of the user making the claim',
  })
  userId: string;

  @ApiProperty({
    description: 'Current status of the claim',
    enum: ClaimStatus,
  })
  status: ClaimStatus;

  @ApiProperty({
    description: 'Method used for verification',
    enum: ClaimVerificationMethod,
  })
  verificationMethod: ClaimVerificationMethod;

  @ApiPropertyOptional({
    description: 'When the verification code expires',
    type: Date,
  })
  verificationExpiry?: Date | null;

  @ApiPropertyOptional({
    description: 'ID of the admin who reviewed the claim',
  })
  reviewedBy?: string | null;

  @ApiPropertyOptional({
    description: 'When the claim was reviewed',
    type: Date,
  })
  reviewedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Admin notes about the review',
  })
  reviewNotes?: string | null;

  @ApiProperty({
    description: 'When the claim was created',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the claim was last updated',
    type: Date,
  })
  updatedAt: Date;

  // Relations (optional, included when requested)
  @ApiPropertyOptional({
    description: 'Vendor profile details',
  })
  vendorProfile?: {
    id: string;
    businessName: string;
    slug: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    status: string;
  };
}

// ============================================================================
// CLAIM STATUS RESPONSE (simplified for user queries)
// ============================================================================

export class ClaimStatusResponseDto {
  @ApiProperty({
    description: 'Whether a claim exists for this vendor profile',
  })
  hasClaim: boolean;

  @ApiPropertyOptional({
    description: 'Current claim details if exists',
  })
  claim?: VendorClaimResponseDto | null;

  @ApiPropertyOptional({
    description: 'Whether the user can initiate a new claim',
  })
  canClaim?: boolean;

  @ApiPropertyOptional({
    description: 'Reason why user cannot claim (if applicable)',
  })
  reason?: string;
}

// ============================================================================
// PENDING CLAIMS LIST RESPONSE (for admin)
// ============================================================================

export class PendingClaimsResponseDto {
  @ApiProperty({
    description: 'List of pending claims',
    type: [VendorClaimResponseDto],
  })
  claims: VendorClaimResponseDto[];

  @ApiProperty({
    description: 'Total count of pending claims',
  })
  total: number;

  @ApiProperty({
    description: 'Count by status',
  })
  statusCounts: {
    pending: number;
    verificationSent: number;
    verified: number;
  };
}

// ============================================================================
// GUEST CLAIM DTOs - For unauthenticated users claiming a vendor profile
// ============================================================================

/**
 * Request DTO for initiating a guest claim
 * This is used when an unauthenticated user wants to claim a vendor profile
 */
export class InitiateGuestClaimDto {
  @ApiProperty({
    description: 'ID of the vendor profile to claim',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  vendorProfileId: string;

  @ApiProperty({
    description: 'Email address of the person claiming the business',
    example: 'owner@mybusiness.com',
  })
  @IsEmail()
  email: string;
}

/**
 * Request DTO for verifying a guest claim
 * After email verification, a user account is created and linked to the vendor
 */
export class VerifyGuestClaimDto {
  @ApiProperty({
    description: 'ID of the vendor profile being claimed',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  vendorProfileId: string;

  @ApiProperty({
    description: 'Email address used to initiate the claim',
    example: 'owner@mybusiness.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Verification code sent to the email',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  verificationCode: string;
}

/**
 * Response DTO for guest claim initiation
 */
export class GuestClaimInitiatedResponseDto {
  @ApiProperty({
    description: 'Whether the claim initiation was successful',
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the result',
  })
  message: string;

  @ApiProperty({
    description: 'Email address where the verification code was sent (masked)',
    example: 'o***r@mybusiness.com',
  })
  maskedEmail: string;

  @ApiProperty({
    description: 'When the verification code expires',
    type: Date,
  })
  expiresAt: Date;
}

/**
 * Response DTO for successful guest claim verification
 * Returns auth tokens so the user is immediately logged in
 */
export class GuestClaimVerifiedResponseDto {
  @ApiProperty({
    description: 'Whether the verification was successful',
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the result',
  })
  message: string;

  @ApiProperty({
    description: 'User ID of the newly created account',
  })
  userId: string;

  @ApiProperty({
    description: 'Vendor profile ID that was claimed',
  })
  vendorProfileId: string;

  @ApiProperty({
    description: 'JWT access token for authentication',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for getting new access tokens',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User details',
  })
  user: {
    id: string;
    email: string;
    role: string;
  };
}
