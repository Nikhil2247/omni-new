// ============================================================================
// AD CREDITS CONTROLLER - Business Gateway
// ============================================================================
// Vendor ad credit management endpoints for balance, history, and purchases
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { AdCreditService } from '../../../domain/subscription/services/ad-credit.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import { SubscriptionService } from '../../../domain/subscription/services/subscription.service';
import {
  AdCreditBalanceDto,
  AdCreditTransactionDto,
  PurchaseCreditsDto,
  CreditSpendingSummaryDto,
} from '../../../domain/subscription/dto/campaign.dto';
import { PlanTier } from '@prisma/client';

@ApiTags('Ad Credits')
@ApiBearerAuth()
@Controller('ad-credits')
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class AdCreditsController {
  constructor(
    private readonly adCreditService: AdCreditService,
    private readonly vendorProfileService: VendorProfileService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Helper to get and validate vendor profile for current user
   */
  private async getVendorProfileId(userId: string): Promise<string> {
    const profile = await this.vendorProfileService.findByUserId(userId);
    if (!profile) {
      throw new ForbiddenException('Vendor profile required');
    }
    return profile.id;
  }

  /**
   * Get current credit balance
   */
  @Get('balance')
  @ApiOperation({ summary: 'Get current credit balance' })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    type: AdCreditBalanceDto,
  })
  async getBalance(@CurrentUser() user: CurrentUserData): Promise<AdCreditBalanceDto & { canClaimMonthly: boolean; nextClaimDate?: string }> {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const balance = await this.adCreditService.getBalance(vendorProfileId);

    // Check if monthly credits can be claimed
    const subscription = await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);
    let canClaimMonthly = false;
    let nextClaimDate: string | undefined;

    if (subscription) {
      const planTier = subscription.plan?.tier as PlanTier;
      if (planTier === 'PROFESSIONAL' || planTier === 'ENTERPRISE') {
        const hasClaimedThisMonth = await this.adCreditService.hasClaimedThisMonth(vendorProfileId);
        canClaimMonthly = !hasClaimedThisMonth;

        if (hasClaimedThisMonth) {
          // Calculate next month's first day
          const now = new Date();
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          nextClaimDate = nextMonth.toISOString();
        }
      }
    }

    return {
      balance,
      vendorProfileId,
      canClaimMonthly,
      nextClaimDate,
    };
  }

  /**
   * Get credit transaction history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to retrieve (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    type: [AdCreditTransactionDto],
  })
  async getHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ): Promise<AdCreditTransactionDto[]> {
    const vendorProfileId = await this.getVendorProfileId(user.id);
    const parsedLimit = limit ? Math.min(Math.max(1, Number(limit)), 100) : 50;

    const transactions = await this.adCreditService.getHistory(
      vendorProfileId,
      parsedLimit,
    );

    return transactions.map((tx) => ({
      id: tx.id,
      vendorProfileId: tx.vendorProfileId,
      type: tx.type,
      amount: tx.amount,
      balance: tx.balance,
      referenceType: tx.referenceType ?? undefined,
      referenceId: tx.referenceId ?? undefined,
      description: tx.description ?? undefined,
      createdAt: tx.createdAt,
    }));
  }

  /**
   * Get spending summary for a date range
   */
  @Get('spending-summary')
  @ApiOperation({ summary: 'Get spending summary for period' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date (ISO 8601 format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Spending summary retrieved successfully',
    type: CreditSpendingSummaryDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
  async getSpendingSummary(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<CreditSpendingSummaryDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    // Validate and parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }

    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Limit date range to prevent excessive queries (max 1 year)
    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (end.getTime() - start.getTime() > maxRange) {
      throw new BadRequestException('Date range cannot exceed 1 year');
    }

    return this.adCreditService.getSpendingSummary(vendorProfileId, start, end);
  }

  /**
   * Get purchase information for credits
   * Note: Actual purchase flow goes through /business/payments/create-order
   * and /business/payments/verify endpoints with purpose=AD_CREDITS
   */
  @Post('purchase')
  @ApiOperation({ summary: 'Get purchase information for credits' })
  @ApiResponse({
    status: 200,
    description: 'Purchase information retrieved',
  })
  @ApiResponse({ status: 400, description: 'Invalid purchase request' })
  async purchaseCredits(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PurchaseCreditsDto,
  ): Promise<{
    credits: number;
    price: number;
    currency: string;
    message: string;
  }> {
    // Validate vendor profile exists
    await this.getVendorProfileId(user.id);

    // Validate minimum purchase
    if (dto.amount < 100) {
      throw new BadRequestException('Minimum purchase is 100 credits');
    }

    // Validate maximum purchase
    if (dto.amount > 100000) {
      throw new BadRequestException('Maximum purchase is 100,000 credits');
    }

    // Calculate price based on credit packages or custom amount
    // Package pricing:
    // - 1,000 credits = Rs 999 (0.999 per credit)
    // - 5,000 credits = Rs 4,499 (0.8998 per credit)
    // - 10,000 credits = Rs 7,999 (0.7999 per credit)
    // - 25,000 credits = Rs 17,999 (0.71996 per credit)
    // Custom: 1 credit = Rs 1

    let price: number;
    switch (dto.amount) {
      case 1000:
        price = 999;
        break;
      case 5000:
        price = 4499;
        break;
      case 10000:
        price = 7999;
        break;
      case 25000:
        price = 17999;
        break;
      default:
        // Custom amount: 1 credit = 1 INR
        price = dto.amount;
    }

    return {
      credits: dto.amount,
      price,
      currency: 'INR',
      message: 'Use the payment endpoint to complete purchase',
    };
  }

  /**
   * Claim monthly subscription credits
   * Allows vendors to manually trigger their monthly credit grant if not already received
   */
  @Post('claim-monthly')
  @ApiOperation({ summary: 'Claim monthly subscription credits' })
  @ApiResponse({
    status: 200,
    description: 'Monthly credits claimed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Credits already claimed or no active subscription',
  })
  async claimMonthlyCredits(
    @CurrentUser() user: CurrentUserData,
  ): Promise<{
    success: boolean;
    message: string;
    creditsGranted?: number;
    newBalance?: number;
  }> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    // Get active subscription for vendor
    const subscription = await this.subscriptionService.findActiveByVendorProfile(
      vendorProfileId,
    );

    if (!subscription) {
      throw new BadRequestException(
        'No active subscription found. Subscribe to a paid plan to get monthly credits.',
      );
    }

    const planTier = subscription.plan?.tier as PlanTier;

    // Check if plan tier qualifies for monthly credits
    if (planTier !== 'PROFESSIONAL' && planTier !== 'ENTERPRISE') {
      throw new BadRequestException(
        `Your ${subscription.plan?.name || 'current'} plan does not include monthly ad credits. Upgrade to Professional or Enterprise.`,
      );
    }

    try {
      // Attempt to grant monthly credits (will check if already granted this month)
      await this.adCreditService.grantMonthlyCredits(vendorProfileId, planTier);

      // Get updated balance
      const newBalance = await this.adCreditService.getBalance(vendorProfileId);

      const creditAmount = planTier === 'PROFESSIONAL' ? 2000 : 5000;

      return {
        success: true,
        message: `Monthly ${planTier.toLowerCase()} plan credits claimed successfully!`,
        creditsGranted: creditAmount,
        newBalance,
      };
    } catch (error) {
      // If credits were already granted this month, this will fail silently in the service
      const newBalance = await this.adCreditService.getBalance(vendorProfileId);

      return {
        success: false,
        message: 'Monthly credits already claimed for this period.',
        newBalance,
      };
    }
  }
}
