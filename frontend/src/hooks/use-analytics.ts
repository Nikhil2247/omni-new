/**
 * Analytics Hook
 * Easy-to-use hook for tracking events
 */

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import * as gtag from '@/lib/analytics/gtag';

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      gtag.pageview(url);
    }
  }, [pathname, searchParams]);

  return {
    trackEvent: gtag.event,
    trackSearch: gtag.trackSearch,
    trackVendorView: gtag.trackVendorView,
    trackQuoteRequest: gtag.trackQuoteRequest,
    trackExternalLink: gtag.trackExternalLink,
  };
}
