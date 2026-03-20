// ============================================================================
// BUSINESS GATEWAY - Contract Controller
// ============================================================================
// Vendor contract management - view, sign, update bank details

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { VendorContractService } from '../../../domain/operations/services/vendor-contract.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import { PayoutService } from '../../../domain/operations/services/payout.service';
import { AuditSensitive } from '../../../core/audit/audit.decorators';

class UpdateBankDetailsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankIfscCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  upiId?: string;
}

@ApiTags('Business - Contract Management')
@ApiBearerAuth()
@Controller('contract')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractController {
  constructor(
    private readonly contractService: VendorContractService,
    private readonly vendorProfileService: VendorProfileService,
    private readonly payoutService: PayoutService,
  ) {}

  /**
   * Get own contract (auto-creates if doesn't exist)
   */
  @Get('me')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get own vendor contract' })
  @ApiResponse({ status: 200, description: 'Contract retrieved' })
  async getMyContract(@Request() req: any) {
    console.log('[ContractController] Getting contract for user:', req.user.id);

    try {
      const profile = await this.vendorProfileService.findByUserId(req.user.id);
      console.log('[ContractController] Profile found:', profile?.id, profile?.businessName);

      if (!profile) {
        console.log('[ContractController] No profile found');
        return {
          hasContract: false,
          contract: null,
          error: 'Vendor profile not found',
        };
      }

      // Auto-create contract if it doesn't exist
      console.log('[ContractController] Getting/creating contract for profile:', profile.id);
      const contract = await this.contractService.getOrCreateForVendor(profile.id);
      console.log('[ContractController] Contract result:', contract?.id, contract?.status);

      if (!contract) {
        console.log('[ContractController] Contract is null after getOrCreateForVendor');
        return {
          hasContract: false,
          contract: null,
          error: 'Failed to create contract',
        };
      }

      const displayContract = this.contractService.getContractTermsDisplay(contract);
      console.log('[ContractController] Returning contract:', displayContract);

      return {
        hasContract: true,
        contract: displayContract,
      };
    } catch (error: any) {
      console.error('[ContractController] Error getting/creating contract:', error);
      return {
        hasContract: false,
        contract: null,
        error: error?.message || 'Failed to get contract',
      };
    }
  }

  /**
   * Generate/create contract explicitly
   */
  @Post('me/generate')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Generate vendor contract' })
  @ApiResponse({ status: 200, description: 'Contract generated' })
  async generateContract(@Request() req: any) {
    console.log('[ContractController] Generating contract for user:', req.user.id);

    const profile = await this.vendorProfileService.findByUserId(req.user.id);

    if (!profile) {
      return {
        success: false,
        error: 'Vendor profile not found',
      };
    }

    const contract = await this.contractService.getOrCreateForVendor(profile.id);

    return {
      success: true,
      hasContract: true,
      contract: this.contractService.getContractTermsDisplay(contract),
    };
  }

  /**
   * Update bank details
   */
  @Put('me/bank-details')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('UPDATE_BANK_DETAILS', 'VendorContract')
  @ApiOperation({ summary: 'Update bank details for payouts' })
  @ApiResponse({ status: 200, description: 'Bank details updated' })
  async updateBankDetails(
    @Body() dto: UpdateBankDetailsDto,
    @Request() req: any,
  ) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const contract = await this.contractService.findByVendorProfile(profile.id);

    if (!contract) {
      return { success: false, message: 'No contract found' };
    }

    const updated = await this.contractService.updateBankDetails(contract.id, dto);
    return { success: true, contract: updated };
  }

  /**
   * Sign contract (vendor signature)
   */
  @Post('me/sign')
  @Roles('BUSINESS_ADMIN')
  @AuditSensitive('SIGN', 'VendorContract')
  @ApiOperation({ summary: 'Sign the vendor contract' })
  @ApiResponse({ status: 200, description: 'Contract signed' })
  async signContract(
    @Request() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);

    // Get or create contract if doesn't exist
    const contract = await this.contractService.getOrCreateForVendor(profile.id);

    // Sign by vendor (this activates the contract since platform pre-signs)
    const updated = await this.contractService.signByVendor(contract.id, ip || 'unknown');

    return {
      success: true,
      contract: this.contractService.getContractTermsDisplay(updated),
    };
  }

  /**
   * Get payout history
   */
  @Get('me/payouts')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get payout history' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved' })
  async getPayoutHistory(@Request() req: any) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const payouts = await this.payoutService.getVendorPayouts(profile.id);

    return { payouts };
  }

  /**
   * Get contract terms summary
   */
  @Get('me/terms')
  @Roles('BUSINESS_ADMIN')
  @ApiOperation({ summary: 'Get contract terms summary' })
  @ApiResponse({ status: 200, description: 'Terms retrieved' })
  async getContractTerms(@Request() req: any) {
    const profile = await this.vendorProfileService.findByUserId(req.user.id);
    const contract = await this.contractService.findByVendorProfile(profile.id);

    if (!contract) {
      return { hasContract: false };
    }

    return {
      hasContract: true,
      terms: {
        commissionRate: contract.commissionRate,
        payoutFrequency: contract.payoutFrequency,
        payoutHoldDays: contract.payoutHoldDays,
        minPayoutAmount: contract.minPayoutAmount,
        effectiveDate: contract.effectiveDate,
        expiryDate: contract.expiryDate,
        status: contract.status,
      },
    };
  }
}
