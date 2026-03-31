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
    description: 'India\'s premier all-in-one planning and social platform for weddings, celebrations, and events.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-1234567890',
        contactType: 'Customer Service',
        email: 'support@omnicassion.com',
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
    description: 'India\'s premier all-in-one planning and social platform for weddings, celebrations, and events.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
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

/**
 * Review Schema (for individual reviews)
 */
export function createReviewSchema(review: {
  author: string;
  reviewBody: string;
  ratingValue: number;
  datePublished: string;
  itemReviewed: {
    name: string;
    type: string;
    url?: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewBody: review.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.ratingValue,
      bestRating: 5,
      worstRating: 1,
    },
    datePublished: review.datePublished,
    itemReviewed: {
      '@type': review.itemReviewed.type,
      name: review.itemReviewed.name,
      url: review.itemReviewed.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Omnicassion',
      url: SITE_URL,
    },
  };
}

/**
 * Video Object Schema (for video content)
 */
export function createVideoSchema(video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string; // ISO 8601 duration format
  contentUrl?: string;
  embedUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.contentUrl,
    embedUrl: video.embedUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Omnicassion',
      url: SITE_URL,
    },
  };
}

/**
 * ItemList Schema (for vendor listings, search results)
 */
export function createItemListSchema(items: Array<{
  name: string;
  url: string;
  image?: string;
  position: number;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      image: item.image,
    })),
  };
}

/**
 * Service Schema (for vendor services)
 */
export function createServiceSchema(service: {
  name: string;
  description: string;
  provider: {
    name: string;
    url?: string;
  };
  areaServed?: string | string[];
  serviceType: string;
  offers?: {
    price?: number;
    priceCurrency?: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      name: service.provider.name,
      url: service.provider.url,
    },
    areaServed: Array.isArray(service.areaServed)
      ? service.areaServed.map((area) => ({
          '@type': 'City',
          name: area,
        }))
      : service.areaServed
        ? { '@type': 'City', name: service.areaServed }
        : { '@type': 'Country', name: 'India' },
    serviceType: service.serviceType,
    offers: service.offers
      ? {
          '@type': 'Offer',
          price: service.offers.price,
          priceCurrency: service.offers.priceCurrency || 'INR',
        }
      : undefined,
  };
}

/**
 * GeoCircle Schema for Local SEO
 */
export function createGeoTargetingSchema(city: string, state?: string) {
  const geoCoordinates: Record<string, { lat: number; lng: number }> = {
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Goa': { lat: 15.2993, lng: 74.1240 },
    'Udaipur': { lat: 24.5854, lng: 73.7125 },
    'Chandigarh': { lat: 30.7333, lng: 76.7794 },
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Gurgaon': { lat: 28.4595, lng: 77.0266 },
  };

  const coords = geoCoordinates[city];

  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: city,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state || city,
      addressCountry: 'IN',
    },
    ...(coords && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: coords.lat,
        longitude: coords.lng,
      },
    }),
  };
}

/**
 * HowTo Schema (for guides and tutorials)
 */
export function createHowToSchema(howTo: {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration
  estimatedCost?: {
    value: string;
    currency: string;
  };
  steps: Array<{
    name: string;
    text: string;
    image?: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    estimatedCost: howTo.estimatedCost
      ? {
          '@type': 'MonetaryAmount',
          value: howTo.estimatedCost.value,
          currency: howTo.estimatedCost.currency,
        }
      : undefined,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}
