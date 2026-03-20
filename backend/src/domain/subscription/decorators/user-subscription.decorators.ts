// ============================================================================
// USER SUBSCRIPTION DECORATORS - Planning Tool Feature Gating
// ============================================================================
// Decorators for protecting planning tool endpoints with subscription checks
// Usage limits are PER-EVENT (guests_per_event, memory_uploads_per_event, etc.)

import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { UserPlanTier } from '@prisma/client';
import { UserSubscriptionGuard } from '../guards/user-subscription.guard';

// ============================================================================
// Metadata Keys
// ============================================================================

export const REQUIRED_USER_PLAN_KEY = 'required_user_plan';
export const REQUIRED_USER_FEATURE_KEY = 'required_user_feature';
export const CHECK_EVENT_FEATURE_KEY = 'check_event_feature';

// ============================================================================
// Plan Tier Decorators
// ============================================================================

/**
 * Decorator to require specific user plan tiers
 * Usage: @RequireUserPlan(UserPlanTier.BASIC, UserPlanTier.PREMIUM)
 *
 * Tier hierarchy: FREE=0, BASIC=1, PREMIUM=2
 * Users with higher tiers can access lower tier features
 */
export const RequireUserPlan = (...tiers: UserPlanTier[]) => {
  return applyDecorators(
    SetMetadata(REQUIRED_USER_PLAN_KEY, tiers),
    UseGuards(UserSubscriptionGuard),
  );
};

// ============================================================================
// Feature Access Decorators
// ============================================================================

/**
 * Decorator to require access to a specific feature
 * Checks if the user's plan includes the feature (boolean feature check)
 * Usage: @RequireUserFeature('e_invite')
 */
export const RequireUserFeature = (featureKey: string) => {
  return applyDecorators(
    SetMetadata(REQUIRED_USER_FEATURE_KEY, featureKey),
    UseGuards(UserSubscriptionGuard),
  );
};

/**
 * Decorator for per-event feature limit checks
 * Reads eventId from route params and checks usage against plan limits
 * Usage: @CheckEventFeature('guests_per_event')
 *
 * NOTE: The endpoint must have :eventId in the route params
 */
export const CheckEventFeature = (featureKey: string) => {
  return applyDecorators(
    SetMetadata(CHECK_EVENT_FEATURE_KEY, featureKey),
    UseGuards(UserSubscriptionGuard),
  );
};

// ============================================================================
// Shorthand Decorators
// ============================================================================

/**
 * Require BASIC or PREMIUM plan
 * Most paid features use this decorator
 */
export const RequireBasicPlan = () => {
  return RequireUserPlan(UserPlanTier.BASIC, UserPlanTier.PREMIUM);
};

/**
 * Require PREMIUM plan only
 * For exclusive premium features
 */
export const RequirePremiumPlan = () => {
  return RequireUserPlan(UserPlanTier.PREMIUM);
};

/**
 * Require E-Invite feature (BASIC+ only)
 * E-Invite is not available in FREE tier
 */
export const RequireEInvite = () => {
  return RequireBasicPlan();
};

/**
 * Require Memory Download feature (BASIC+ only)
 * Memory download is not available in FREE tier
 */
export const RequireMemoryDownload = () => {
  return RequireBasicPlan();
};

// ============================================================================
// Combined Decorators (for common use cases)
// ============================================================================

/**
 * Check guests per event limit
 * Usage: @CheckGuestsLimit() on guest creation endpoints
 */
export const CheckGuestsLimit = () => {
  return CheckEventFeature('guests_per_event');
};

/**
 * Check memory uploads per event limit
 * Usage: @CheckMemoryUploadsLimit() on memory upload endpoints
 */
export const CheckMemoryUploadsLimit = () => {
  return CheckEventFeature('memory_uploads_per_event');
};

/**
 * Check WhatsApp invites per event limit
 * Usage: @CheckWhatsAppInvitesLimit() on WhatsApp invite endpoints
 */
export const CheckWhatsAppInvitesLimit = () => {
  return CheckEventFeature('whatsapp_invites_per_event');
};
