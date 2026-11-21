import type { Metadata } from 'next'
import { PublicLayout } from '@/components/layouts/public'
import { NotFoundContent } from './not-found-content'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Omnicassion',
  description: 'The page you are looking for could not be found. Discover verified event vendors, wedding planners, and celebration services on Omnicassion.',
  robots: {
    index: false,
    follow: true,
  },
}

// Unmatched URLs only get the root layout, so this one wraps the page with the public header/footer.
// 404s thrown from inside (public) use (public)/not-found.tsx, which already sits in the public layout.
export default function NotFound() {
  return (
    <PublicLayout>
      <NotFoundContent />
    </PublicLayout>
  )
}
