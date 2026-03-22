import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { featuresService } from '@/lib/api/services/features.service'

// ============================================================================
// Query Keys
// ============================================================================

export const featureKeys = {
  enabled: () => ['features-enabled'] as const,
  all: () => ['features-all'] as const,
}

// ============================================================================
// Base Hooks for Feature Flags
// ============================================================================

/**
 * Fetch all enabled feature flags
 */
export function useEnabledFeatures() {
  return useQuery({
    queryKey: featureKeys.enabled(),
    queryFn: () => featuresService.getEnabledFeatures(),
    staleTime: 10_000, // Cache for 10 seconds for quick flag updates
    gcTime: 30_000, // Keep in cache for 30 seconds
    refetchInterval: 30_000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when tab becomes active
    refetchOnMount: true, // Always refetch on mount
  })
}

/**
 * Fetch all feature flags with details
 */
export function useAllFeatures() {
  return useQuery({
    queryKey: featureKeys.all(),
    queryFn: () => featuresService.getAllFeatures(),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}

// ============================================================================
// Convenience Hooks for Feature Checking
// ============================================================================

/**
 * Check if a single feature flag is enabled
 * @param feature - The feature flag key to check
 * @returns Object containing enabled status and loading state
 */
export function useFeature(feature: string): {
  isEnabled: boolean
  isLoading: boolean
  error: Error | null
} {
  const { data, isLoading, error } = useEnabledFeatures()

  const isEnabled = useMemo(() => {
    if (!data?.features) return false
    return data.features.includes(feature)
  }, [data?.features, feature])

  return {
    isEnabled,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * Check if ALL specified features are enabled
 * @param features - Array of feature flag keys to check
 * @returns Object containing enabled status (true only if ALL are enabled) and loading state
 */
export function useFeatureAll(features: string[]): {
  isEnabled: boolean
  isLoading: boolean
  error: Error | null
  enabledFeatures: string[]
  disabledFeatures: string[]
} {
  const { data, isLoading, error } = useEnabledFeatures()

  const result = useMemo(() => {
    if (!data?.features) {
      return {
        isEnabled: false,
        enabledFeatures: [] as string[],
        disabledFeatures: features,
      }
    }

    const enabledSet = new Set(data.features)
    const enabledFeatures = features.filter((f) => enabledSet.has(f))
    const disabledFeatures = features.filter((f) => !enabledSet.has(f))
    const isEnabled = disabledFeatures.length === 0

    return {
      isEnabled,
      enabledFeatures,
      disabledFeatures,
    }
  }, [data?.features, features])

  return {
    ...result,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * Check if ANY of the specified features are enabled
 * @param features - Array of feature flag keys to check
 * @returns Object containing enabled status (true if ANY are enabled) and loading state
 */
export function useFeatureAny(features: string[]): {
  isEnabled: boolean
  isLoading: boolean
  error: Error | null
  enabledFeatures: string[]
} {
  const { data, isLoading, error } = useEnabledFeatures()

  const result = useMemo(() => {
    if (!data?.features) {
      return {
        isEnabled: false,
        enabledFeatures: [] as string[],
      }
    }

    const enabledSet = new Set(data.features)
    const enabledFeatures = features.filter((f) => enabledSet.has(f))
    const isEnabled = enabledFeatures.length > 0

    return {
      isEnabled,
      enabledFeatures,
    }
  }, [data?.features, features])

  return {
    ...result,
    isLoading,
    error: error as Error | null,
  }
}

// ============================================================================
// Utility Hook for Multiple Feature Checks
// ============================================================================

/**
 * Get a map of feature flags and their enabled status
 * @param features - Array of feature flag keys to check
 * @returns Object with feature key -> enabled status mapping
 */
export function useFeatureMap(features: string[]): {
  featureMap: Record<string, boolean>
  isLoading: boolean
  error: Error | null
} {
  const { data, isLoading, error } = useEnabledFeatures()

  const featureMap = useMemo(() => {
    if (!data?.features) {
      return features.reduce(
        (acc, f) => {
          acc[f] = false
          return acc
        },
        {} as Record<string, boolean>
      )
    }

    const enabledSet = new Set(data.features)
    return features.reduce(
      (acc, f) => {
        acc[f] = enabledSet.has(f)
        return acc
      },
      {} as Record<string, boolean>
    )
  }, [data?.features, features])

  return {
    featureMap,
    isLoading,
    error: error as Error | null,
  }
}

// ============================================================================
// Cache Invalidation Hook
// ============================================================================

/**
 * Hook to manually invalidate and refetch feature flags.
 * Useful after admin updates feature flags to immediately reflect changes.
 *
 * @example
 * const { invalidateFeatures } = useInvalidateFeatures()
 * await updateFeatureFlag(id, { enabled: false })
 * await invalidateFeatures() // Force refetch
 */
export function useInvalidateFeatures() {
  const queryClient = useQueryClient()

  const invalidateFeatures = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: featureKeys.enabled() })
    await queryClient.invalidateQueries({ queryKey: featureKeys.all() })
  }, [queryClient])

  return { invalidateFeatures }
}
