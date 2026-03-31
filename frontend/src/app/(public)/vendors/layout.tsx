import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/common/JsonLd';
import type { JsonLdSchema } from '@/lib/seo/types';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com';

export const metadata: Metadata = pageMetadata(
  'Wedding Vendors India - Photographers, Venues, Caterers & More | Omnicassion',
  'Find & book verified wedding vendors in India. Compare 10,000+ photographers, venues, caterers, decorators, makeup artists, planners. Read reviews, view portfolios, get quotes. Trusted by 50,000+ couples. Free to use.',
  {
    path: '/vendors',
    keywords: [
      // Primary - High Intent
      'wedding vendors India',
      'wedding vendors near me',
      'best wedding vendors',
      'top wedding vendors India',
      'verified wedding vendors',
      'book wedding vendors',
      'wedding vendor marketplace',

      // Category Keywords
      'wedding photographers India',
      'wedding venues near me',
      'wedding caterers',
      'wedding decorators India',
      'bridal makeup artists',
      'mehndi artists near me',
      'wedding planners India',
      'wedding DJs',
      'wedding florists',
      'wedding videographers',

      // Long-tail
      'best wedding vendors in Mumbai',
      'affordable wedding vendors Delhi',
      'wedding vendors with reviews',
      'compare wedding vendor prices',
      'wedding vendor booking online',
      'trusted wedding professionals',

      // Service Keywords
      'event vendors India',
      'party vendors',
      'birthday party vendors',
      'corporate event vendors',
      'anniversary celebration vendors',

      // Location Variants
      'wedding vendors Mumbai',
      'wedding vendors Delhi',
      'wedding vendors Bangalore',
      'wedding vendors Chennai',
      'wedding vendors Hyderabad',
      'wedding vendors Kolkata',
      'wedding vendors Pune',
      'wedding vendors Jaipur',
    ],
    type: 'website',
  }
);

const vendorListingSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Wedding Vendors India - Find & Book Verified Professionals',
  description: 'Find & book verified wedding vendors in India. Compare 10,000+ photographers, venues, caterers, decorators, makeup artists, planners.',
  url: `${SITE_URL}/vendors`,
  mainEntity: {
    '@type': 'ItemList',
    name: 'Wedding Vendors in India',
    description: 'Complete list of verified wedding and event vendors',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: '10000+',
  },
  isPartOf: {
    '@type': 'WebSite',
    name: 'Omnicassion',
    url: SITE_URL,
  },
  about: [
    { '@type': 'Thing', name: 'Wedding Photography' },
    { '@type': 'Thing', name: 'Wedding Venues' },
    { '@type': 'Thing', name: 'Wedding Catering' },
    { '@type': 'Thing', name: 'Wedding Decoration' },
    { '@type': 'Thing', name: 'Bridal Makeup' },
    { '@type': 'Thing', name: 'Wedding Planning' },
  ],
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
      name: 'Vendors',
      item: `${SITE_URL}/vendors`,
    },
  ],
};

const faqSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find the best wedding vendors on Omnicassion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use our search filters to browse by category (photographers, venues, caterers, etc.), location, price range, and ratings. All vendors on Omnicassion are verified with portfolio reviews, customer ratings, and transparent pricing. You can compare multiple vendors side-by-side and read verified reviews from real couples.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it free to browse and contact vendors on Omnicassion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, browsing vendor profiles, viewing portfolios, reading reviews, and contacting vendors is completely free on Omnicassion. There are no hidden charges for couples looking to book wedding vendors.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I book a wedding vendor on Omnicassion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simply browse vendor profiles, view their portfolio and reviews, then click "Get Quote" or "Contact" to send an inquiry. The vendor will respond with availability and pricing. You can then discuss details and book directly through the platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the vendors on Omnicassion verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all vendors on Omnicassion go through a verification process. We verify business registration, portfolio authenticity, and collect real reviews from customers. Look for the "Verified" badge on vendor profiles.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of wedding vendors are available on Omnicassion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Omnicassion features all types of wedding vendors including photographers, videographers, venues, caterers, decorators, florists, makeup artists, mehndi artists, wedding planners, DJs, entertainment artists, invitation designers, jewellers, and more.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which cities in India does Omnicassion cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Omnicassion has wedding vendors in all major Indian cities including Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, Goa, Udaipur, Chandigarh, Kochi, and Gurgaon. We are constantly expanding to more cities.',
      },
    },
  ],
};

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={[vendorListingSchema, breadcrumbSchema, faqSchema]} />
      {children}
    </>
  );
}
