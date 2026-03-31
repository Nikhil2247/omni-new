import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo/metadata'
import { JsonLd } from '@/components/common/JsonLd'
import type { JsonLdSchema } from '@/lib/seo/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

export const metadata: Metadata = pageMetadata(
  'Search Wedding Vendors & Services | Omnicassion',
  'Search for wedding vendors, photographers, venues, caterers, decorators, and more on Omnicassion. Find and compare the best event professionals in India.',
  {
    path: '/search',
    keywords: [
      'search wedding vendors',
      'find photographers',
      'search caterers',
      'wedding venue search',
      'event vendors India',
      'compare wedding services',
    ],
    type: 'website',
    noIndex: true, // Search results pages typically shouldn't be indexed
  }
)

// SearchResultsPage schema
const searchPageSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'SearchResultsPage',
  name: 'Search Results | Omnicassion',
  description: 'Search results for wedding and event vendors on Omnicassion',
  url: `${SITE_URL}/search`,
  mainEntity: {
    '@type': 'WebSite',
    name: 'Omnicassion',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={searchPageSchema} />
      {children}
    </>
  )
}
