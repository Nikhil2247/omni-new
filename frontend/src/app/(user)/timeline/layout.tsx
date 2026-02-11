import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Event Timeline - Omnicassion',
  'Plan your event timeline, schedule tasks, and ensure everything runs smoothly on your big day.',
  {
    path: '/timeline',
    noIndex: true,
  }
);

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
