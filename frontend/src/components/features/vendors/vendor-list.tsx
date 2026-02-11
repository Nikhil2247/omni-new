'use client'

import { MasonryGrid } from './masonry-grid'
import { usePublicMediaFeed } from '@/hooks/queries/use-public-vendors'
import type { PortfolioMediaSearchParams } from '@/lib/api/types/portfolio-media.types'

interface VendorListProps {
  filters: PortfolioMediaSearchParams
}

export function VendorList({ filters }: VendorListProps) {
  const { data, isLoading, error } = usePublicMediaFeed(filters)

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load vendors. Please try again.
      </div>
    )
  }

  if (!isLoading && !data?.data?.length) {
    return <div className="text-sm text-muted-foreground">No inspiration found yet.</div>
  }

  return <MasonryGrid items={data?.data ?? []} isLoading={isLoading} />
}
