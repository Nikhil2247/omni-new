import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import { KycVerificationService } from '../../../domain/operations/services/kyc-verification.service';
import { ConsentService } from '../../../domain/operations/services/consent.service';
import { VendorContractService } from '../../../domain/operations/services/vendor-contract.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class VendorsController {
  private readonly logger = new Logger(VendorsController.name);

  constructor(
    private readonly vendorProfileService: VendorProfileService,
    private readonly kycService: KycVerificationService,
    private readonly consentService: ConsentService,
    private readonly contractService: VendorContractService,
  ) {}

  @Get()
  async list(@Query() query: any) {
    const result = await this.vendorProfileService.search({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
      status: query.status || 'ACTIVE',
      ...query,
    });
    return result.data;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.vendorProfileService.findById(id);
  }

  /**
   * Get complete onboarding data for a vendor
   */
  @Get(':id/onboarding')
  async getOnboardingData(@Param('id') vendorProfileId: string) {
    this.logger.log(`Getting onboarding data for vendor: ${vendorProfileId}`);

    try {
      // Get profile
      const profile = await this.vendorProfileService.findById(vendorProfileId);

      // Get KYC
      let kyc: Awaited<ReturnType<typeof this.kycService.findByVendorProfile>> | null = null;
      try {
        kyc = await this.kycService.findByVendorProfile(vendorProfileId);
      } catch (e) {
        this.logger.debug(`No KYC found for vendor: ${vendorProfileId}`);
      }

      // Get consents
      let consents: Awaited<ReturnType<typeof this.consentService.getVendorConsents>> = [];
      let consentStatus: Awaited<ReturnType<typeof this.consentService.getVendorConsentStatus>> | null = null;
      try {
        consents = await this.consentService.getVendorConsents(vendorProfileId);
        consentStatus = await this.consentService.getVendorConsentStatus(vendorProfileId);
      } catch (e) {
        this.logger.debug(`No consents found for vendor: ${vendorProfileId}`);
      }

      // Get contract
      let contract: Awaited<ReturnType<typeof this.contractService.findByVendorProfile>> | null = null;
      try {
        contract = await this.contractService.findByVendorProfile(vendorProfileId);
      } catch (e) {
        this.logger.debug(`No contract found for vendor: ${vendorProfileId}`);
      }

      // Calculate onboarding progress
      const hasCompleteProfile = !!(profile?.businessName && profile?.description && profile?.categoryId);
      const hasKyc = !!kyc;
      const isKycApproved = kyc?.status === 'APPROVED';
      const hasRequiredConsents = consentStatus ?
        Object.values(consentStatus).filter((c: any) => c.required && c.hasConsent).length ===
        Object.values(consentStatus).filter((c: any) => c.required).length : false;
      const hasContract = !!contract;
      const hasSignedContract = contract?.signedByVendor ?? false;
      const hasBankDetails = !!(contract?.bankAccountNumber || contract?.upiId);

      const steps = {
        profile: { completed: hasCompleteProfile, label: 'Profile Complete' },
        kyc: { completed: isKycApproved, status: kyc?.status, label: 'KYC Verification' },
        consents: { completed: hasRequiredConsents, label: 'Required Consents' },
        contract: { completed: hasSignedContract, label: 'Contract Signed' },
        bankDetails: { completed: hasBankDetails, label: 'Bank Details' },
      };

      const completedSteps = Object.values(steps).filter(s => s.completed).length;
      const totalSteps = Object.keys(steps).length;
      const progress = Math.round((completedSteps / totalSteps) * 100);
      const isComplete = completedSteps === totalSteps;

      return {
        profile,
        kyc,
        consents,
        consentStatus,
        contract: contract ? {
          id: contract.id,
          contractNumber: contract.contractNumber,
          commissionRate: contract.commissionRate,
          payoutFrequency: contract.payoutFrequency,
          payoutHoldDays: contract.payoutHoldDays,
          minPayoutAmount: contract.minPayoutAmount,
          status: contract.status,
          effectiveDate: contract.effectiveDate,
          expiryDate: contract.expiryDate,
          signedByVendor: contract.signedByVendor,
          signedByPlatform: contract.signedByPlatform,
          signedAt: contract.signedAt,
          bankAccountName: contract.bankAccountName,
          bankAccountNumber: contract.bankAccountNumber ?
            '****' + contract.bankAccountNumber.slice(-4) : null,
          bankIfscCode: contract.bankIfscCode,
          bankName: contract.bankName,
          upiId: contract.upiId,
          createdAt: contract.createdAt,
        } : null,
        onboardingStatus: {
          steps,
          progress,
          isComplete,
          completedSteps,
          totalSteps,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error getting onboarding data: ${error.message}`);
      throw error;
    }
  }
}
