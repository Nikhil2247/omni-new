import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Pricing Plans - Omnicassion',
  'Choose the perfect plan for your event planning needs. Flexible pricing for individuals, professionals, and businesses. Free to get started, scale as you grow.',
  {
    path: '/pricing',
    keywords: [
      'event planning pricing',
      'wedding planning cost',
      'vendor platform pricing',
      'event management pricing',
      'subscription plans',
      'event planning packages',
    ],
    type: 'website',
  }
);

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
