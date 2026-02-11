import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'My Dashboard - Omnicassion',
  'Manage your events, track vendor inquiries, and plan your celebrations all in one place.',
  {
    path: '/dashboard',
    noIndex: true, // User dashboards should not be indexed
  }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
