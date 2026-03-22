'use client'

/**
 * FeatureProvider - A passthrough component for feature flag context.
 *
 * Feature flags are now managed entirely by React Query hooks (useEnabledFeatures).
 * This provider is kept for backward compatibility but doesn't perform any data fetching.
 *
 * The React Query hooks automatically:
 * - Fetch feature flags on first use
 * - Cache responses with 30-second stale time
 * - Refetch every 60 seconds
 * - Refetch on window focus
 *
 * @see useEnabledFeatures in @/hooks/use-feature.ts
 * @see FeatureFlagGate in @/components/common/feature-flag-gate.tsx
 */
export function FeatureProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
