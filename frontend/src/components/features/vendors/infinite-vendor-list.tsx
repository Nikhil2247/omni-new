'use client'

import { MasonryGrid } from './masonry-grid'
import { useInfiniteMediaWithIntersection } from '@/hooks/use-infinite-media'
import type { PortfolioMediaSearchParams } from '@/lib/api/types/portfolio-media.types'
import { Loader2 } from 'lucide-react'

interface InfiniteVendorListProps {
  filters?: Omit<PortfolioMediaSearchParams, 'page'>
}

export function InfiniteVendorList({ filters = {} }: InfiniteVendorListProps) {
  const {
    items,
    total,
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
  } = useInfiniteMediaWithIntersection({
    ...filters,
    limit: 20,
  })

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load vendors. Please try again.
      </div>
    )
  }

  if (!isLoading && items.length === 0) {
    return <div className="text-sm text-muted-foreground">No inspiration found yet.</div>
  }

  return (
    <div className="space-y-4">
      <MasonryGrid items={items} isLoading={isLoading} />

      {/* Load more trigger element */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more...
            </div>
          )}
        </div>
      )}

      {/* Show count */}
      {!isLoading && items.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {items.length} of {total} items
        </div>
      )}
    </div>
  )
}
