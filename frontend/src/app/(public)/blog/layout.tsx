import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/common/JsonLd';
import type { JsonLdSchema } from '@/lib/seo/types';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com';

export const metadata: Metadata = pageMetadata(
  'Wedding Planning Blog - Tips, Ideas & Guides | Omnicassion',
  'Expert wedding planning tips, vendor selection guides, budget advice, and inspiration. Read our latest articles on Indian weddings, decor ideas, photography tips, and more.',
  {
    path: '/blog',
    keywords: [
      // Primary keywords
      'wedding planning blog',
      'Indian wedding blog',
      'wedding tips India',
      'event planning blog',

      // Topic-specific keywords
      'wedding photography tips',
      'wedding decor ideas',
      'bridal makeup tips',
      'wedding budget planning',
      'wedding vendor selection',
      'pre-wedding shoot ideas',

      // Long-tail keywords
      'how to plan Indian wedding',
      'wedding checklist India',
      'best wedding photographers India',
      'wedding venue selection tips',
      'wedding catering tips',
      'mehndi design ideas',
      'sangeet planning ideas',
      'haldi ceremony ideas',

      // Branded
      'Omnicassion blog',
      'Omnicassion wedding tips',
    ],
    type: 'website',
  }
);

// Blog collection schema - using Record for extended schema properties
const blogCollectionSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Wedding Planning Blog | Omnicassion',
  description: 'Expert wedding planning tips, guides, and inspiration for Indian weddings.',
  url: `${SITE_URL}/blog`,
  mainEntity: {
    '@type': 'ItemList',
    name: 'Wedding Planning Articles',
    description: 'Collection of wedding planning articles, tips, and guides',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
  },
  isPartOf: {
    '@type': 'WebSite',
    name: 'Omnicassion',
    url: SITE_URL,
  },
  publisher: {
    '@type': 'Organization',
    name: 'Omnicassion',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/images/omnilogo.avif`,
    },
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
      name: 'Blog',
      item: `${SITE_URL}/blog`,
    },
  ],
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[blogCollectionSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}
