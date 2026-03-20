'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useBannerAds, useRecordBannerClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Button } from '@/components/ui/button'
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
  const ctaText = banner.ctaText || 'View Vendor'

  const handleClick = () => {
    if (banner.campaignId) {
      recordClick.mutate(banner.campaignId)
    }
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'relative group rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20',
          className
        )}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Banner Image */}
          {imageUrl && (
            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/20">
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
            <div className="flex items-center gap-1 text-primary text-xs font-medium mb-0.5">
              <Sparkles className="w-3 h-3" />
              Sponsored
            </div>
            <h4 className="font-semibold text-foreground text-sm truncate">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>

          {/* CTA */}
          <Link href={vendorLink} onClick={handleClick}>
            <Button size="sm" variant="outline" className="shrink-0">
              {ctaText}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'large') {
    return (
      <div
        className={cn(
          'relative group rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80',
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
              className="object-cover opacity-30"
              unoptimized
            />
          </div>
        )}

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-6">
          {/* Vendor Image */}
          {imageUrl && (
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 ring-4 ring-white/20 shadow-2xl">
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
            <div className="flex items-center justify-center md:justify-start gap-1 text-white/80 text-xs font-medium mb-2">
              <Sparkles className="w-3 h-3" />
              Sponsored
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {title}
            </h3>
            {subtitle && (
              <p className="text-white/80 text-lg mb-4 line-clamp-2">{subtitle}</p>
            )}
            <Link href={vendorLink} onClick={handleClick}>
              <Button size="lg" variant="secondary" className="shadow-lg">
                {ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
        'relative group rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/30 transition-colors',
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
            Sponsored
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
          <Button variant="default" size="sm" className="shadow-sm">
            {ctaText}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
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

  const banner = banners[0]
  if (!banner) return null

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
