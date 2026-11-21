import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com').replace(/\/$/, '');

  // One rule group for every crawler. A crawler that has its own named group (e.g. Googlebot) ignores the `*` group
  // entirely, so a separate Googlebot group used to leave /ops, /sales, /marketing and /system crawlable.
  // Tracking parameters (utm_*, gclid) are NOT blocked: pages declare a canonical URL, and blocking the crawl would
  // stop Google from seeing that canonical and consolidating those URLs.
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/settings/',
          '/events/*/edit',
          '/business/',
          '/ops/',
          '/sales/',
          '/marketing/',
          '/system/',
        ],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/image-sitemap.xml`],
  };
}
