'use client'

import { useEffect, useRef } from 'react'
import { useFeaturedListings, useRecordBoostImpression, useRecordBoostClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { ListSectionHead } from '@/components/sketch'
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

export function FeaturedVendors({
  limit = 8,
  title = 'Featured Vendors',
  subtitle = 'Top-rated vendors ready to make your event special',
  className,
  showViewAll = true,
}: FeaturedVendorsProps) {
  const { data: listings, isLoading, error } = useFeaturedListings(limit)

  if (isLoading || error || !listings || listings.length === 0) {
    return null
  }

  return (
    <section className={cn('mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16', className)}>
      <ListSectionHead
        eyebrow="Promoted"
        title={title}
        subtitle={subtitle}
        href={showViewAll ? '/vendors' : undefined}
        cta={showViewAll ? 'View All Vendors →' : undefined}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => <FeaturedVendorCard key={listing.campaignId} listing={listing} />)}
      </div>
    </section>
  )
}
