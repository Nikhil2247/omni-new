import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/common/JsonLd';
import type { JsonLdSchema } from '@/lib/seo/types';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com';

export const metadata: Metadata = pageMetadata(
  'Wedding Inspiration Gallery - Real Indian Weddings & Ideas | Omnicassion',
  'Get inspired by 10,000+ real Indian wedding photos. Browse wedding decor ideas, bridal looks, venue inspirations, mandap designs, and more. Find trending wedding themes, color palettes, and creative concepts from top vendors.',
  {
    path: '/discover',
    keywords: [
      // Primary
      'wedding inspiration India',
      'Indian wedding ideas',
      'real wedding photos',
      'wedding gallery',
      'wedding decor ideas',

      // Decor & Design
      'mandap decoration ideas',
      'wedding stage design',
      'sangeet decoration',
      'mehndi decor ideas',
      'reception decoration',
      'wedding entrance decor',
      'floral decoration wedding',

      // Bridal
      'bridal look inspiration',
      'Indian bridal makeup',
      'bridal lehenga ideas',
      'bridal jewellery inspiration',
      'mehndi design inspiration',

      // Themes
      'wedding theme ideas India',
      'destination wedding ideas',
      'royal wedding theme',
      'rustic wedding decor',
      'minimalist wedding',
      'traditional wedding ideas',
      'modern Indian wedding',

      // Regional
      'South Indian wedding ideas',
      'North Indian wedding decor',
      'Rajasthani wedding theme',
      'Bengali wedding ideas',
      'Punjabi wedding inspiration',
      'Marwari wedding decor',

      // Venue
      'beach wedding inspiration',
      'palace wedding ideas',
      'farmhouse wedding decor',
      'outdoor wedding venue ideas',
      'banquet hall decoration',

      // Trends
      'wedding trends 2024',
      'wedding color palettes',
      'trending wedding decor',
      'celebrity wedding inspiration',
    ],
    type: 'website',
  }
);

const discoverPageSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Wedding Inspiration Gallery - Real Indian Weddings & Ideas',
  description: 'Get inspired by 10,000+ real Indian wedding photos. Browse wedding decor ideas, bridal looks, venue inspirations, mandap designs, and more.',
  url: `${SITE_URL}/discover`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Omnicassion',
    url: SITE_URL,
  },
  about: [
    { '@type': 'Thing', name: 'Wedding Inspiration' },
    { '@type': 'Thing', name: 'Indian Weddings' },
    { '@type': 'Thing', name: 'Wedding Decoration' },
    { '@type': 'Thing', name: 'Bridal Fashion' },
  ],
  mainEntity: {
    '@type': 'ImageGallery',
    name: 'Indian Wedding Inspiration Gallery',
    description: 'Real wedding photos and vendor portfolios from across India',
  },
  inLanguage: 'en-IN',
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
      name: 'Discover',
      item: `${SITE_URL}/discover`,
    },
  ],
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[discoverPageSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}
