import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata(
  'Budget Planning - Omnicassion',
  'Track your event budget, manage expenses, and stay within budget with our smart planning tools.',
  {
    path: '/budget',
    noIndex: true,
  }
);

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
