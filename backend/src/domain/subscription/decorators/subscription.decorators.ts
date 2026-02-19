// ============================================================================
// SUBSCRIPTION DECORATORS - Feature Gating
// ============================================================================

import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { FeatureLimitType, PlanTier } from '../dto/subscription-plan.dto';
import {
  SubscriptionGuard,
  ActiveSubscriptionGuard,
} from '../guards/subscription.guard';

export const REQUIRED_FEATURE_KEY = 'required_feature';
export const REQUIRED_PLAN_KEY = 'required_plan';

/**
 * Decorator to require a specific feature limit
 * Usage: @RequireFeature(FeatureLimitType.LEADS_PER_MONTH)
 */
export const RequireFeature = (feature: FeatureLimitType) => {
  return applyDecorators(
    SetMetadata(REQUIRED_FEATURE_KEY, feature),
    UseGuards(SubscriptionGuard),
  );
};

/**
 * Decorator to require specific plan tiers
 * Usage: @RequirePlan(PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE)
 */
export const RequirePlan = (...tiers: PlanTier[]) => {
  return applyDecorators(
    SetMetadata(REQUIRED_PLAN_KEY, tiers),
    UseGuards(SubscriptionGuard),
  );
};

/**
 * Decorator to require any active subscription
 * Usage: @RequireSubscription()
 */
export const RequireSubscription = () => {
  return UseGuards(ActiveSubscriptionGuard);
};

/**
 * Decorator to require professional or higher plan
 */
export const RequireProfessional = () => {
  return RequirePlan(PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE);
};

/**
 * Decorator to require enterprise plan
 */
export const RequireEnterprise = () => {
  return RequirePlan(PlanTier.ENTERPRISE);
};
