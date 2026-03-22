import { useMemo } from 'react'
import { useEnabledFeatures } from '@/hooks/use-feature'
import { NavItem, NavGroup } from '@/config/navigation'

/**
 * Hook to filter navigation items based on enabled feature flags.
 * Items with a `feature` property will only be shown if that feature is enabled.
 * Items without a `feature` property are always shown.
 *
 * Uses React Query for feature flags to ensure consistent state with FeatureFlagGate.
 */
export function useFilteredNavigation(items: NavItem[]): NavItem[] {
  const { data } = useEnabledFeatures()
  const enabledFeatures = data?.features ?? []

  return useMemo(() => {
    const isEnabled = (feature: string) => enabledFeatures.includes(feature)

    return items
      .filter((item) => {
        // If no feature required, show item
        if (!item.feature) return true
        // Check if feature is enabled
        return isEnabled(item.feature)
      })
      .map((item) => ({
        ...item,
        // Recursively filter children if any
        children: item.children
          ? item.children.filter(
              (child) => !child.feature || isEnabled(child.feature)
            )
          : undefined,
      }))
  }, [items, enabledFeatures])
}

/**
 * Hook to filter navigation groups based on enabled feature flags.
 * Filters both the items within each group and removes empty groups.
 *
 * Uses React Query for feature flags to ensure consistent state with FeatureFlagGate.
 */
export function useFilteredNavigationGroups(groups: NavGroup[]): NavGroup[] {
  const { data } = useEnabledFeatures()
  const enabledFeatures = data?.features ?? []

  return useMemo(() => {
    const isEnabled = (feature: string) => enabledFeatures.includes(feature)

    return groups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => {
            // If no feature required, show item
            if (!item.feature) return true
            // Check if feature is enabled
            return isEnabled(item.feature)
          })
          .map((item) => ({
            ...item,
            // Recursively filter children if any
            children: item.children
              ? item.children.filter(
                  (child) => !child.feature || isEnabled(child.feature)
                )
              : undefined,
          })),
      }))
      .filter((group) => group.items.length > 0) // Remove empty groups
  }, [groups, enabledFeatures])
}
