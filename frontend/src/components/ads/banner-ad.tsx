'use client'

import { imageDelivery } from '@/lib/utils/cloudinary'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useBannerAds, useRecordBannerClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { skBtn, skPaper } from '@/components/sketch'
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
          skPaper({ className: 'relative group block transition-transform duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue' }),
          className
        )}
      >
        <div className="flex items-center gap-3 p-3.5">
          {/* Banner Image */}
          {imageUrl && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-ink">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                {...imageDelivery(imageUrl)}
                sizes="48px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-0.5 inline-flex items-center gap-1 sk-eyebrow text-[10px]">
              <Sparkles className="h-2.5 w-2.5" />
              Promoted
            </div>
            <h4 className="font-display text-sm font-semibold text-ink truncate">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-ink-soft truncate">{subtitle}</p>
            )}
          </div>

          <div className="shrink-0 rounded-full bg-blue-wash p-1.5 text-blue transition-colors">
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
          'sk-paper relative group overflow-hidden bg-ink',
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
              {...imageDelivery(imageUrl)}
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-r from-black/32 via-black/24 to-black/36" />
        <div className="absolute inset-0 bg-linear-to-t from-black/22 via-transparent to-black/12" />

        <div className="relative z-10 flex flex-col items-center gap-6 p-8 md:flex-row md:p-12">
          {/* Vendor Image */}
          {imageUrl && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border-2 border-paper md:h-32 md:w-32">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                {...imageDelivery(imageUrl)}
                sizes="128px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-2 inline-flex items-center justify-center gap-1 rounded-full border-2 border-paper/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper md:justify-start">
              <Sparkles className="h-2.5 w-2.5" />
              Promoted
            </div>
            <h3 className="font-display mb-2 text-2xl font-semibold text-paper md:text-3xl">
              {title}
            </h3>
            {subtitle && (
              <p className="mb-4 line-clamp-2 text-base text-paper/85 md:text-lg">{subtitle}</p>
            )}
            <Link href={vendorLink} onClick={handleClick}>
              <span className={skBtn('solid', 'md', 'gap-2')}>
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
        skPaper({ className: 'relative group' }),
        className
      )}
    >
      <div className="flex items-center gap-4 p-4 md:p-6">
        {/* Vendor Image */}
        {imageUrl && (
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden shrink-0 border-2 border-ink">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              {...imageDelivery(imageUrl)}
              sizes="80px"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="sk-eyebrow flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3" />
            Promoted
          </div>
          <h4 className="font-display font-semibold text-ink text-base md:text-lg line-clamp-1">
            {title}
          </h4>
          {subtitle && (
            <p className="text-sm text-ink-soft line-clamp-2 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* CTA */}
        <Link href={vendorLink} onClick={handleClick} className="shrink-0">
          <span className={skBtn('solid', 'sm', 'gap-1.5')}>
            View Profile
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </Link>
      </div>
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

  if (isLoading || error || !banners || banners.length === 0) {
    return null
  }

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

  if (isLoading || error || !banners || banners.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {banners.map((banner) => (
        <SingleBanner key={banner.campaignId} banner={banner} variant={variant} />
      ))}
    </div>
  )
}
