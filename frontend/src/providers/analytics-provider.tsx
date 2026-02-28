/**
 * Analytics Provider
 *
 * Loads Umami analytics (self-hosted) + Google Analytics / Ads.
 *
 * Umami env vars (add to .env.local):
 *   NEXT_PUBLIC_UMAMI_SCRIPT_URL  – e.g. http://your-server:3000/script.js
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID  – Website ID from your Umami dashboard
 *
 * Umami tracks sessions, pageviews, retention and custom events automatically.
 * Custom event tracking is done via the helpers in @/lib/analytics/umami.
 *
 * Umami attributes used for advanced self-hosted configuration:
 *   data-auto-track="true"        – auto track pageviews (default)
 *   data-do-not-track="false"     – respect DNT header if needed
 *   data-cache="true"             – cache script in service worker
 *   data-domains                  – restrict tracking to specific domains
 */

'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID } from '@/lib/analytics/gtag';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-4219034590653073';

// ─── Umami configuration ──────────────────────────────────────────────────────
// Self-hosted Umami: set NEXT_PUBLIC_UMAMI_SCRIPT_URL to your server's script.js
// e.g.  http://192.168.1.100:3000/script.js
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '';
const UMAMI_SCRIPT_URL =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? 'http://localhost:3000/script.js';

// Umami tracks in both dev and production (configured via NEXT_PUBLIC_UMAMI_WEBSITE_ID)
const umamiEnabled = Boolean(UMAMI_WEBSITE_ID);

// Google Analytics: production only unless explicitly overridden
const gaEnabled =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

export function AnalyticsProvider() {
  return (
    <>
      {/* ── Umami (self-hosted, privacy-first) ─────────────────────────────── */}
      {umamiEnabled && (
        <Script
          id="umami-analytics"
          strategy="afterInteractive"
          src={UMAMI_SCRIPT_URL}
          // Core attributes
          data-website-id={UMAMI_WEBSITE_ID}
          // Auto-track all pageviews (SPA-aware via history API patching)
          data-auto-track="true"
          // Cache the script in a service worker for performance
          data-cache="true"
          // Set to "true" to honour the browser's Do Not Track header
          data-do-not-track="false"
        />
      )}

      {/* ── Google Analytics ─────────────────────────────────────────────────── */}
      {gaEnabled && (
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
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  send_page_view: true,
                  anonymize_ip: true,
                });
                gtag('config', '${GOOGLE_ADS_ID}');
              `,
            }}
          />
          <Script
            id="google-adsense"
            strategy="afterInteractive"
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          />
        </>
      )}
    </>
  );
}
