'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Star, MapPin, CheckCircle2 } from 'lucide-react'
import { useFeaturedListings, useRecordBoostImpression, useRecordBoostClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { FeaturedListing } from '@/lib/api/types/ads.types'

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

  const averageRating =
    typeof listing.averageRating === 'number' ? listing.averageRating.toFixed(1) : null
  const reviewCount = listing.totalReviews ?? 0

  return (
    <Link
      href={`/vendors/${listing.slug}`}
      onClick={handleClick}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/20"
    >
      {/* Featured Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Featured
        </span>
      </div>

      {/* Image Section */}
      <div className="relative overflow-hidden">
        {listing.profilePhotoUrl ? (
          <div className="w-full aspect-3/2 relative">
            <Image
              src={listing.profilePhotoUrl}
              alt={listing.businessName || 'Vendor'}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div className="w-full aspect-3/2 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-primary-foreground shadow-lg">
              {listing.businessName?.charAt(0) || 'V'}
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1 gap-3">
          <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-300 flex-1 min-w-0 line-clamp-1">
            {listing.businessName || 'Unnamed Vendor'}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-foreground font-semibold text-xs">
              {averageRating ?? '-'}
            </span>
            <span className="text-muted-foreground text-xs">({reviewCount})</span>
          </div>
        </div>

        <p className="text-muted-foreground text-xs mb-2 line-clamp-2 leading-relaxed">
          {listing.tagline || 'Professional service provider'}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center text-muted-foreground text-xs min-w-0 flex-1">
            <MapPin className="w-3 h-3 mr-1 text-muted-foreground/60 shrink-0" />
            <span className="truncate">
              Contact for location
            </span>
          </div>

          <div className="flex items-center text-green-600 text-xs shrink-0">
            <CheckCircle2 className="w-3 h-3 mr-0.5" />
            <span className="font-medium">Promoted</span>
          </div>
        </div>
      </div>
    </Link>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {title}
            </h2>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>

          {showViewAll && (
            <Link
              href="/vendors"
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 text-sm"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
