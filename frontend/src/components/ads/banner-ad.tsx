'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useBannerAds, useRecordBannerClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Skeleton } from '@/components/ui/skeleton'
import type { BannerAd as BannerAdType, BannerPlacement } from '@/lib/api/types/ads.types'

interface BannerAdProps {
  placement?: BannerPlacement
  categoryId?: string
  className?: string
  variant?: 'default' | 'compact' | 'large'
}

interface SingleBannerProps {
  banner: BannerAdType
  variant: 'default' | 'compact' | 'large'
  className?: string
}

function SingleBanner({ banner, variant, className }: SingleBannerProps) {
  const recordClick = useRecordBannerClick()

  // Use actual API fields with fallbacks for legacy structure
  const title = banner.businessName || banner.title || 'Sponsored'
  const subtitle = banner.tagline || banner.subtitle
  const imageUrl = getMinioViewUrl(banner.bannerImageUrl || banner.imageUrl)
  const vendorLink = banner.slug ? `/vendors/${banner.slug}` : (banner.ctaLink || '#')
  const handleClick = () => {
    if (banner.campaignId) {
      recordClick.mutate(banner.campaignId)
    }
  }

  if (variant === 'compact') {
    return (
      <Link
        href={vendorLink}
        onClick={handleClick}
        aria-label={`View ${title} profile`}
        className={cn(
          'relative group block overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-primary/5 to-transparent shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
          className
        )}
      >
        <div className="flex items-center gap-3 p-3.5">
          {/* Banner Image */}
          {imageUrl && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              Promoted
            </div>
            <h4 className="text-sm font-semibold text-foreground truncate">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>

          <div className="shrink-0 rounded-full bg-background/80 p-1.5 text-muted-foreground transition-colors group-hover:text-foreground">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'large') {
    return (
      <div
        className={cn(
          'relative group overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-zinc-800 shadow-xl',
          className
        )}
      >
        {/* Background Image */}
        {imageUrl && (
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover opacity-55 transition-transform duration-700 group-hover:scale-[1.02]"
              unoptimized
            />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-r from-black/32 via-black/24 to-black/36" />
        <div className="absolute inset-0 bg-linear-to-t from-black/22 via-transparent to-black/12" />

        <div className="relative z-10 flex flex-col items-center gap-6 p-8 md:flex-row md:p-12">
          {/* Vendor Image */}
          {imageUrl && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/30 shadow-2xl md:h-32 md:w-32">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-2 inline-flex items-center justify-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 md:justify-start">
              <Sparkles className="h-2.5 w-2.5" />
              Promoted
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              {title}
            </h3>
            {subtitle && (
              <p className="mb-4 line-clamp-2 text-base text-white/85 md:text-lg">{subtitle}</p>
            )}
            <Link href={vendorLink} onClick={handleClick}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/92 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-white hover:shadow-xl">
                View Profile
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'relative group rounded-xl overflow-hidden bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/30 transition-colors',
        className
      )}
    >
      <div className="flex items-center gap-4 p-4 md:p-6">
        {/* Vendor Image */}
        {imageUrl && (
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 ring-2 ring-primary/20">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-primary text-xs font-medium mb-1">
            <Sparkles className="w-3 h-3" />
            Promoted
          </div>
          <h4 className="font-bold text-foreground text-base md:text-lg line-clamp-1">
            {title}
          </h4>
          {subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* CTA */}
        <Link href={vendorLink} onClick={handleClick} className="shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            View Profile
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </Link>
      </div>
    </div>
  )
}

function BannerSkeleton({ variant }: { variant: 'default' | 'compact' | 'large' }) {
  if (variant === 'large') {
    return (
      <Skeleton className="w-full h-64 rounded-2xl" />
    )
  }

  return (
    <div className="flex items-center gap-4 p-4 border border-border rounded-xl">
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-9 w-20" />
    </div>
  )
}

export function BannerAd({
  placement = 'homepage',
  categoryId,
  className,
  variant = 'default',
}: BannerAdProps) {
  const { data: banners, isLoading, error } = useBannerAds(placement, categoryId, 1)

  if (error || (!isLoading && (!banners || banners.length === 0))) {
    return null
  }

  if (isLoading) {
    return <BannerSkeleton variant={variant} />
  }

  if (!banners || banners.length === 0) return null
  const banner = banners[0]

  return (
    <SingleBanner banner={banner} variant={variant} className={className} />
  )
}

interface BannerAdsCarouselProps {
  placement?: BannerPlacement
  categoryId?: string
  limit?: number
  className?: string
  variant?: 'default' | 'compact' | 'large'
}

export function BannerAdsCarousel({
  placement = 'homepage',
  categoryId,
  limit = 3,
  className,
  variant = 'default',
}: BannerAdsCarouselProps) {
  const { data: banners, isLoading, error } = useBannerAds(placement, categoryId, limit)

  if (error || (!isLoading && (!banners || banners.length === 0))) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {isLoading
        ? Array.from({ length: limit }).map((_, i) => (
            <BannerSkeleton key={i} variant={variant} />
          ))
        : banners?.map((banner) => (
            <SingleBanner key={banner.campaignId} banner={banner} variant={variant} />
          ))}
    </div>
  )
}
