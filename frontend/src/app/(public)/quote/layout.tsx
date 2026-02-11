import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Get Event Quote - Omnicassion',
  'Get instant quotes from multiple vendors for your event. Compare prices, services, and availability. Free, no obligation quote requests.',
  {
    path: '/quote',
    keywords: [
      'event quote',
      'wedding quote',
      'vendor pricing',
      'event cost estimate',
      'free quote',
      'compare vendors',
      'event pricing',
    ],
    type: 'website',
  }
);

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
