/**
 * SEO Metadata Utilities
 * Helper functions for generating Next.js metadata objects
 */

import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import type { SEOMetadata, JsonLdSchema } from './types';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com';

/**
 * Default SEO configuration
 */
export const defaultSEO: SEOMetadata = {
  title: 'Omnicassion - Wedding & Event Planning Platform in India',
  description: 'Plan weddings, celebrations, and events with Omnicassion. Discover vendors, compare services, get free quotes, and manage budgets, guest lists and timelines in one place.',
  keywords: [
    'all-in-one planning platform India',
    'social planning platform India',
    'event planning India',
    'wedding planning India',
    'vendor booking platform',
    'event management platform',
    'wedding vendors India',
    'party planning services',
    'corporate event planning',
    'event marketplace India',
    'guest list and budget planner',
    'event timeline planning tool',
  ],
  canonical: SITE_URL,
  robots: {
    index: true,
    follow: true,
    maxImagePreview: 'large',
    maxSnippet: -1,
    maxVideoPreview: -1,
  },
  openGraph: {
    title: 'Omnicassion - Wedding & Event Planning Platform in India',
    description: 'Discover verified professionals, manage event planning, and connect socially in one powerful platform built for India.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Omnicassion',
    locale: 'en_IN',
    images: [
      {
        url: `${SITE_URL}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Omnicassion - All-in-One Planning and Social Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@omnicassion',
    creator: '@omnicassion',
    title: 'Omnicassion - Wedding & Event Planning Platform in India',
    description: 'Plan smarter with verified professionals, social collaboration, and all event tools in one platform.',
    images: [`${SITE_URL}/images/twitter-image.png`],
  },
};

/**
 * Generate Next.js Metadata object from SEO configuration
 */
export function generateMetadata(seo: Partial<SEOMetadata>): Metadata {
  const merged = { ...defaultSEO, ...seo };
  const canonical = merged.canonical || SITE_URL;

  const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
      default: merged.title,
      template: `%s | ${siteConfig.name}`,
    },
    description: merged.description,
    keywords: merged.keywords,
    authors: [{ name: 'Omnicassion', url: SITE_URL }],
    creator: 'Omnicassion',
    publisher: 'Omnicassion',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical,
      languages: merged.alternates?.languages,
    },
    robots: {
      index: merged.robots?.index ?? true,
      follow: merged.robots?.follow ?? true,
      googleBot: {
        index: merged.robots?.index ?? true,
        follow: merged.robots?.follow ?? true,
        'max-video-preview': merged.robots?.maxVideoPreview ?? -1,
        'max-image-preview': merged.robots?.maxImagePreview ?? 'large',
        'max-snippet': merged.robots?.maxSnippet ?? -1,
      },
    },
    openGraph: merged.openGraph
      ? {
          type: merged.openGraph.type === 'product' ? 'website' : merged.openGraph.type,
          title: merged.openGraph.title,
          description: merged.openGraph.description,
          url: merged.openGraph.url,
          siteName: merged.openGraph.siteName,
          locale: merged.openGraph.locale || 'en_IN',
          images: merged.openGraph.images,
        }
      : undefined,
    twitter: merged.twitter
      ? {
          card: merged.twitter.card,
          site: merged.twitter.site,
          creator: merged.twitter.creator,
          title: merged.twitter.title,
          description: merged.twitter.description,
          images: merged.twitter.images,
        }
      : undefined,
    icons: {
      icon: [
        { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteConfig.name,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },
  };

  return metadata;
}

/**
 * Generate page-specific metadata
 */
export function pageMetadata(
  rawTitle: string,
  description: string,
  options?: {
    keywords?: string[];
    path?: string;
    image?: string;
    type?: 'website' | 'article' | 'profile' | 'product';
    noIndex?: boolean;
  }
): Metadata {
  // The root title template already appends " | Omnicassion"; many pages also wrote it themselves, which produced
  // "... | Omnicassion | Omnicassion" and wasted title space. Strip a trailing brand so it appears exactly once.
  const title = rawTitle.replace(/\s*[|–-]\s*Omnicassion\s*$/i, '').trim() || rawTitle;
  const canonical = options?.path ? `${SITE_URL}${options.path}` : SITE_URL;
  const ogImage = options?.image || `${SITE_URL}/images/og-image.png`;

  return generateMetadata({
    title,
    description,
    keywords: options?.keywords || defaultSEO.keywords,
    canonical,
    robots: {
      index: !options?.noIndex,
      follow: !options?.noIndex,
      maxImagePreview: 'large',
      maxSnippet: -1,
    },
    openGraph: {
      title,
      description,
      type: options?.type || 'website',
      url: canonical,
      siteName: siteConfig.name,
      locale: 'en_IN',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@omnicassion',
      creator: '@omnicassion',
      title,
      description,
      images: [ogImage],
    },
  });
}

/**
 * Generate JSON-LD structured data script
 */
export function generateJsonLd(schema: JsonLdSchema | JsonLdSchema[]): string {
  const schemas = Array.isArray(schema) ? schema : [schema];
  return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
}

/**
 * Helper to create canonical URL
 */
export function createCanonicalUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Helper to create OG image URL
 */
export function createOgImageUrl(path?: string): string {
  if (!path) return `${SITE_URL}/images/og-image.png`;
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
