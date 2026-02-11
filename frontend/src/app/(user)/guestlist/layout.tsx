import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Guest List Management - Omnicassion',
  'Manage your event guest list, track RSVPs, and organize seating arrangements efficiently.',
  {
    path: '/guestlist',
    noIndex: true,
  }
);

export default function GuestListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
