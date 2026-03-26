'use client'

import { useVendorSubscription, useVendorUsage } from '@/hooks/queries/use-subscription'
import type {
  PlanTier,
  FeatureLimitStatus,
  Subscription,
} from '@/lib/api/types/subscription.types'
import { VendorUpgradePrompt } from './upgrade-prompt'

// ============================================================================
// Tier Hierarchy for Access Checking
// ============================================================================

const VENDOR_TIER_HIERARCHY: Record<PlanTier, number> = {
  FREE: 0,
  STARTER: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if current tier meets the required tier level
 */
function checkTierAccess(
  currentTier: PlanTier,
  requiredTier: PlanTier | PlanTier[]
): boolean {
  const currentLevel = VENDOR_TIER_HIERARCHY[currentTier]

  if (Array.isArray(requiredTier)) {
    // Check if current tier is in the allowed tiers list
    return requiredTier.some(tier => VENDOR_TIER_HIERARCHY[tier] <= currentLevel)
  }

  // Check if current tier level is >= required tier level
  return currentLevel >= VENDOR_TIER_HIERARCHY[requiredTier]
}

/**
 * Get vendor's current tier from subscription data
 */
function getVendorTier(subscription: Subscription | null | undefined): PlanTier {
  if (!subscription) return 'FREE'
  return subscription.plan?.tier || 'FREE'
}

/**
 * Check if a boolean feature is enabled for the vendor
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
 * Check if vendor has remaining usage for a feature
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
 * Get the minimum required tier for a feature from feature key
 */
function getRequiredTierForFeature(featureKey: string): PlanTier {
  // This mapping should ideally come from the backend
  // For now, we provide sensible defaults for vendor features
  const featureTierMap: Record<string, PlanTier> = {
    // Listing features
    'max_listings': 'FREE',
    'listing_photos': 'STARTER',
    'listing_videos': 'PROFESSIONAL',
    'featured_listing': 'PROFESSIONAL',

    // Album features
    'max_albums': 'FREE',
    'album_photos': 'STARTER',
    'album_videos': 'PROFESSIONAL',
    'album_watermark': 'PROFESSIONAL',

    // Lead features
    'leads_page': 'STARTER',
    'max_leads': 'FREE',
    'lead_export': 'STARTER',
    'lead_crm_integration': 'PROFESSIONAL',

    // Task features
    'tasks_page': 'STARTER',
    'assigned_tasks': 'STARTER',
    'task_proof_upload': 'STARTER',

    // Marketing features
    'campaigns': 'STARTER',
    'ad_credits': 'STARTER',
    'profile_boost': 'STARTER',
    'banner_ads': 'PROFESSIONAL',

    // Analytics features
    'basic_analytics': 'FREE',
    'advanced_analytics': 'PROFESSIONAL',
    'custom_reports': 'ENTERPRISE',

    // Team features
    'team_members': 'PROFESSIONAL',
    'role_management': 'ENTERPRISE',

    // Integration features
    'api_access': 'PROFESSIONAL',
    'webhooks': 'ENTERPRISE',
    'custom_domain': 'ENTERPRISE',

    // Support features
    'priority_support': 'PROFESSIONAL',
    'dedicated_account_manager': 'ENTERPRISE',
  }

  return featureTierMap[featureKey] || 'PROFESSIONAL'
}

// ============================================================================
// Vendor Feature Gate Component
// ============================================================================

interface VendorFeatureGateProps {
  children: React.ReactNode

  /**
   * Required subscription tier(s) for access
   * Can be a single tier or array of allowed tiers
   */
  requiredTier?: PlanTier | PlanTier[]

  /**
   * Feature key for boolean feature checking
   * Uses the feature limit data to check if feature is enabled
   */
  featureKey?: string

  /**
   * What to render when access is denied
   * If not provided and showUpgradePrompt is true, shows VendorUpgradePrompt
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

export function VendorFeatureGate({
  children,
  requiredTier,
  featureKey,
  fallback,
  showUpgradePrompt = true,
  upgradeTitle,
  upgradeDescription,
  onUpgrade,
}: VendorFeatureGateProps) {
  const { data: subscription, isLoading: subscriptionLoading } = useVendorSubscription()
  const { data: usage, isLoading: usageLoading } = useVendorUsage()

  // Get current vendor tier
  const currentTier = getVendorTier(subscription)

  // Loading state - show children to avoid flash
  if (subscriptionLoading || usageLoading) {
    return <>{children}</>
  }

  let hasAccess = true
  let denialReason: 'tier' | 'feature' | 'usage_limit' | null = null
  let requiredTierForPrompt: PlanTier | undefined

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
      <VendorUpgradePrompt
        title={upgradeTitle}
        description={upgradeDescription}
        featureKey={featureKey}
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
// Vendor Usage Gate (for checking usage limits)
// ============================================================================

interface VendorUsageGateProps {
  children: React.ReactNode

  /**
   * Feature key to check usage for
   */
  featureKey: string

  /**
   * What to render when limit is reached
   */
  fallback?: React.ReactNode

  /**
   * Whether to show the upgrade prompt when limit reached
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

export function VendorUsageGate({
  children,
  featureKey,
  fallback,
  showUpgradePrompt = true,
  upgradeTitle,
  upgradeDescription,
  onUpgrade,
}: VendorUsageGateProps) {
  const { data: subscription, isLoading: subscriptionLoading } = useVendorSubscription()
  const { data: usage, isLoading: usageLoading } = useVendorUsage()

  // Get current vendor tier
  const currentTier = getVendorTier(subscription)

  // Loading state - show children to avoid flash
  if (subscriptionLoading || usageLoading) {
    return <>{children}</>
  }

  // Check if usage has remaining
  const hasRemaining = checkUsageRemaining(usage, featureKey)

  // If has remaining, render children
  if (hasRemaining) {
    return <>{children}</>
  }

  // Usage limit reached - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    const requiredTier = getRequiredTierForFeature(featureKey)

    return (
      <VendorUpgradePrompt
        title={upgradeTitle || 'Usage Limit Reached'}
        description={upgradeDescription || `You have reached your limit for this feature. Upgrade to continue using it.`}
        featureKey={featureKey}
        currentTier={currentTier}
        requiredTier={requiredTier}
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

interface UseVendorFeatureAccessOptions {
  requiredTier?: PlanTier | PlanTier[]
  featureKey?: string
}

interface UseVendorFeatureAccessResult {
  hasAccess: boolean
  isLoading: boolean
  currentTier: PlanTier
  requiredTier?: PlanTier
  denialReason: 'tier' | 'feature' | 'usage_limit' | null
  usage?: FeatureLimitStatus
}

export function useVendorFeatureAccess({
  requiredTier,
  featureKey,
}: UseVendorFeatureAccessOptions): UseVendorFeatureAccessResult {
  const { data: subscription, isLoading: subscriptionLoading } = useVendorSubscription()
  const { data: usage, isLoading: usageLoading } = useVendorUsage()

  const currentTier = getVendorTier(subscription)
  const isLoading = subscriptionLoading || usageLoading

  if (isLoading) {
    return {
      hasAccess: true, // Optimistic while loading
      isLoading: true,
      currentTier,
      denialReason: null,
    }
  }

  let hasAccess = true
  let denialReason: 'tier' | 'feature' | 'usage_limit' | null = null
  let requiredTierResult: PlanTier | undefined
  let featureUsage: FeatureLimitStatus | undefined

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
    featureUsage = usage?.find(f => f.featureKey === featureKey)
    const featureEnabled = checkFeatureEnabled(usage, featureKey)
    if (!featureEnabled) {
      hasAccess = false
      denialReason = 'feature'
      requiredTierResult = getRequiredTierForFeature(featureKey)
    }
  }

  return {
    hasAccess,
    isLoading: false,
    currentTier,
    requiredTier: requiredTierResult,
    denialReason,
    usage: featureUsage,
  }
}

// ============================================================================
// Hook for checking vendor usage limits
// ============================================================================

interface UseVendorUsageOptions {
  featureKey: string
}

interface UseVendorUsageResult {
  hasRemaining: boolean
  isLoading: boolean
  used: number
  limit: number
  remaining: number
  isUnlimited: boolean
  percentage: number
}

export function useVendorUsageLimit({
  featureKey,
}: UseVendorUsageOptions): UseVendorUsageResult {
  const { data: usage, isLoading } = useVendorUsage()

  const defaultResult: UseVendorUsageResult = {
    hasRemaining: true,
    isLoading,
    used: 0,
    limit: 0,
    remaining: 0,
    isUnlimited: false,
    percentage: 0,
  }

  if (isLoading || !usage) {
    return defaultResult
  }

  const feature = usage.find(f => f.featureKey === featureKey)
  if (!feature) {
    return defaultResult
  }

  const hasRemaining = feature.isUnlimited || feature.remaining > 0
  const percentage = feature.isUnlimited
    ? 0
    : feature.limit > 0
      ? Math.min((feature.used / feature.limit) * 100, 100)
      : 0

  return {
    hasRemaining,
    isLoading: false,
    used: feature.used,
    limit: feature.limit,
    remaining: feature.remaining,
    isUnlimited: feature.isUnlimited,
    percentage,
  }
}
