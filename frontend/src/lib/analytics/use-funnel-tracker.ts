/**
 * React hook for funnel tracking
 *
 * Provides easy integration with React components
 */

'use client';

import { useEffect, useRef } from 'react';
import { getFunnelTracker, cleanupFunnelTracker } from './funnel-tracker';

/**
 * Hook to get the global funnel tracker instance
 */
export function useFunnelTracker() {
  const tracker = getFunnelTracker();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFunnelTracker();
    };
  }, []);

  return tracker;
}

/**
 * Hook to automatically track a funnel step on component mount
 */
export function useTrackFunnelStep(
  funnelName: string,
  stepName: string,
  metadata?: Record<string, any>,
  options?: {
    disabled?: boolean; // Disable tracking
    trackOnMount?: boolean; // Track immediately on mount (default: true)
  },
) {
  const tracker = useFunnelTracker();
  const hasTracked = useRef(false);
  const trackOnMount = options?.trackOnMount ?? true;

  useEffect(() => {
    if (options?.disabled || !trackOnMount || hasTracked.current) {
      return;
    }

    tracker.track(funnelName, stepName, metadata);
    hasTracked.current = true;
  }, [funnelName, stepName, metadata, options?.disabled, trackOnMount, tracker]);

  return tracker;
}

/**
 * Hook to track vendor discovery funnel
 */
export function useVendorDiscoveryFunnel() {
  const tracker = useFunnelTracker();
  return tracker.vendorDiscovery;
}

/**
 * Hook to track user signup funnel
 */
export function useUserSignupFunnel() {
  const tracker = useFunnelTracker();
  return tracker.userSignup;
}

/**
 * Hook to track vendor onboarding funnel
 */
export function useVendorOnboardingFunnel() {
  const tracker = useFunnelTracker();
  return tracker.vendorOnboarding;
}

/**
 * Hook to track event planning funnel
 */
export function useEventPlanningFunnel() {
  const tracker = useFunnelTracker();
  return tracker.eventPlanning;
}
