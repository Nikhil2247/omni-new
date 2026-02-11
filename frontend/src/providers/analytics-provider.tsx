/**
 * Google Analytics Provider
 * Add to root layout to enable analytics
 */

'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/analytics/gtag';

export function AnalyticsProvider() {
  // Only load in production or if explicitly enabled
  const isEnabled = 
    process.env.NODE_ENV === 'production' || 
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

  if (!GA_MEASUREMENT_ID || !isEnabled) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              anonymize_ip: true,
            });
          `,
        }}
      />
    </>
  );
}
