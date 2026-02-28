/**
 * useAnalytics – Unified analytics hook
 *
 * Wraps both Google Analytics (gtag) and Umami so components can call
 * a single hook and have events fan out to both providers.
 *
 * For granular Umami-only features (scroll-depth, time-on-page, session
 * identification, typed domain helpers) use the `useUmami` hook directly.
 */

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import * as gtag from '@/lib/analytics/gtag';
import {
  trackEvent as umamiTrack,
  trackPageView as umamiPageView,
  identifyUser,
  trackVendor,
  trackSearch as umamiSearch,
  trackQuote,
  trackUI,
  type UmamiPayload,
} from '@/lib/analytics/umami';

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Track SPA page views ───────────────────────────────────────────────────
  useEffect(() => {
    if (!pathname) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    // Google Analytics pageview
    gtag.pageview(url);
    // Umami handles SPA pageviews automatically via its history API patch.
    // Call manually only if auto-tracking is disabled for a route.
  }, [pathname, searchParams]);

  // ── Generic event tracker (fans out to both GA + Umami) ───────────────────
  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, unknown>, umamiPayload?: UmamiPayload) => {
      // GA
      gtag.event({ action: eventName, ...(params ?? {}) } as Parameters<typeof gtag.event>[0]);
      // Umami
      umamiTrack(eventName, umamiPayload ?? (params as UmamiPayload | undefined));
    },
    [],
  );

  // ── Search ─────────────────────────────────────────────────────────────────
  const trackSearchEvent = useCallback((query: string, category?: string) => {
    gtag.trackSearch(query);
    umamiSearch.perform(query, category);
  }, []);

  // ── Vendor view ────────────────────────────────────────────────────────────
  const trackVendorView = useCallback(
    (vendorId: string, vendorName?: string, category?: string) => {
      gtag.trackVendorView(vendorId);
      trackVendor.view(vendorId, vendorName, category);
    },
    [],
  );

  // ── Quote / lead ───────────────────────────────────────────────────────────
  const trackQuoteRequest = useCallback(
    (vendorId: string, eventType?: string) => {
      gtag.trackQuoteRequest(vendorId);
      trackQuote.submit(vendorId, eventType);
    },
    [],
  );

  // ── External links ─────────────────────────────────────────────────────────
  const trackExternalLink = useCallback((url: string, label?: string) => {
    gtag.trackExternalLink(url);
    trackUI.externalLink(url, label);
  }, []);

  // ── Button click ───────────────────────────────────────────────────────────
  const trackButtonClick = useCallback(
    (buttonId: string, label?: string, section?: string) => {
      umamiTrack('ui:button_click', { button_id: buttonId, label, section });
    },
    [],
  );

  // ── User identification ────────────────────────────────────────────────────
  const identify = useCallback((data: UmamiPayload) => {
    identifyUser(data);
  }, []);

  return {
    /** Fire a named event on both GA and Umami */
    trackEvent,
    /** Track a search query */
    trackSearch: trackSearchEvent,
    /** Track a vendor profile view */
    trackVendorView,
    /** Track a quote/lead form submission */
    trackQuoteRequest,
    /** Track an external link click */
    trackExternalLink,
    /** Track a UI button click (Umami only) */
    trackButtonClick,
    /** Enrich the Umami session with user data */
    identify,
    // ── Raw GA ──────────────────────────────────────────────────────────────
    /** Direct access to Google Analytics event helper */
    ga: gtag.event,
    /** Direct access to raw Umami event tracker */
    umami: umamiTrack,
  };
}

