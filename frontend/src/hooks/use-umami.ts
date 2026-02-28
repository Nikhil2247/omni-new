/**
 * useUmami – Comprehensive Umami analytics hook
 *
 * Exposes every tracking helper in one convenient object.
 * Also wires up automatic:
 *  • Scroll-depth milestones (25 / 50 / 75 / 100 %)
 *  • Time-on-page (fires on unmount)
 *  • Manual SPA page-view tracking
 *
 * Usage:
 *   const { track, vendor, auth, form, identify, ... } = useUmami();
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  trackEvent,
  trackPageView,
  identifyUser,
  installScrollDepthTracker,
  installTimeOnPageTracker,
  trackAuth,
  trackOnboarding,
  trackVendor,
  trackQuote,
  trackInquiry,
  trackEventPlanning,
  trackWishlist,
  trackSearch,
  trackMessages,
  trackContent,
  trackBudget,
  trackChecklist,
  trackGuestList,
  trackTimeline,
  trackPricing,
  trackForm,
  trackUI,
  trackError,
  trackDashboard,
  trackFunnelStep,
  isUmamiReady,
  type UmamiPayload,
} from '@/lib/analytics/umami';

// ─── Options ──────────────────────────────────────────────────────────────────

interface UseUmamiOptions {
  /** Auto-install scroll depth tracker on mount (default: false) */
  trackScrollDepth?: boolean;
  /** Auto-install time-on-page tracker on mount (default: false) */
  trackTimeOnPage?: boolean;
  /**
   * Page/component name used for time-on-page event.
   * Defaults to current pathname.
   */
  pageName?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUmami(options: UseUmamiOptions = {}) {
  const pathname = usePathname();
  const { trackScrollDepth = false, trackTimeOnPage = false, pageName } = options;

  // ── Scroll depth ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!trackScrollDepth) return;
    const cleanup = installScrollDepthTracker(pathname ?? undefined);
    return cleanup;
  }, [trackScrollDepth, pathname]);

  // ── Time on page ────────────────────────────────────────────────────────────
  const timeCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!trackTimeOnPage) return;
    timeCleanupRef.current = installTimeOnPageTracker(pageName ?? pathname ?? undefined);
    return () => {
      timeCleanupRef.current?.();
      timeCleanupRef.current = null;
    };
  }, [trackTimeOnPage, pageName, pathname]);

  // ── Manual page view ────────────────────────────────────────────────────────
  const pageView = useCallback(
    (url?: string, referrer?: string, title?: string) =>
      trackPageView(url, referrer, title),
    [],
  );

  return {
    /** Check if Umami script has loaded */
    isReady: isUmamiReady,

    // ── Core primitives ───────────────────────────────────────────────────────
    /** Track any custom event by name */
    track: trackEvent,
    /** Manually trigger a page view (useful for modals / virtual pages) */
    pageView,
    /** Enrich the visitor's session with key/value data (user role, plan, etc.) */
    identify: identifyUser,
    /** Track a funnel step: funnel:name:step_name */
    funnelStep: trackFunnelStep,

    // ── Domain-specific helpers ───────────────────────────────────────────────
    auth:          trackAuth,
    onboarding:    trackOnboarding,
    vendor:        trackVendor,
    quote:         trackQuote,
    inquiry:       trackInquiry,
    eventPlanning: trackEventPlanning,
    wishlist:      trackWishlist,
    search:        trackSearch,
    messages:      trackMessages,
    content:       trackContent,
    budget:        trackBudget,
    checklist:     trackChecklist,
    guestList:     trackGuestList,
    timeline:      trackTimeline,
    pricing:       trackPricing,
    form:          trackForm,
    ui:            trackUI,
    error:         trackError,
    dashboard:     trackDashboard,
  };
}

// ─── Focused convenience hooks ────────────────────────────────────────────────

/**
 * Automatically tracks scroll depth and time-on-page for the calling component.
 * Zero config — just mount it on a page.
 */
export function usePageEngagement(pageName?: string) {
  const pathname = usePathname();

  useEffect(() => {
    const cleanupScroll = installScrollDepthTracker(pathname ?? undefined);
    const cleanupTime = installTimeOnPageTracker(pageName ?? pathname ?? undefined);
    return () => {
      cleanupScroll();
      cleanupTime();
    };
  }, [pathname, pageName]);
}

/**
 * Track a single event once on component mount.
 * Useful for impression / view events.
 */
export function useTrackOnMount(
  eventName: string,
  payload?: UmamiPayload,
  options?: { disabled?: boolean },
) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (options?.disabled || hasTracked.current) return;
    trackEvent(eventName, payload);
    hasTracked.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Identify the current user in the Umami session.
 * Call this once after login / on auth state change.
 */
export function useUmamiIdentify(sessionData: UmamiPayload | null) {
  useEffect(() => {
    if (!sessionData) return;
    identifyUser(sessionData);
  }, [sessionData]);
}
