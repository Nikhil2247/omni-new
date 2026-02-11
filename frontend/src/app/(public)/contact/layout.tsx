import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Contact Us - Omnicassion',
  'Get in touch with Omnicassion. We\'re here to help you plan the perfect event. Reach out for support, vendor inquiries, or partnership opportunities.',
  {
    path: '/contact',
    keywords: [
      'contact omnicassion',
      'event planning support',
      'vendor support',
      'customer service',
      'event planning help',
      'partnership inquiry',
    ],
    type: 'website',
  }
);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
