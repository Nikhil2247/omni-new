// ============================================================================
// USER SUBSCRIPTION GUARD - Planning Tool Access Control
// ============================================================================
// Guards planning tool endpoints with user subscription checks
// Supports plan tier verification and per-event feature limits

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserPlanTier, FeatureLimitType } from '@prisma/client';
import { UserSubscriptionRepository } from '../repositories/user-subscription.repository';
import {
  REQUIRED_USER_PLAN_KEY,
  REQUIRED_USER_FEATURE_KEY,
  CHECK_EVENT_FEATURE_KEY,
} from '../decorators/user-subscription.decorators';

// Tier hierarchy for comparison (higher number = higher tier)
const TIER_HIERARCHY: Record<UserPlanTier, number> = {
  [UserPlanTier.FREE]: 0,
  [UserPlanTier.BASIC]: 1,
  [UserPlanTier.PREMIUM]: 2,
  [UserPlanTier.ENTERPRISE]: 3,
};

@Injectable()
export class UserSubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(UserSubscriptionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly userSubscriptionRepository: UserSubscriptionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get metadata from decorators
    const requiredPlanTiers = this.reflector.get<UserPlanTier[]>(
      REQUIRED_USER_PLAN_KEY,
      context.getHandler(),
    );

    const requiredFeature = this.reflector.get<string>(
      REQUIRED_USER_FEATURE_KEY,
      context.getHandler(),
    );

    const checkEventFeature = this.reflector.get<string>(
      CHECK_EVENT_FEATURE_KEY,
      context.getHandler(),
    );

    // If no metadata set, allow access
    if (!requiredPlanTiers && !requiredFeature && !checkEventFeature) {
      return true;
    }

    // Get request and extract user ID
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Get user's active subscription with plan details
    const subscription =
      await this.userSubscriptionRepository.findActiveByUserId(userId);

    // Cast to include relations (repository includes plan and features)
    const subscriptionWithPlan = subscription as typeof subscription & {
      plan?: { tier: UserPlanTier; features: Array<{ featureKey: string; limitType: FeatureLimitType; limitValue: number | null }> };
    };

    // If no subscription, treat as FREE tier
    const userTier = subscriptionWithPlan?.plan?.tier ?? UserPlanTier.FREE;
    const planFeatures = subscriptionWithPlan?.plan?.features ?? [];

    this.logger.debug(
      `Checking subscription for user ${userId}, tier: ${userTier}`,
    );

    // Check required plan tiers
    if (requiredPlanTiers && requiredPlanTiers.length > 0) {
      const hasRequiredTier = this.checkTierAccess(userTier, requiredPlanTiers);

      if (!hasRequiredTier) {
        const requiredTierNames = requiredPlanTiers.join(' or ');
        throw new ForbiddenException(
          `This feature requires a ${requiredTierNames} plan. ` +
            `Please upgrade your subscription to access this feature.`,
        );
      }
    }

    // Check required feature (boolean feature check)
    if (requiredFeature) {
      const hasFeature = this.checkFeatureAccess(requiredFeature, planFeatures);

      if (!hasFeature) {
        throw new ForbiddenException(
          `Your current plan does not include the "${requiredFeature}" feature. ` +
            `Please upgrade your subscription to access this feature.`,
        );
      }
    }

    // Check per-event feature limit
    if (checkEventFeature) {
      // Try to get eventId from multiple sources:
      // 1. Route params (e.g., /events/:eventId/...)
      // 2. Request body (e.g., { eventId: '...' })
      // 3. Query params (e.g., ?eventId=...)
      let eventId =
        request.params?.eventId ||
        request.body?.eventId ||
        request.query?.eventId;

      // If no eventId but we have guestlistId, skip the guard check here
      // The controller will handle the validation after fetching the guestlist
      if (!eventId && (request.body?.guestlistId || request.params?.guestlistId)) {
        this.logger.debug(
          `Event ID not found but guestlistId present - deferring check to controller`,
        );
        // Allow the request to proceed - the controller will handle the eventId lookup
        // and usage tracking after fetching the guestlist
        return true;
      }

      if (!eventId) {
        this.logger.warn(
          `Event ID required for feature check but not found in params, body, or query`,
        );
        throw new ForbiddenException('Event ID is required for this operation');
      }

      if (!subscription) {
        throw new ForbiddenException(
          'Active subscription required for this feature',
        );
      }

      const canUseFeature = await this.checkEventFeatureLimit(
        subscription.id,
        eventId,
        checkEventFeature,
        planFeatures,
      );

      if (!canUseFeature) {
        throw new ForbiddenException(
          `You have reached the limit for "${checkEventFeature}" on this event. ` +
            `Please upgrade your subscription to increase your limits.`,
        );
      }
    }

    return true;
  }

  /**
   * Check if user's tier meets the required tier(s)
   * Higher tiers can access lower tier features
   */
  private checkTierAccess(
    userTier: UserPlanTier,
    requiredTiers: UserPlanTier[],
  ): boolean {
    const userTierLevel = TIER_HIERARCHY[userTier];

    // Check if user's tier matches any required tier OR is higher
    for (const requiredTier of requiredTiers) {
      const requiredTierLevel = TIER_HIERARCHY[requiredTier];
      if (userTierLevel >= requiredTierLevel) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user's plan includes a specific feature (boolean check)
   */
  private checkFeatureAccess(
    featureKey: string,
    planFeatures: Array<{
      featureKey: string;
      limitType: FeatureLimitType;
      limitValue?: number | null;
    }>,
  ): boolean {
    const feature = planFeatures.find((f) => f.featureKey === featureKey);

    if (!feature) {
      return false;
    }

    // For boolean features, check if it exists and has value true (or 1)
    if (feature.limitType === FeatureLimitType.BOOLEAN) {
      return feature.limitValue === 1 || feature.limitValue === null;
    }

    // For count/unlimited features, having the feature means access
    return true;
  }

  /**
   * Check if user can use more of a feature on a specific event
   */
  private async checkEventFeatureLimit(
    subscriptionId: string,
    eventId: string,
    featureKey: string,
    planFeatures: Array<{
      featureKey: string;
      limitType: FeatureLimitType;
      limitValue?: number | null;
    }>,
  ): Promise<boolean> {
    const feature = planFeatures.find((f) => f.featureKey === featureKey);

    if (!feature) {
      this.logger.warn(
        `Feature ${featureKey} not found in plan - denying access`,
      );
      return false;
    }

    // Unlimited features always allowed
    if (feature.limitType === FeatureLimitType.UNLIMITED) {
      return true;
    }

    // Boolean features - just check if enabled
    if (feature.limitType === FeatureLimitType.BOOLEAN) {
      return feature.limitValue === 1 || feature.limitValue === null;
    }

    // For count-based features, check current usage against limit
    const limit = feature.limitValue ?? 0;

    if (limit === 0) {
      return false;
    }

    // Get current usage for this event
    const currentUsage = await this.userSubscriptionRepository.getUsageForEvent(
      subscriptionId,
      eventId,
      featureKey,
    );

    this.logger.debug(
      `Feature ${featureKey} usage for event ${eventId}: ${currentUsage}/${limit}`,
    );

    return currentUsage < limit;
  }
}
