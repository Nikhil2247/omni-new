import type { Metadata } from 'next'
import { publicService } from '@/lib/api/services/public.service'
import { pageMetadata } from '@/lib/seo/metadata'
import { NotFoundError, withRetry } from '@/lib/seo/server-api'
import type { PortfolioMediaItem } from '@/lib/api/types/portfolio-media.types'
import InspirePage from './discover-client'
import { DiscoverSeoShell } from './discover-seo-shell'

// One cached render per hour: the HTML crawlers receive is stable and fast, and the API is not hit per request.
export const revalidate = 3600

async function getInitialMedia(): Promise<{ items: PortfolioMediaItem[]; total?: number }> {
  try {
    const response = await withRetry(() =>
      publicService.getDiscoveryMedia({ page: 1, limit: 30, orderBy: 'newest' }),
    )
    return { items: response?.data ?? [], total: response?.meta?.total }
  } catch (error) {
    if (error instanceof NotFoundError) return { items: [] }
    throw error
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await getInitialMedia()
  // Use the real number of photos, rounded down to a clean "1,200+" style figure, instead of a made-up count.
  const rounded = total && total >= 100 ? `${(Math.floor(total / 100) * 100).toLocaleString('en-IN')}+` : null
  const description = `Get inspired by ${rounded ? `${rounded} ` : ''}real Indian wedding photos. Browse mandap and stage decor, bridal looks, mehendi, sangeet and venue ideas from the vendors who created them, then request a quote.`

  return pageMetadata(
    'Wedding Inspiration Gallery – Real Indian Wedding Ideas, Decor & Looks',
    description,
    { path: '/discover', type: 'website' },
  )
}

export default async function DiscoverPage() {
  const { items, total } = await getInitialMedia()
  return <InspirePage shell={<DiscoverSeoShell items={items} total={total} />} />
}
