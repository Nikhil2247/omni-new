'use client'

import { useUserSubscription, useEventUsage, useUserUsage } from '@/hooks/queries/use-subscription'
import type {
  UserPlanTier,
  FeatureLimitStatus,
  UserSubscription,
  UserSubscriptionStatusResponse
} from '@/lib/api/types/subscription.types'
import { UpgradePrompt } from './upgrade-prompt'

// ============================================================================
// Tier Hierarchy for Access Checking
// ============================================================================

const USER_TIER_HIERARCHY: Record<UserPlanTier, number> = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if current tier meets the required tier level
 */
function checkTierAccess(
  currentTier: UserPlanTier,
  requiredTier: UserPlanTier | UserPlanTier[]
): boolean {
  const currentLevel = USER_TIER_HIERARCHY[currentTier]

  if (Array.isArray(requiredTier)) {
    // Check if current tier is in the allowed tiers list
    return requiredTier.some(tier => USER_TIER_HIERARCHY[tier] <= currentLevel)
  }

  // Check if current tier level is >= required tier level
  return currentLevel >= USER_TIER_HIERARCHY[requiredTier]
}

/**
 * Get user's current tier from subscription data
 */
function getUserTier(
  subscription: UserSubscription | UserSubscriptionStatusResponse | undefined
): UserPlanTier {
  if (!subscription) return 'FREE'

  // Check if it's a status response (no subscription)
  if ('hasSubscription' in subscription && !subscription.hasSubscription) {
    return subscription.tier || 'FREE'
  }

  // It's a full subscription object
  const sub = subscription as UserSubscription
  return sub.plan?.tier || 'FREE'
}

/**
 * Check if a boolean feature is enabled for the user
 */
function checkFeatureEnabled(
  usage: FeatureLimitStatus[] | undefined,
  featureKey: string
): boolean {
  if (!usage) return false

  const feature = usage.find(f => f.featureKey === featureKey)
  if (!feature) return false

  // For boolean features, check if limit > 0 or isUnlimited
  if (feature.isUnlimited) return true
  return feature.limit > 0
}

/**
 * Check if user has remaining usage for a feature
 */
function checkUsageRemaining(
  usage: FeatureLimitStatus[] | undefined,
  featureKey: string
): boolean {
  if (!usage) return false

  const feature = usage.find(f => f.featureKey === featureKey)
  if (!feature) return false

  if (feature.isUnlimited) return true
  return feature.remaining > 0
}

/**
 * Get the minimum required tier for a feature from usage data
 */
function getRequiredTierForFeature(featureKey: string): UserPlanTier {
  // This mapping should ideally come from the backend
  // For now, we provide sensible defaults
  const featureTierMap: Record<string, UserPlanTier> = {
    // Event features
    'max_events': 'FREE',
    'max_guests_per_event': 'FREE',
    'event_photos': 'BASIC',
    'event_custom_branding': 'PREMIUM',

    // Premium features
    'priority_support': 'PREMIUM',
    'analytics_dashboard': 'BASIC',
    'export_data': 'BASIC',
    'api_access': 'PREMIUM',

    // Collaboration
    'team_members': 'BASIC',
    'shared_events': 'PREMIUM',
  }

  return featureTierMap[featureKey] || 'PREMIUM'
}

// ============================================================================
// Feature Gate Component
// ============================================================================

interface FeatureGateProps {
  children: React.ReactNode

  /**
   * Required subscription tier(s) for access
   * Can be a single tier or array of allowed tiers
   */
  requiredTier?: UserPlanTier | UserPlanTier[]

  /**
   * Feature key for boolean feature checking
   * Uses the feature limit data to check if feature is enabled
   */
  featureKey?: string

  /**
   * Event ID for per-event limit checking
   * Used in conjunction with eventFeatureKey
   */
  eventId?: string

  /**
   * Feature key to check within event context
   */
  eventFeatureKey?: string

  /**
   * What to render when access is denied
   * If not provided and showUpgradePrompt is true, shows UpgradePrompt
   */
  fallback?: React.ReactNode

  /**
   * Whether to show the upgrade prompt when access is denied
   * @default true
   */
  showUpgradePrompt?: boolean

  /**
   * Custom title for the upgrade prompt
   */
  upgradeTitle?: string

  /**
   * Custom description for the upgrade prompt
   */
  upgradeDescription?: string

  /**
   * Callback when upgrade is requested
   */
  onUpgrade?: () => void
}

export function FeatureGate({
  children,
  requiredTier,
  featureKey,
  eventId,
  eventFeatureKey,
  fallback,
  showUpgradePrompt = true,
  upgradeTitle,
  upgradeDescription,
  onUpgrade,
}: FeatureGateProps) {
  const { data: subscription, isLoading: subscriptionLoading } = useUserSubscription()
  const { data: usage, isLoading: usageLoading } = useUserUsage()
  const { data: eventUsage, isLoading: eventUsageLoading } = useEventUsage(eventId || '', {
    enabled: !!eventId && !!eventFeatureKey,
  })

  // Get current user tier
  const currentTier = getUserTier(subscription)

  // Loading state - show children to avoid flash
  if (subscriptionLoading || usageLoading || (eventId && eventFeatureKey && eventUsageLoading)) {
    return <>{children}</>
  }

  let hasAccess = true
  let denialReason: 'tier' | 'feature' | 'event_limit' | null = null
  let requiredTierForPrompt: UserPlanTier | undefined

  // Check tier-based access
  if (requiredTier) {
    const tierAccess = checkTierAccess(currentTier, requiredTier)
    if (!tierAccess) {
      hasAccess = false
      denialReason = 'tier'
      requiredTierForPrompt = Array.isArray(requiredTier) ? requiredTier[0] : requiredTier
    }
  }

  // Check feature-based access (boolean features)
  if (hasAccess && featureKey) {
    const featureEnabled = checkFeatureEnabled(usage, featureKey)
    if (!featureEnabled) {
      hasAccess = false
      denialReason = 'feature'
      requiredTierForPrompt = getRequiredTierForFeature(featureKey)
    }
  }

  // Check event-specific usage limits
  if (hasAccess && eventId && eventFeatureKey) {
    const eventFeatures = eventUsage?.features
    const hasRemaining = checkUsageRemaining(eventFeatures, eventFeatureKey)
    if (!hasRemaining) {
      hasAccess = false
      denialReason = 'event_limit'
      requiredTierForPrompt = getRequiredTierForFeature(eventFeatureKey)
    }
  }

  // If access granted, render children
  if (hasAccess) {
    return <>{children}</>
  }

  // Access denied - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        title={upgradeTitle}
        description={upgradeDescription}
        featureKey={featureKey || eventFeatureKey}
        currentTier={currentTier}
        requiredTier={requiredTierForPrompt}
        variant="inline"
        onUpgrade={onUpgrade}
      />
    )
  }

  // No fallback and no upgrade prompt - render nothing
  return null
}

// ============================================================================
// Hook for programmatic access checking
// ============================================================================

interface UseFeatureAccessOptions {
  requiredTier?: UserPlanTier | UserPlanTier[]
  featureKey?: string
  eventId?: string
  eventFeatureKey?: string
}

interface UseFeatureAccessResult {
  hasAccess: boolean
  isLoading: boolean
  currentTier: UserPlanTier
  requiredTier?: UserPlanTier
  denialReason: 'tier' | 'feature' | 'event_limit' | null
}

export function useFeatureAccess({
  requiredTier,
  featureKey,
  eventId,
  eventFeatureKey,
}: UseFeatureAccessOptions): UseFeatureAccessResult {
  const { data: subscription, isLoading: subscriptionLoading } = useUserSubscription()
  const { data: usage, isLoading: usageLoading } = useUserUsage()
  const { data: eventUsage, isLoading: eventUsageLoading } = useEventUsage(eventId || '', {
    enabled: !!eventId && !!eventFeatureKey,
  })

  const currentTier = getUserTier(subscription)
  const isLoading = subscriptionLoading || usageLoading || (!!eventId && !!eventFeatureKey && eventUsageLoading)

  if (isLoading) {
    return {
      hasAccess: true, // Optimistic while loading
      isLoading: true,
      currentTier,
      denialReason: null,
    }
  }

  let hasAccess = true
  let denialReason: 'tier' | 'feature' | 'event_limit' | null = null
  let requiredTierResult: UserPlanTier | undefined

  // Check tier-based access
  if (requiredTier) {
    const tierAccess = checkTierAccess(currentTier, requiredTier)
    if (!tierAccess) {
      hasAccess = false
      denialReason = 'tier'
      requiredTierResult = Array.isArray(requiredTier) ? requiredTier[0] : requiredTier
    }
  }

  // Check feature-based access
  if (hasAccess && featureKey) {
    const featureEnabled = checkFeatureEnabled(usage, featureKey)
    if (!featureEnabled) {
      hasAccess = false
      denialReason = 'feature'
      requiredTierResult = getRequiredTierForFeature(featureKey)
    }
  }

  // Check event-specific usage limits
  if (hasAccess && eventId && eventFeatureKey) {
    const eventFeatures = eventUsage?.features
    const hasRemaining = checkUsageRemaining(eventFeatures, eventFeatureKey)
    if (!hasRemaining) {
      hasAccess = false
      denialReason = 'event_limit'
      requiredTierResult = getRequiredTierForFeature(eventFeatureKey)
    }
  }

  return {
    hasAccess,
    isLoading: false,
    currentTier,
    requiredTier: requiredTierResult,
    denialReason,
  }
}
