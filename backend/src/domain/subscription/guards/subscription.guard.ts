// ============================================================================
// SUBSCRIPTION GUARD - Feature Access Control
// ============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService } from '../services/usage.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PlanTier } from '../dto/subscription-plan.dto';
import {
  REQUIRED_FEATURE_KEY,
  REQUIRED_PLAN_KEY,
} from '../decorators/subscription.decorators';

/**
 * Plan tier hierarchy levels for comparison
 * Higher number = higher tier
 */
const PLAN_TIER_LEVELS: Record<PlanTier, number> = {
  [PlanTier.FREE]: 0,
  [PlanTier.STARTER]: 1,
  [PlanTier.PROFESSIONAL]: 2,
  [PlanTier.ENTERPRISE]: 3,
};

/**
 * Get the numeric level for a plan tier
 */
function getTierLevel(tier: PlanTier): number {
  return PLAN_TIER_LEVELS[tier] ?? 0;
}

/**
 * Get the minimum required tier from an array of tiers
 */
function getMinimumRequiredTier(tiers: PlanTier[]): PlanTier {
  return tiers.reduce((min, tier) =>
    getTierLevel(tier) < getTierLevel(min) ? tier : min
  );
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usageService: UsageService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string>(
      REQUIRED_FEATURE_KEY,
      context.getHandler(),
    );

    const requiredPlan = this.reflector.get<PlanTier[]>(
      REQUIRED_PLAN_KEY,
      context.getHandler(),
    );

    if (!requiredFeature && !requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const vendorProfileId =
      request.user?.vendorProfileId || request.params?.vendorProfileId;

    if (!vendorProfileId) {
      throw new ForbiddenException('Vendor profile ID required');
    }

    // Check feature limit
    if (requiredFeature) {
      const canUse = await this.usageService.canUseFeature(
        vendorProfileId,
        requiredFeature,
      );
      if (!canUse) {
        throw new ForbiddenException(
          `Feature limit exceeded: ${requiredFeature}. Please upgrade your plan.`,
        );
      }
    }

    // Check plan tier
    if (requiredPlan && requiredPlan.length > 0) {
      const subscription =
        await this.subscriptionRepository.findActiveByVendorProfile(
          vendorProfileId,
        );

      if (!subscription) {
        throw new ForbiddenException(
          'No active subscription found. Please subscribe to access this feature.',
        );
      }

      const currentTier = (subscription as any).plan?.tier as PlanTier;
      if (!currentTier) {
        throw new ForbiddenException(
          'Unable to determine subscription tier. Please contact support.',
        );
      }

      const currentTierLevel = getTierLevel(currentTier);
      const minimumRequiredTier = getMinimumRequiredTier(requiredPlan);
      const minimumRequiredLevel = getTierLevel(minimumRequiredTier);

      if (currentTierLevel < minimumRequiredLevel) {
        const tierNames = requiredPlan
          .map((t) => t.charAt(0) + t.slice(1).toLowerCase())
          .join(' or ');
        throw new ForbiddenException(
          `This feature requires a ${tierNames} plan. ` +
            `Your current plan is ${currentTier.charAt(0) + currentTier.slice(1).toLowerCase()}. ` +
            `Please upgrade to access this feature.`,
        );
      }
    }

    return true;
  }
}

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(private readonly usageService: UsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const vendorProfileId =
      request.user?.vendorProfileId || request.params?.vendorProfileId;

    if (!vendorProfileId) {
      return true; // Allow if not a vendor request
    }

    try {
      // Check if vendor has any feature access (indicates active subscription)
      await this.usageService.getAllFeatureLimits(vendorProfileId);
      return true;
    } catch {
      throw new ForbiddenException('Active subscription required');
    }
  }
}
