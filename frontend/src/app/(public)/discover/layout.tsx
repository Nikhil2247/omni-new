import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Discover Inspiration - Omnicassion',
  'Get inspired for your next event. Browse real weddings, party ideas, decor trends, and creative concepts from top vendors across India.',
  {
    path: '/discover',
    keywords: [
      'event inspiration',
      'wedding ideas',
      'party themes',
      'decor inspiration',
      'wedding photos',
      'event gallery',
      'vendor portfolios',
      'event trends',
    ],
    type: 'website',
  }
);

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
