import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/common/JsonLd';
import type { JsonLdSchema } from '@/lib/seo/types';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com';

export const metadata: Metadata = pageMetadata(
  'About Omnicassion - India\'s #1 Wedding & Event Planning Platform',
  'Learn about Omnicassion, India\'s premier all-in-one wedding and event planning platform. Since 2024, we\'ve helped 50,000+ couples plan their dream celebrations. Connect with 10,000+ verified vendors across 15+ cities. Trusted by families across India.',
  {
    path: '/about',
    keywords: [
      'about omnicassion',
      'omnicassion company',
      'omnicassion wedding platform',
      'event planning company India',
      'wedding planning company India',
      'best wedding planning platform',
      'Indian wedding marketplace',
      'event vendor platform',
      'wedding technology India',
      'omnicassion founders',
      'omnicassion team',
      'wedding startup India',
      'event tech company',
      'wedding planning app India',
      'verified wedding vendors',
      'trusted event platform',
    ],
    type: 'website',
  }
);

// Using Record type to allow extended schema properties
const organizationSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Omnicassion',
  alternateName: ['Omnicassion India', 'Omnicassion Wedding Platform'],
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/icons/icon-512x512.png`,
    width: 512,
    height: 512,
  },
  image: `${SITE_URL}/images/og-image.jpg`,
  description: 'India\'s premier all-in-one planning and social platform for weddings, celebrations, and events. Connect with verified vendors, manage planning, and create unforgettable celebrations.',
  slogan: 'Plan Your Perfect Celebration',
  foundingDate: '2024',
  foundingLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'India',
    },
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
    addressRegion: 'India',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@omnicassion.com',
      availableLanguage: ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Gujarati'],
      areaServed: 'IN',
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '21:00',
      },
    },
    {
      '@type': 'ContactPoint',
      contactType: 'Sales',
      email: 'vendors@omnicassion.com',
      availableLanguage: ['English', 'Hindi'],
      areaServed: 'IN',
    },
  ],
  sameAs: [
    'https://www.facebook.com/omnicassion',
    'https://twitter.com/omnicassion',
    'https://www.instagram.com/omnicassion',
    'https://www.linkedin.com/company/omnicassion',
    'https://www.youtube.com/@omnicassion',
    'https://www.pinterest.com/omnicassion',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  serviceArea: {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: 20.5937,
      longitude: 78.9629,
    },
    geoRadius: '2000 km',
  },
  numberOfEmployees: {
    '@type': 'QuantitativeValue',
    minValue: 10,
    maxValue: 50,
  },
  knowsAbout: [
    'Wedding Planning',
    'Event Management',
    'Vendor Booking',
    'Indian Weddings',
    'Destination Weddings',
    'Corporate Events',
    'Birthday Parties',
    'Anniversary Celebrations',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.8,
    reviewCount: 5000,
    bestRating: 5,
    worstRating: 1,
  },
};

const breadcrumbSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'About Us',
      item: `${SITE_URL}/about`,
    },
  ],
};

// Using Record type for extended AboutPage schema
const webPageSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#webpage`,
  url: `${SITE_URL}/about`,
  name: 'About Omnicassion - India\'s #1 Wedding & Event Planning Platform',
  description: 'Learn about Omnicassion, India\'s premier all-in-one wedding and event planning platform.',
  isPartOf: {
    '@id': `${SITE_URL}/#website`,
  },
  about: {
    '@id': `${SITE_URL}/#organization`,
  },
  mainEntity: {
    '@id': `${SITE_URL}/#organization`,
  },
  inLanguage: 'en-IN',
  datePublished: '2024-01-01',
  dateModified: new Date().toISOString().split('T')[0],
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[organizationSchema, breadcrumbSchema, webPageSchema]} />
      {children}
    </>
  );
}
