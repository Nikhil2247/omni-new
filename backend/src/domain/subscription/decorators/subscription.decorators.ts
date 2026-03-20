// ============================================================================
// SUBSCRIPTION DECORATORS - Feature Gating
// ============================================================================

import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { PlanTier } from '../dto/subscription-plan.dto';
import {
  SubscriptionGuard,
  ActiveSubscriptionGuard,
} from '../guards/subscription.guard';

export const REQUIRED_FEATURE_KEY = 'required_feature';
export const REQUIRED_PLAN_KEY = 'required_plan';

// ============================================================================
// Feature-Based Decorators
// ============================================================================

/**
 * Decorator to require a specific feature limit by feature key
 * Usage: @RequireFeature('leads_per_month')
 *
 * @param featureKey - The feature key to check against the subscription plan
 */
export const RequireFeature = (featureKey: string) => {
  return applyDecorators(
    SetMetadata(REQUIRED_FEATURE_KEY, featureKey),
    UseGuards(SubscriptionGuard),
  );
};

/**
 * Decorator to require messaging feature (PRO+ plans)
 * Messaging features are available on Professional and Enterprise tiers
 * Usage: @RequireMessaging()
 */
export const RequireMessaging = () => {
  return applyDecorators(
    SetMetadata(REQUIRED_FEATURE_KEY, 'messaging'),
    SetMetadata(REQUIRED_PLAN_KEY, [PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE]),
    UseGuards(SubscriptionGuard),
  );
};

// ============================================================================
// Plan Tier-Based Decorators
// ============================================================================

/**
 * Decorator to require specific plan tiers
 * The guard will check if the vendor's current tier meets the minimum required tier
 *
 * Usage:
 *   @RequirePlan(PlanTier.STARTER) - Requires Starter or higher
 *   @RequirePlan(PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE) - Requires Pro or Enterprise
 *
 * @param tiers - One or more plan tiers that are allowed access
 */
export const RequirePlan = (...tiers: PlanTier[]) => {
  return applyDecorators(
    SetMetadata(REQUIRED_PLAN_KEY, tiers),
    UseGuards(SubscriptionGuard),
  );
};

/**
 * Decorator to require Professional or higher plan (PRO+)
 * Shorthand for @RequirePlan(PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE)
 * Usage: @RequireProPlan()
 */
export const RequireProPlan = () => {
  return RequirePlan(PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE);
};

/**
 * Decorator to require Enterprise plan only
 * Shorthand for @RequirePlan(PlanTier.ENTERPRISE)
 * Usage: @RequireEnterprisePlan()
 */
export const RequireEnterprisePlan = () => {
  return RequirePlan(PlanTier.ENTERPRISE);
};

// ============================================================================
// Legacy Aliases (for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use RequireProPlan() instead
 * Decorator to require professional or higher plan
 */
export const RequireProfessional = () => {
  return RequirePlan(PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE);
};

/**
 * @deprecated Use RequireEnterprisePlan() instead
 * Decorator to require enterprise plan
 */
export const RequireEnterprise = () => {
  return RequirePlan(PlanTier.ENTERPRISE);
};

// ============================================================================
// Subscription Status Decorators
// ============================================================================

/**
 * Decorator to require any active subscription
 * Does not check for specific tier, only that a subscription exists
 * Usage: @RequireSubscription()
 */
export const RequireSubscription = () => {
  return UseGuards(ActiveSubscriptionGuard);
};
