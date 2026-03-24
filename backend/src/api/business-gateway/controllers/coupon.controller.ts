// ============================================================================
// COUPON CONTROLLER - Business API Gateway
// ============================================================================
// Authenticated endpoints for coupon validation and application
// ============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
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
import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { CouponService } from '../../../domain/subscription/services/coupon.service';
import { SubscriptionService } from '../../../domain/subscription/services/subscription.service';
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service';

// ============================================================================
// Request DTOs
// ============================================================================

class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Plan ID to apply coupon to' })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({ description: 'Price amount for discount calculation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;
}

class ApplyCouponToSubscriptionDto {
  @ApiProperty({ description: 'Coupon code to apply' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Subscription ID (uses current subscription if not provided)' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

class CouponValidationResponseDto {
  @ApiProperty()
  isValid: boolean;

  @ApiPropertyOptional()
  coupon?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    duration: string;
    durationInMonths: number | null;
  };

  @ApiPropertyOptional()
  discountAmount?: number;

  @ApiPropertyOptional()
  finalPrice?: number;

  @ApiPropertyOptional()
  errorMessage?: string;
}

class ApplyCouponResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  subscription?: {
    id: string;
    couponId: string;
    discountAmount: number;
  };

  @ApiPropertyOptional()
  errorMessage?: string;
}

class AvailableCouponDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  discountType: string;

  @ApiProperty()
  discountValue: number;

  @ApiProperty()
  appliesTo: string;

  @ApiProperty()
  duration: string;

  @ApiPropertyOptional()
  durationInMonths?: number;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiPropertyOptional()
  minAmount?: number;
}

// ============================================================================
// Controller
// ============================================================================

@Controller('coupons')
@ApiTags('Business Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class CouponController {
  private readonly logger = new Logger(CouponController.name);

  constructor(
    private readonly couponService: CouponService,
    private readonly subscriptionService: SubscriptionService,
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
   * Validate a coupon code
   * Checks if the coupon is valid for the specified plan and user
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({
    status: 200,
    description: 'Coupon validation result',
    type: CouponValidationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  async validateCoupon(
    @Body() dto: ValidateCouponDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CouponValidationResponseDto> {
    this.logger.debug(`Validating coupon ${dto.code} for user ${user.id}`);

    const result = await this.couponService.validateCoupon(
      dto.code,
      dto.planId,
      user.id,
      dto.priceAmount,
    );

    return result;
  }

  /**
   * Apply a coupon to the user's subscription
   */
  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply a coupon to subscription' })
  @ApiResponse({
    status: 200,
    description: 'Coupon applied successfully',
    type: ApplyCouponResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coupon or subscription',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async applyCoupon(
    @Body() dto: ApplyCouponToSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ApplyCouponResponseDto> {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(`Applying coupon ${dto.code} for vendor ${vendorProfileId}`);

    let subscriptionId = dto.subscriptionId;

    // If no subscription ID provided, get the active subscription
    if (!subscriptionId) {
      const subscription =
        await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

      if (!subscription) {
        throw new NotFoundException('No active subscription found');
      }

      subscriptionId = subscription.id;
    } else {
      // Verify the subscription belongs to this vendor
      const subscription = await this.subscriptionService.findById(subscriptionId);
      if ((subscription as any).vendorProfileId !== vendorProfileId) {
        throw new ForbiddenException('Subscription does not belong to this vendor');
      }
    }

    const result = await this.couponService.applyCoupon(dto.code, subscriptionId);

    if (!result.success) {
      throw new BadRequestException(result.errorMessage || 'Failed to apply coupon');
    }

    return result;
  }

  /**
   * Get available coupons for a specific plan
   */
  @Get('available')
  @ApiOperation({ summary: 'Get available coupons for a plan' })
  @ApiResponse({
    status: 200,
    description: 'List of available coupons',
    type: [AvailableCouponDto],
  })
  async getAvailableCoupons(
    @Query('planId') planId?: string,
  ): Promise<AvailableCouponDto[]> {
    this.logger.debug(`Getting available coupons for plan: ${planId || 'all'}`);

    const coupons = await this.couponService.getAvailableCoupons(planId);

    return coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || undefined,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      appliesTo: coupon.appliesTo,
      duration: coupon.duration,
      durationInMonths: coupon.durationInMonths || undefined,
      validUntil: coupon.validUntil || undefined,
      minAmount: coupon.minAmount ? Number(coupon.minAmount) : undefined,
    }));
  }

  /**
   * Remove coupon from current subscription
   */
  @Post('remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove coupon from subscription' })
  @ApiResponse({
    status: 200,
    description: 'Coupon removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'No coupon applied to subscription',
  })
  @ApiResponse({
    status: 403,
    description: 'Vendor profile required',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async removeCoupon(@CurrentUser() user: CurrentUserData) {
    const vendorProfileId = await this.getVendorProfileId(user.id);

    this.logger.log(`Removing coupon for vendor ${vendorProfileId}`);

    const subscription =
      await this.subscriptionService.findActiveByVendorProfile(vendorProfileId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const updated = await this.couponService.removeCouponFromSubscription(
      subscription.id,
    );

    return {
      success: true,
      subscriptionId: updated.id,
    };
  }
}
