import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'About Us - Omnicassion',
  'Learn about Omnicassion, India\'s premier event planning platform. Discover how we connect event planners with verified vendors to create unforgettable celebrations.',
  {
    path: '/about',
    keywords: [
      'about omnicassion',
      'event planning company',
      'wedding planning company India',
      'event marketplace',
      'vendor platform',
      'event technology',
    ],
    type: 'website',
  }
);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
