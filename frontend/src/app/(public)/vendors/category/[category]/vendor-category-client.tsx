'use client'

import { useEffect, useState } from 'react'
import { useVendorsByCategory } from '@/hooks/queries/use-public-vendors'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { trackDashboard } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import { Filter, SortAsc } from 'lucide-react'
import type { VendorProfile } from '@/lib/api/types/vendor.types'

interface VendorCategoryClientProps {
  category: string
  initialVendors: VendorProfile[]
  displayName: string
}

export default function VendorCategoryClient({
  category,
  initialVendors,
  displayName,
}: VendorCategoryClientProps) {
  const { data, isLoading, error } = useVendorsByCategory(category, 24)
  const vendors = data || initialVendors

  useEffect(() => {
    trackDashboard.sectionView(`vendors-category-${category}`, 'user')
  }, [category])

  return (
    <div className="space-y-6">
      {/* Filter/Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <SortAsc className="mr-2 h-4 w-4" />
            Sort by
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {vendors.length} {displayName.toLowerCase()}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && vendors.length === 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && vendors.length === 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            Unable to load vendors. Please try again later.
          </p>
        </div>
      )}

      {/* Vendor Grid */}
      {vendors.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && vendors.length === 0 && !error && (
        <div className="rounded-lg border bg-muted/30 p-12 text-center">
          <h3 className="text-lg font-medium">No vendors found</h3>
          <p className="mt-2 text-muted-foreground">
            We&apos;re adding new {displayName.toLowerCase()} regularly. Check back soon!
          </p>
        </div>
      )}

      {/* Load More */}
      {vendors.length >= 24 && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" size="lg">
            Load More {displayName}
          </Button>
        </div>
      )}
    </div>
  )
}
