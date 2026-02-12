/**
 * SEO Type Definitions
 * Comprehensive types for SEO metadata and structured data
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: RobotsConfig;
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  jsonLd?: JsonLdSchema[];
  alternates?: AlternateLanguages;
}

export interface RobotsConfig {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
}

export interface OpenGraphMetadata {
  title: string;
  description: string;
  type: 'website' | 'article' | 'profile' | 'product';
  url: string;
  images: OpenGraphImage[];
  siteName: string;
  locale?: string;
  alternateLocales?: string[];
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

export interface TwitterMetadata {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title: string;
  description: string;
  images?: string[];
}

export interface AlternateLanguages {
  canonical?: string;
  languages?: {
    [key: string]: string;
  };
}

// JSON-LD Schema Types
export type JsonLdSchema =
  | OrganizationSchema
  | WebsiteSchema
  | WebPageSchema
  | BreadcrumbSchema
  | LocalBusinessSchema
  | EventSchema
  | ProductSchema
  | ArticleSchema
  | FAQSchema
  | ReviewSchema
  | VideoObjectSchema;

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: PostalAddress;
  contactPoint?: ContactPoint[];
  sameAs?: string[];
  foundingDate?: string;
  email?: string;
  telephone?: string;
}

export interface WebsiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: SearchAction;
}

export interface SearchAction {
  '@type': 'SearchAction';
  target: string;
  'query-input': string;
}

export interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbList;
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbList {
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

export interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness';
  name: string;
  image?: string[];
  '@id'?: string;
  url?: string;
  telephone?: string;
  priceRange?: string;
  address?: PostalAddress;
  geo?: GeoCoordinates;
  openingHoursSpecification?: OpeningHours[];
  aggregateRating?: AggregateRating;
}

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface GeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

export interface OpeningHours {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string | string[];
  opens: string;
  closes: string;
}

export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone: string;
  contactType: string;
  email?: string;
  availableLanguage?: string[];
}

export interface EventSchema {
  '@context': 'https://schema.org';
  '@type': 'Event';
  name: string;
  startDate: string;
  endDate?: string;
  location: EventLocation;
  description?: string;
  image?: string[];
  offers?: Offer[];
  organizer?: Person | Organization;
  eventStatus?: string;
  eventAttendanceMode?: string;
}

export interface EventLocation {
  '@type': 'Place';
  name: string;
  address: PostalAddress;
}

export interface Person {
  '@type': 'Person';
  name: string;
  email?: string;
  telephone?: string;
}

export interface Organization {
  '@type': 'Organization';
  name: string;
  url?: string;
}

export interface Offer {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability?: string;
  url?: string;
  validFrom?: string;
}

export interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  image?: string[];
  description?: string;
  sku?: string;
  brand?: Organization;
  offers?: Offer;
  aggregateRating?: AggregateRating;
}

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  image?: string[];
  datePublished: string;
  dateModified?: string;
  author: Person | Organization;
  publisher: Organization;
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Question[];
}

export interface Question {
  '@type': 'Question';
  name: string;
  acceptedAnswer: Answer;
}

export interface Answer {
  '@type': 'Answer';
  text: string;
}

export interface ReviewSchema {
  '@context': 'https://schema.org';
  '@type': 'Review';
  itemReviewed: Product | LocalBusiness;
  reviewRating: Rating;
  author: Person;
  datePublished: string;
  reviewBody?: string;
}

export interface Product {
  '@type': 'Product';
  name: string;
}

export interface LocalBusiness {
  '@type': 'LocalBusiness';
  name: string;
}

export interface Rating {
  '@type': 'Rating';
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
}

export interface VideoObjectSchema {
  '@context': 'https://schema.org';
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}
