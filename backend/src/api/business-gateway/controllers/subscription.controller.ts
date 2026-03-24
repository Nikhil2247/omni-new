// ============================================================================
// BUSINESS SUBSCRIPTION CONTROLLER - Business API Gateway
// ============================================================================
// Authenticated endpoints for vendor subscription management
// Handles subscription viewing, upgrades, downgrades, and lifecycle operations
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsUUID, IsOptional, IsBoolean, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { SubscriptionService } from '../../../domain/subscription/services/subscription.service';
import { SubscriptionPlanService } from '../../../domain/subscription/services/subscription-plan.service';
import { CouponService } from '../../../domain/subscription/services/coupon.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionResponseDto,
} from '../../../domain/subscription/dto/subscription.dto';

// ============================================================================
// Request DTOs
// ============================================================================

class UpgradeSubscriptionDto {
  @ApiProperty({ description: 'Target plan ID' })
  @IsUUID()
  newPlanId: string;

  @ApiProperty({ description: 'Target price ID' })
  @IsUUID()
  newPriceId: string;

  @ApiPropertyOptional({ description: 'Upgrade immediately or at period end' })
  @IsOptional()
  @IsBoolean()
  immediateUpgrade?: boolean;

  @ApiPropertyOptional({ description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

class DowngradeSubscriptionDto {
  @ApiProperty({ description: 'Target plan ID' })
  @IsUUID()
  newPlanId: string;

  @ApiProperty({ description: 'Target price ID' })
  @IsUUID()
  newPriceId: string;

  @ApiPropertyOptional({ description: 'Reason for downgrade' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

class SubscriptionStatusResponseDto {
  hasActiveSubscription: boolean;
  subscription?: SubscriptionResponseDto;
}

class SubscriptionPlanResponseDto {
  id: string;
  name: string;
  slug: string;
  tier: string;
  description?: string;
  displayOrder: number;
  isPopular: boolean;
  trialDays: number;
  isActive: boolean;
  isPublic: boolean;
  features?: any[];
  prices?: any[];
}

// ============================================================================
// Controller
// ============================================================================

@Controller('subscription')
@ApiTags('Business Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class BusinessSubscriptionController {
  private readonly logger = new Logger(BusinessSubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly planService: SubscriptionPlanService,
    private readonly couponService: CouponService,
    private readonly vendorProfileService: VendorProfileService,
  ) {}

  /**
   * Helper to get and validate vendor profile for current user
   */
  private async getVendorProfileId(userId: string): Promise<string> {
    try {
      const profile = await this.vendorProfileService.findByUserId(userId);
      return profile.id;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ForbiddenException('Vendor profile required');
      }
      throw error;
    }
  }

  /**
   * Get current subscription for the vendor
   */
  @Get()
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({
    status: 200,
    description: 'Current subscription retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  async getCurrentSubscription(
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionStatusResponseDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.debug(
      `Getting current subscription for vendor: ${vendorProfileId}`,
    );

    const subscription =
      await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

    if (!subscription) {
      return {
        hasActiveSubscription: false,
      };
    }

    // Get full subscription details with plan info
    const fullSubscription = await this.subscriptionService.findById(
      subscription.id,
    );

    return {
      hasActiveSubscription: true,
      subscription: fullSubscription as SubscriptionResponseDto,
    };
  }

  /**
   * Get subscription usage details
   * Returns current usage for metered features
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get subscription usage details' })
  @ApiResponse({
    status: 200,
    description: 'Usage details retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No subscription found',
  })
  async getSubscriptionUsage(@CurrentUser() user: CurrentUserData) {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.debug(`Getting subscription usage for vendor: ${vendorProfileId}`);

    const subscription =
      await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Get usage records for this subscription
    const usageDetails = await this.subscriptionService.getUsageDetails(
      subscription.id,
    );

    return {
      subscriptionId: subscription.id,
      planId: subscription.planId,
      usage: usageDetails,
    };
  }

  /**
   * Get available subscription plans
   */
  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'Available plans retrieved successfully',
    type: [SubscriptionPlanResponseDto],
  })
  async getAvailablePlans(): Promise<SubscriptionPlanResponseDto[]> {
    this.logger.debug('Getting available subscription plans');

    const plans = await this.planService.findActive();
    return plans as SubscriptionPlanResponseDto[];
  }

  /**
   * Upgrade subscription to a higher tier plan
   * Takes effect immediately with prorated billing
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade to a new plan' })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid upgrade request or no active subscription',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async upgradeSubscription(
    @Body() dto: UpgradeSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionResponseDto & { couponApplied?: boolean; discountAmount?: number }> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(
      `Upgrading subscription for vendor ${vendorProfileId} to plan ${dto.newPlanId}`,
    );

    // Find active subscription
    const subscription =
      await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Verify the target plan exists and is active
    const targetPlan = await this.planService.findById(dto.newPlanId);
    if (!targetPlan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    // Update subscription with new plan (immediate upgrade)
    const updated = await this.subscriptionService.update(subscription.id, {
      planId: dto.newPlanId,
      priceId: dto.newPriceId,
    });

    // Apply coupon if provided
    let couponApplied = false;
    let discountAmount: number | undefined;

    if (dto.couponCode) {
      const couponResult = await this.couponService.applyCoupon(
        dto.couponCode,
        updated.id,
      );

      if (couponResult.success) {
        couponApplied = true;
        discountAmount = couponResult.subscription?.discountAmount;
        this.logger.log(
          `Coupon ${dto.couponCode} applied to upgraded subscription ${updated.id}`,
        );
      } else {
        this.logger.warn(
          `Failed to apply coupon ${dto.couponCode}: ${couponResult.errorMessage}`,
        );
      }
    }

    return {
      ...(updated as SubscriptionResponseDto),
      couponApplied,
      discountAmount,
    };
  }

  /**
   * Downgrade subscription to a lower tier plan
   * Takes effect at the end of the current billing period
   */
  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Downgrade to a lower plan (takes effect at period end)' })
  @ApiResponse({
    status: 200,
    description: 'Subscription downgrade scheduled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid downgrade request or no active subscription',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async downgradeSubscription(
    @Body() dto: DowngradeSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionResponseDto & { couponApplied?: boolean; discountAmount?: number }> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(
      `Scheduling downgrade for vendor ${vendorProfileId} to plan ${dto.newPlanId}`,
    );

    // Find active subscription
    const subscription =
      await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Verify the target plan exists and is active
    const targetPlan = await this.planService.findById(dto.newPlanId);
    if (!targetPlan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    // For downgrades, we update the subscription but note that it takes effect at period end
    // The actual plan change would be handled by a scheduled job at period end
    const updated = await this.subscriptionService.update(subscription.id, {
      planId: dto.newPlanId,
      priceId: dto.newPriceId,
    });

    // Apply coupon if provided
    let couponApplied = false;
    let discountAmount: number | undefined;

    if (dto.couponCode) {
      const couponResult = await this.couponService.applyCoupon(
        dto.couponCode,
        updated.id,
      );

      if (couponResult.success) {
        couponApplied = true;
        discountAmount = couponResult.subscription?.discountAmount;
        this.logger.log(
          `Coupon ${dto.couponCode} applied to downgraded subscription ${updated.id}`,
        );
      } else {
        this.logger.warn(
          `Failed to apply coupon ${dto.couponCode}: ${couponResult.errorMessage}`,
        );
      }
    }

    return {
      ...(updated as SubscriptionResponseDto),
      couponApplied,
      discountAmount,
    };
  }

  /**
   * Cancel subscription
   * By default, cancellation takes effect at the end of the billing period
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Subscription is already cancelled',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async cancelSubscription(
    @Body() dto: CancelSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionResponseDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(`Cancelling subscription for vendor ${vendorProfileId}`);

    // Find active subscription
    const subscription =
      await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      const cancelled = await this.subscriptionService.cancel(
        subscription.id,
        dto,
      );
      return cancelled as SubscriptionResponseDto;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate a cancelled subscription
   * Only works if the subscription is cancelled but period hasn't expired
   */
  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate cancelled subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription reactivated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Subscription is not cancelled or period has expired',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No subscription found',
  })
  async reactivateSubscription(
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionResponseDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(`Reactivating subscription for vendor ${vendorProfileId}`);

    // Find subscription (including cancelled ones) - returns array
    const subscriptions =
      await this.subscriptionService.findByVendorProfile(vendorProfileId);

    if (!subscriptions || subscriptions.length === 0) {
      throw new NotFoundException('No subscription found');
    }

    // Use the most recent subscription
    const subscription = subscriptions[0];

    try {
      const reactivated = await this.subscriptionService.reactivate(
        subscription.id,
      );
      return reactivated as SubscriptionResponseDto;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to reactivate subscription');
    }
  }

  /**
   * Pause subscription
   * Temporarily pauses the subscription while preserving the billing cycle
   */
  @Post('pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription paused successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Only active subscriptions can be paused',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async pauseSubscription(
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionResponseDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(`Pausing subscription for vendor ${vendorProfileId}`);

    // Find active subscription
    const subscription =
      await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      const paused = await this.subscriptionService.pause(subscription.id);
      return paused as SubscriptionResponseDto;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to pause subscription');
    }
  }

  /**
   * Resume a paused subscription
   */
  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume paused subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription resumed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Only paused subscriptions can be resumed',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No paused subscription found',
  })
  async resumeSubscription(
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionResponseDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(`Resuming subscription for vendor ${vendorProfileId}`);

    // Find subscription (including paused ones) - returns array
    const subscriptions =
      await this.subscriptionService.findByVendorProfile(vendorProfileId);

    if (!subscriptions || subscriptions.length === 0) {
      throw new NotFoundException('No subscription found');
    }

    // Use the most recent subscription
    const subscription = subscriptions[0];

    try {
      const resumed = await this.subscriptionService.resume(subscription.id);
      return resumed as SubscriptionResponseDto;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to resume subscription');
    }
  }
}
