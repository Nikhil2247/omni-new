// ============================================================================
// COUPON SERVICE - Subscription Domain
// ============================================================================
// Handles coupon validation, application, and tracking
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  DiscountType,
  CouponAppliesTo,
  CouponDuration,
} from '../dto/coupon.dto';

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    discountType: DiscountType;
    discountValue: number;
    duration: CouponDuration;
    durationInMonths: number | null;
  };
  discountAmount?: number;
  finalPrice?: number;
  errorMessage?: string;
}

export interface ApplyCouponResult {
  success: boolean;
  subscription?: {
    id: string;
    couponId: string;
    discountAmount: number;
  };
  errorMessage?: string;
}

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a coupon code for a specific plan and user
   * @param code - Coupon code to validate
   * @param planId - Plan ID to apply coupon to
   * @param userId - User ID (optional, for checking per-user limits)
   * @param priceAmount - Original price amount (optional, for calculating discount)
   */
  async validateCoupon(
    code: string,
    planId: string,
    userId?: string,
    priceAmount?: number,
  ): Promise<CouponValidationResult> {
    this.logger.debug(`Validating coupon code: ${code} for plan: ${planId}`);

    // Find the coupon by code
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        plan: true,
      },
    });

    if (!coupon) {
      return {
        isValid: false,
        errorMessage: 'Invalid coupon code',
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        isValid: false,
        errorMessage: 'This coupon is no longer active',
      };
    }

    // Check validity period
    const now = new Date();
    if (coupon.validFrom > now) {
      return {
        isValid: false,
        errorMessage: 'This coupon is not yet valid',
      };
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return {
        isValid: false,
        errorMessage: 'This coupon has expired',
      };
    }

    // Check max redemptions
    if (
      coupon.maxRedemptions !== null &&
      coupon.timesRedeemed >= coupon.maxRedemptions
    ) {
      return {
        isValid: false,
        errorMessage: 'This coupon has reached its maximum redemptions',
      };
    }

    // Check plan applicability
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { prices: true },
    });

    if (!plan) {
      return {
        isValid: false,
        errorMessage: 'Invalid plan',
      };
    }

    // Check if coupon applies to this plan
    const appliesTo = coupon.appliesTo as CouponAppliesTo;
    if (appliesTo === 'SPECIFIC_PLAN' && coupon.planId !== planId) {
      return {
        isValid: false,
        errorMessage: 'This coupon does not apply to the selected plan',
      };
    }

    if (appliesTo === 'PAID_PLANS_ONLY' && plan.tier === 'FREE') {
      return {
        isValid: false,
        errorMessage: 'This coupon only applies to paid plans',
      };
    }

    // Check per-user redemption limit if userId provided
    if (userId && coupon.maxRedemptionsPerUser !== null) {
      const userRedemptions = await this.prisma.subscription.count({
        where: {
          couponId: coupon.id,
          vendorProfile: {
            userId: userId,
          },
        },
      });

      if (userRedemptions >= coupon.maxRedemptionsPerUser) {
        return {
          isValid: false,
          errorMessage: 'You have already used this coupon the maximum number of times',
        };
      }
    }

    // Check minimum amount requirement
    if (priceAmount !== undefined && coupon.minAmount !== null) {
      const minAmount = Number(coupon.minAmount);
      if (priceAmount < minAmount) {
        return {
          isValid: false,
          errorMessage: `Minimum purchase amount of ${minAmount} required for this coupon`,
        };
      }
    }

    // Calculate discount amount if price is provided
    let discountAmount: number | undefined;
    let finalPrice: number | undefined;

    if (priceAmount !== undefined) {
      const discountValue = Number(coupon.discountValue);
      const discountType = coupon.discountType as DiscountType;

      if (discountType === 'PERCENTAGE') {
        discountAmount = (priceAmount * discountValue) / 100;
      } else {
        // FIXED_AMOUNT
        discountAmount = discountValue;
      }

      // Ensure discount doesn't exceed price
      discountAmount = Math.min(discountAmount, priceAmount);
      finalPrice = priceAmount - discountAmount;

      // Round to 2 decimal places
      discountAmount = Math.round(discountAmount * 100) / 100;
      finalPrice = Math.round(finalPrice * 100) / 100;
    }

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType as DiscountType,
        discountValue: Number(coupon.discountValue),
        duration: coupon.duration as CouponDuration,
        durationInMonths: coupon.durationInMonths,
      },
      discountAmount,
      finalPrice,
    };
  }

  /**
   * Apply a coupon to a subscription
   * @param code - Coupon code
   * @param subscriptionId - Subscription ID to apply coupon to
   */
  async applyCoupon(
    code: string,
    subscriptionId: string,
  ): Promise<ApplyCouponResult> {
    this.logger.log(`Applying coupon ${code} to subscription ${subscriptionId}`);

    // Get the subscription with plan and price info
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        price: true,
        vendorProfile: true,
      },
    });

    if (!subscription) {
      return {
        success: false,
        errorMessage: 'Subscription not found',
      };
    }

    // Check if subscription already has a coupon
    if (subscription.couponId) {
      return {
        success: false,
        errorMessage: 'Subscription already has a coupon applied',
      };
    }

    // Validate the coupon
    const priceAmount = subscription.price
      ? Number(subscription.price.amount)
      : undefined;
    const userId = subscription.vendorProfile?.userId ?? undefined;

    const validation = await this.validateCoupon(
      code,
      subscription.planId,
      userId,
      priceAmount,
    );

    if (!validation.isValid || !validation.coupon) {
      return {
        success: false,
        errorMessage: validation.errorMessage || 'Invalid coupon',
      };
    }

    // Apply the coupon to the subscription
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        couponId: validation.coupon.id,
        discountAmount: validation.discountAmount
          ? new Prisma.Decimal(validation.discountAmount)
          : null,
      },
    });

    // Increment coupon redemption count
    await this.incrementRedemption(validation.coupon.id);

    this.logger.log(
      `Coupon ${code} applied to subscription ${subscriptionId} with discount ${validation.discountAmount}`,
    );

    return {
      success: true,
      subscription: {
        id: updatedSubscription.id,
        couponId: updatedSubscription.couponId!,
        discountAmount: validation.discountAmount || 0,
      },
    };
  }

  /**
   * Get available coupons for a specific plan
   * @param planId - Plan ID (optional, returns all active coupons if not provided)
   */
  async getAvailableCoupons(planId?: string) {
    this.logger.debug(`Getting available coupons for plan: ${planId || 'all'}`);

    const now = new Date();

    const whereClause: any = {
      isActive: true,
      validFrom: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gte: now } }],
    };

    // Filter by max redemptions not reached
    whereClause.OR = [
      ...(whereClause.OR || []),
      { maxRedemptions: null },
      {
        maxRedemptions: {
          gt: this.prisma.coupon.fields.timesRedeemed,
        },
      },
    ];

    if (planId) {
      // Get the plan to check tier
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (plan) {
        whereClause.AND = [
          {
            OR: [
              { appliesTo: 'ALL_PLANS' },
              { appliesTo: 'SPECIFIC_PLAN', planId: planId },
              ...(plan.tier !== 'FREE' ? [{ appliesTo: 'PAID_PLANS_ONLY' }] : []),
            ],
          },
        ];
      }
    }

    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        appliesTo: true,
        duration: true,
        durationInMonths: true,
        maxRedemptions: true,
        timesRedeemed: true,
        validFrom: true,
        validUntil: true,
        minAmount: true,
        planId: true,
      },
    });

    // Filter out coupons that have reached max redemptions
    const availableCoupons = coupons.filter((coupon) => {
      if (coupon.maxRedemptions === null) return true;
      return coupon.timesRedeemed < coupon.maxRedemptions;
    });

    // Filter by plan applicability if planId provided
    if (planId) {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      return availableCoupons.filter((coupon) => {
        if (coupon.appliesTo === 'ALL_PLANS') return true;
        if (coupon.appliesTo === 'SPECIFIC_PLAN' && coupon.planId === planId)
          return true;
        if (coupon.appliesTo === 'PAID_PLANS_ONLY' && plan && plan.tier !== 'FREE')
          return true;
        return false;
      });
    }

    return availableCoupons;
  }

  /**
   * Track coupon redemption (increment usage count)
   * @param couponId - Coupon ID
   * @param userId - User ID who redeemed (optional, for tracking)
   */
  async trackRedemption(couponId: string, userId?: string): Promise<void> {
    this.logger.log(`Tracking redemption for coupon ${couponId}`);
    await this.incrementRedemption(couponId);
  }

  /**
   * Increment the redemption count for a coupon
   */
  private async incrementRedemption(couponId: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        timesRedeemed: { increment: 1 },
      },
    });
  }

  /**
   * Get coupon by ID
   */
  async findById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  /**
   * Get coupon by code
   */
  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        plan: true,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  /**
   * Calculate discount for a given price
   */
  calculateDiscount(
    discountType: DiscountType,
    discountValue: number,
    originalPrice: number,
  ): { discountAmount: number; finalPrice: number } {
    let discountAmount: number;

    if (discountType === 'PERCENTAGE') {
      discountAmount = (originalPrice * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    // Ensure discount doesn't exceed price
    discountAmount = Math.min(discountAmount, originalPrice);
    const finalPrice = originalPrice - discountAmount;

    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  }

  /**
   * Remove coupon from subscription
   */
  async removeCouponFromSubscription(subscriptionId: string) {
    this.logger.log(`Removing coupon from subscription ${subscriptionId}`);

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.couponId) {
      throw new BadRequestException('Subscription does not have a coupon applied');
    }

    // Decrement the redemption count
    await this.prisma.coupon.update({
      where: { id: subscription.couponId },
      data: {
        timesRedeemed: { decrement: 1 },
      },
    });

    // Remove coupon from subscription
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        couponId: null,
        discountAmount: null,
      },
    });
  }
}
