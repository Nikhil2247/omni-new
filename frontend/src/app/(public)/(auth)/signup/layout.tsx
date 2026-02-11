import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Sign Up - Omnicassion',
  'Create your free Omnicassion account and start planning your dream event today. Join thousands of users who trust us for their celebrations.',
  {
    path: '/signup',
    keywords: ['sign up', 'register', 'create account', 'join'],
    type: 'website',
    noIndex: true,
  }
);

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
