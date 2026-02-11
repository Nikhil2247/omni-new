import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Find Verified Event Vendors - Omnicassion',
  'Discover 10,000+ verified event vendors in India. Compare prices, read reviews, and book venues, caterers, photographers, decorators, and more for your perfect event.',
  {
    path: '/vendors',
    keywords: [
      'event vendors India',
      'wedding vendors',
      'venue booking',
      'catering services',
      'event photographers',
      'decorators',
      'wedding planners',
      'event services',
      'vendor comparison',
      'verified vendors',
    ],
    type: 'website',
  }
);

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
