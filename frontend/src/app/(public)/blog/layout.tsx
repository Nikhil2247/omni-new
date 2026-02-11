import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Event Planning Blog - Omnicassion',
  'Expert tips, guides, and inspiration for planning the perfect event. Read our latest articles on weddings, parties, vendor selection, budgeting, and more.',
  {
    path: '/blog',
    keywords: [
      'event planning blog',
      'wedding planning tips',
      'party planning guide',
      'vendor selection tips',
      'event budgeting',
      'wedding advice',
      'event trends',
      'planning checklist',
    ],
    type: 'website',
  }
);

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
