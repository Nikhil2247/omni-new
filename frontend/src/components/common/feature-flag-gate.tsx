'use client'

import { ReactNode } from 'react'
import { useFeature, useFeatureAll, useFeatureAny } from '@/hooks/use-feature'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface FeatureFlagGateProps {
  /**
   * Single feature flag key to check
   */
  feature?: string
  /**
   * Multiple feature flag keys to check
   */
  features?: string[]
  /**
   * When true, requires ALL features to be enabled (default: false)
   * When false, requires ANY feature to be enabled
   */
  requireAll?: boolean
  /**
   * Content to render when feature(s) are enabled
   */
  children: ReactNode
  /**
   * Optional content to render when feature(s) are disabled
   */
  fallback?: ReactNode
}

interface FeatureEnabledProps {
  /**
   * Feature flag key to check
   */
  feature: string
  /**
   * Content to render when feature is enabled
   */
  children: ReactNode
}

interface FeatureComingSoonProps {
  /**
   * Feature flag key to check
   */
  feature: string
  /**
   * Content to wrap with coming soon badge when feature is disabled
   */
  children: ReactNode
  /**
   * Custom label for the coming soon badge
   * @default "Coming Soon"
   */
  badgeLabel?: string
  /**
   * Additional class name for the wrapper
   */
  className?: string
}

// ============================================================================
// Main Feature Flag Gate Component
// ============================================================================

/**
 * Conditionally renders children based on feature flag status.
 *
 * @example
 * // Single feature check
 * <FeatureFlagGate feature="new-dashboard">
 *   <NewDashboard />
 * </FeatureFlagGate>
 *
 * @example
 * // Multiple features - ANY must be enabled
 * <FeatureFlagGate features={['feature-a', 'feature-b']}>
 *   <MyComponent />
 * </FeatureFlagGate>
 *
 * @example
 * // Multiple features - ALL must be enabled
 * <FeatureFlagGate features={['feature-a', 'feature-b']} requireAll>
 *   <MyComponent />
 * </FeatureFlagGate>
 *
 * @example
 * // With fallback
 * <FeatureFlagGate feature="premium-feature" fallback={<BasicFeature />}>
 *   <PremiumFeature />
 * </FeatureFlagGate>
 */
export function FeatureFlagGate({
  feature,
  features,
  requireAll = false,
  children,
  fallback = null,
}: FeatureFlagGateProps) {
  // Determine which features to check
  const featureList = features ?? (feature ? [feature] : [])

  // Use the appropriate hook based on requireAll
  const { isEnabled: allEnabled, isLoading: loadingAll } = useFeatureAll(
    requireAll ? featureList : []
  )
  const { isEnabled: anyEnabled, isLoading: loadingAny } = useFeatureAny(
    !requireAll ? featureList : []
  )

  const isLoading = requireAll ? loadingAll : loadingAny
  const isEnabled = requireAll ? allEnabled : anyEnabled

  // While loading, render nothing to avoid flash of content
  // This behavior can be customized by passing a loading fallback
  if (isLoading) {
    return null
  }

  // Feature check passed - render children
  if (isEnabled) {
    return <>{children}</>
  }

  // Feature check failed - render fallback
  return <>{fallback}</>
}

// ============================================================================
// Simple Feature Enabled Wrapper
// ============================================================================

/**
 * Simple wrapper that only renders children when the feature is enabled.
 * Use this for straightforward conditional rendering without fallback.
 *
 * @example
 * <FeatureEnabled feature="dark-mode-toggle">
 *   <DarkModeSwitch />
 * </FeatureEnabled>
 */
export function FeatureEnabled({ feature, children }: FeatureEnabledProps) {
  const { isEnabled, isLoading } = useFeature(feature)

  if (isLoading || !isEnabled) {
    return null
  }

  return <>{children}</>
}

// ============================================================================
// Coming Soon Variant
// ============================================================================

/**
 * Renders children with a "Coming Soon" badge overlay when the feature is disabled.
 * When enabled, renders children normally without the badge.
 *
 * @example
 * <FeatureComingSoon feature="ai-assistant">
 *   <Button disabled>AI Assistant</Button>
 * </FeatureComingSoon>
 *
 * @example
 * // Custom badge label
 * <FeatureComingSoon feature="beta-feature" badgeLabel="Beta">
 *   <MyComponent />
 * </FeatureComingSoon>
 */
export function FeatureComingSoon({
  feature,
  children,
  badgeLabel = 'Coming Soon',
  className,
}: FeatureComingSoonProps) {
  const { isEnabled, isLoading } = useFeature(feature)

  // While loading, show the disabled state to avoid flash
  if (isLoading) {
    return (
      <div className={cn('relative inline-flex', className)}>
        <div className="opacity-50 pointer-events-none">{children}</div>
        <Badge
          variant="secondary"
          className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5"
        >
          {badgeLabel}
        </Badge>
      </div>
    )
  }

  // Feature enabled - render children normally
  if (isEnabled) {
    return <>{children}</>
  }

  // Feature disabled - render with coming soon overlay
  return (
    <div className={cn('relative inline-flex', className)}>
      <div className="opacity-50 pointer-events-none">{children}</div>
      <Badge
        variant="secondary"
        className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5"
      >
        {badgeLabel}
      </Badge>
    </div>
  )
}
