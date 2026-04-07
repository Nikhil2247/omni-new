'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { useFeaturedListings, useRecordBoostImpression, useRecordBoostClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import type { FeaturedListing } from '@/lib/api/types/ads.types'
import type { VendorProfile } from '@/lib/api/types/vendor.types'

interface FeaturedVendorsProps {
  limit?: number
  title?: string
  subtitle?: string
  className?: string
  showViewAll?: boolean
}

function FeaturedVendorCard({ listing }: { listing: FeaturedListing }) {
  const recordImpression = useRecordBoostImpression()
  const recordClick = useRecordBoostClick()
  const impressionRecorded = useRef(false)

  useEffect(() => {
    if (!impressionRecorded.current && listing.campaignId) {
      recordImpression.mutate(listing.campaignId)
      impressionRecorded.current = true
    }
  }, [listing.campaignId, recordImpression])

  const handleClick = () => {
    if (listing.campaignId) {
      recordClick.mutate(listing.campaignId)
    }
  }

  const vendor: VendorProfile = {
    id: listing.vendorProfileId,
    userId: '',
    businessName: listing.businessName,
    slug: listing.slug,
    categoryId: listing.categoryId,
    profilePhotoUrl: listing.profilePhotoUrl,
    tagline: listing.tagline,
    status: 'ACTIVE',
    leadCount: 0,
    viewCount: 0,
    reviewsCount: listing.totalReviews,
    averageRating: listing.averageRating ?? null,
    createdAt: '',
    updatedAt: '',
  }

  return (
    <div onClickCapture={handleClick}>
      <VendorCard vendor={vendor} />
    </div>
  )
}

function FeaturedVendorSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md border border-border">
      <Skeleton className="w-full aspect-3/2" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function FeaturedVendors({
  limit = 8,
  title = 'Featured Vendors',
  subtitle = 'Top-rated vendors ready to make your event special',
  className,
  showViewAll = true,
}: FeaturedVendorsProps) {
  const { data: listings, isLoading, error } = useFeaturedListings(limit)

  if (error || (!isLoading && (!listings || listings.length === 0))) {
    return null
  }

  return (
    <section className={cn('py-12', className)}>
      <div className="container">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Featured
            </div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
              <Star className="h-6 w-6 text-primary" />
              {title}
            </h2>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>

          {showViewAll && (
            <Link
              href="/vendors"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {isLoading
            ? Array.from({ length: limit }).map((_, i) => (
                <FeaturedVendorSkeleton key={i} />
              ))
            : listings?.map((listing) => (
                <FeaturedVendorCard key={listing.campaignId} listing={listing} />
              ))}
        </div>
      </div>
    </section>
  )
}
