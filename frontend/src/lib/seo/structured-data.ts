/**
 * Structured Data (JSON-LD) Generators
 * Functions to create schema.org structured data
 */

import type {
  OrganizationSchema,
  WebsiteSchema,
  BreadcrumbSchema,
  LocalBusinessSchema,
  EventSchema,
  ProductSchema,
  FAQSchema,
  ArticleSchema,
} from './types';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com';

/**
 * Organization Schema
 */
export function createOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Omnicassion',
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512x512.png`,
    description: 'India\'s Premier Event Planning Platform - Connecting event planners with verified vendors',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-XXX-XXXXXXX',
        contactType: 'Customer Service',
        availableLanguage: ['English', 'Hindi'],
      },
    ],
    sameAs: [
      'https://www.facebook.com/omnicassion',
      'https://twitter.com/omnicassion',
      'https://www.instagram.com/omnicassion',
      'https://www.linkedin.com/company/omnicassion',
    ],
    foundingDate: '2024',
  };
}

/**
 * Website Schema with Search Action
 */
export function createWebsiteSchema(): WebsiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Omnicassion',
    url: SITE_URL,
    description: 'India\'s Premier Event Planning Platform',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/vendors?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Breadcrumb Schema
 */
export function createBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}

/**
 * Local Business Schema (for vendors)
 */
export function createLocalBusinessSchema(vendor: {
  name: string;
  description?: string;
  image?: string[];
  telephone?: string;
  priceRange?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  rating?: {
    value: number;
    count: number;
  };
  url?: string;
}): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: vendor.name,
    image: vendor.image,
    '@id': vendor.url ? `${SITE_URL}${vendor.url}` : undefined,
    url: vendor.url ? `${SITE_URL}${vendor.url}` : undefined,
    telephone: vendor.telephone,
    priceRange: vendor.priceRange || '$$',
    address: vendor.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: vendor.address.street,
          addressLocality: vendor.address.city,
          addressRegion: vendor.address.state,
          postalCode: vendor.address.postalCode,
          addressCountry: vendor.address.country || 'IN',
        }
      : undefined,
    aggregateRating: vendor.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: vendor.rating.value,
          reviewCount: vendor.rating.count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };
}

/**
 * Event Schema
 */
export function createEventSchema(event: {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  image?: string[];
  offers?: Array<{
    price: string;
    currency: string;
    availability?: string;
  }>;
}): EventSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location.address.street,
        addressLocality: event.location.address.city,
        addressRegion: event.location.address.state,
        postalCode: event.location.address.postalCode,
        addressCountry: event.location.address.country || 'IN',
      },
    },
    image: event.image,
    offers: event.offers?.map((offer) => ({
      '@type': 'Offer',
      price: offer.price,
      priceCurrency: offer.currency,
      availability: offer.availability || 'https://schema.org/InStock',
    })),
    organizer: {
      '@type': 'Organization',
      name: 'Omnicassion',
      url: SITE_URL,
    },
  };
}

/**
 * Product Schema (for vendor services)
 */
export function createProductSchema(product: {
  name: string;
  description?: string;
  image?: string[];
  sku?: string;
  brand?: string;
  offers?: {
    price: string;
    currency: string;
    availability?: string;
  };
  rating?: {
    value: number;
    count: number;
  };
}): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: product.brand
      ? {
          '@type': 'Organization',
          name: product.brand,
        }
      : undefined,
    offers: product.offers
      ? {
          '@type': 'Offer',
          price: product.offers.price,
          priceCurrency: product.offers.currency,
          availability: product.offers.availability || 'https://schema.org/InStock',
        }
      : undefined,
    aggregateRating: product.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating.value,
          reviewCount: product.rating.count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };
}

/**
 * FAQ Schema
 */
export function createFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Article Schema (for blog posts)
 */
export function createArticleSchema(article: {
  headline: string;
  description: string;
  image?: string[];
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
  };
}): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Omnicassion',
      url: SITE_URL,
    },
  };
}
