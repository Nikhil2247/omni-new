// ============================================================================
// VENDOR CLAIM CONTROLLER - Public Gateway
// ============================================================================
// Public endpoints for vendor profile claim workflow
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { VendorClaimService } from '../../../domain/catalog/services/vendor-claim.service';
import {
  InitiateClaimDto,
  VerifyClaimDto,
  VendorClaimResponseDto,
  ClaimStatusResponseDto,
} from '../../../domain/catalog/dto/vendor-claim.dto';

@ApiTags('Vendor Claims')
@Controller('vendors/claim')
export class VendorClaimController {
  constructor(private readonly vendorClaimService: VendorClaimService) {}

  /**
   * Initiate a claim for a vendor profile
   */
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate claim for vendor profile' })
  @ApiResponse({
    status: 201,
    description: 'Claim initiated successfully',
    type: VendorClaimResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid claim request or profile not claimable' })
  @ApiResponse({ status: 404, description: 'Vendor profile not found' })
  @ApiResponse({ status: 409, description: 'Claim already in progress' })
  async initiateClaim(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: InitiateClaimDto,
  ): Promise<VendorClaimResponseDto> {
    const claim = await this.vendorClaimService.initiateClaim(user.id, dto);

    // Automatically send verification if applicable
    if (dto.verificationMethod !== 'ADMIN_VERIFIED' && dto.verificationMethod !== 'DOCUMENT') {
      await this.vendorClaimService.sendVerification(claim.id);
    }

    return claim;
  }

  /**
   * Verify a claim with the verification code
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify claim with code' })
  @ApiResponse({
    status: 200,
    description: 'Claim verified successfully',
    type: VendorClaimResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  @ApiResponse({ status: 403, description: 'Not authorized to verify this claim' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async verifyClaim(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: VerifyClaimDto,
  ): Promise<VendorClaimResponseDto> {
    return this.vendorClaimService.verifyCode(dto, user.id);
  }

  /**
   * Get claim status for a specific vendor profile
   */
  @Get('status/:vendorProfileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get claim status' })
  @ApiParam({
    name: 'vendorProfileId',
    description: 'Vendor profile ID to check claim status',
  })
  @ApiResponse({
    status: 200,
    description: 'Claim status retrieved successfully',
    type: ClaimStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendor profile not found' })
  async getClaimStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('vendorProfileId') vendorProfileId: string,
  ): Promise<ClaimStatusResponseDto> {
    return this.vendorClaimService.getClaimStatus(user.id, vendorProfileId);
  }

  /**
   * Get all claims for the current user
   */
  @Get('my-claims')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user claims' })
  @ApiResponse({
    status: 200,
    description: 'User claims retrieved successfully',
    type: [VendorClaimResponseDto],
  })
  async getMyClaims(
    @CurrentUser() user: CurrentUserData,
  ): Promise<VendorClaimResponseDto[]> {
    return this.vendorClaimService.getUserClaims(user.id);
  }

  /**
   * Resend verification code for an existing claim
   */
  @Post('resend/:claimId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiParam({
    name: 'claimId',
    description: 'Claim ID to resend verification for',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification resent successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot resend verification for this claim' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async resendVerification(
    @CurrentUser() user: CurrentUserData,
    @Param('claimId') claimId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Get the claim to verify ownership
    const claim = await this.vendorClaimService.getClaimById(claimId);

    if (claim.userId !== user.id) {
      return {
        success: false,
        message: 'You are not authorized to resend verification for this claim',
      };
    }

    await this.vendorClaimService.sendVerification(claimId);

    return {
      success: true,
      message: 'Verification code has been resent',
    };
  }
}
