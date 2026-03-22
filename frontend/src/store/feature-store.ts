import { create } from "zustand";

/**
 * @deprecated This store is no longer the primary source for feature flags.
 * Use useEnabledFeatures() from @/hooks/use-feature.ts instead.
 *
 * Feature flags are now managed by React Query which provides:
 * - Automatic caching and revalidation
 * - Consistent state across all components
 * - No localStorage persistence issues
 */
interface FeatureStore {
  features: string[];
  isLoaded: boolean;
  setFeatures: (features: string[]) => void;
  isEnabled: (key: string) => boolean;
  reset: () => void;
}

export const useFeatureStore = create<FeatureStore>()((set, get) => ({
  features: [],
  isLoaded: false,
  setFeatures: (features) => set({ features, isLoaded: true }),
  isEnabled: (key) => get().features.includes(key),
  reset: () => set({ features: [], isLoaded: false }),
}));
