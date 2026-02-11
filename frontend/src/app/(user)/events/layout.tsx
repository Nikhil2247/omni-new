import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'My Events - Omnicassion',
  'View and manage all your events in one place. Track progress, manage vendors, and stay organized.',
  {
    path: '/events',
    noIndex: true,
  }
);

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
