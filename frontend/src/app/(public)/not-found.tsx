import type { Metadata } from 'next'
import { NotFoundContent } from '../not-found-content'

export const metadata: Metadata = {
  title: '404 - Page Not Found | Omnicassion',
  description: 'The page you are looking for could not be found. Discover verified event vendors, wedding planners, and celebration services on Omnicassion.',
  robots: {
    index: false,
    follow: true,
  },
}

// Already inside (public)/layout.tsx, which supplies the header and footer.
export default function PublicNotFound() {
  return <NotFoundContent />
}
