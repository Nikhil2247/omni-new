/**
 * Google Analytics Integration
 * Track page views and events for SEO insights
 */

// Google Analytics 4 Integration
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-66Y82VSR50';
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-16748718555';

const hasWindow = () => typeof window !== 'undefined';
const hasGtag = () => hasWindow() && typeof window.gtag === 'function';

// Track page views
export function pageview(url: string) {
  if (hasGtag()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });

    window.gtag('config', GOOGLE_ADS_ID, {
      page_path: url,
    });
  }
}

// Track custom events
export function event({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) {
  if (hasGtag()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Optional Ads conversion helper
export function conversion(conversionLabel: string, value?: number, currency = 'INR') {
  if (hasGtag()) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${conversionLabel}`,
      value,
      currency,
    });
  }
}

// Track search queries (important for SEO)
export function trackSearch(searchTerm: string, category?: string) {
  event({
    action: 'search',
    category: 'Search',
    label: `${category ? `${category}: ` : ''}${searchTerm}`,
  });
}

// Track vendor views
export function trackVendorView(vendorId: string, vendorName: string) {
  event({
    action: 'view_vendor',
    category: 'Vendor',
    label: `${vendorId}: ${vendorName}`,
  });
}

// Track quote requests
export function trackQuoteRequest(vendorId: string, category: string) {
  event({
    action: 'quote_request',
    category: 'Conversion',
    label: `${category}: ${vendorId}`,
  });
}

// Track external link clicks
export function trackExternalLink(url: string) {
  event({
    action: 'click_external_link',
    category: 'Engagement',
    label: url,
  });
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: unknown[];
  }
}
