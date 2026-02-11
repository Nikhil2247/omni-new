import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Sign In - Omnicassion',
  'Sign in to your Omnicassion account to manage your events, connect with vendors, and plan your perfect celebration.',
  {
    path: '/signin',
    keywords: ['sign in', 'login', 'account access'],
    type: 'website',
    noIndex: true, // Auth pages typically should not be indexed
  }
);

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
