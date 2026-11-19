'use client'

import { imageDelivery } from '@/lib/utils/cloudinary'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { usePromotedAlbums, useRecordBoostImpression, useRecordBoostClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { ListSectionHead, PaintedScene, skPaper } from '@/components/sketch'
import type { PromotedAlbum } from '@/lib/api/types/ads.types'

interface PromotedAlbumsProps {
  limit?: number
  title?: string
  subtitle?: string
  className?: string
  showViewAll?: boolean
}

interface AlbumCardProps {
  album: PromotedAlbum
}

function AlbumCard({ album }: AlbumCardProps) {
  const recordImpression = useRecordBoostImpression()
  const recordClick = useRecordBoostClick()
  const impressionRecorded = useRef(false)

  useEffect(() => {
    if (!impressionRecorded.current && album.campaignId) {
      recordImpression.mutate(album.campaignId)
      impressionRecorded.current = true
    }
  }, [album.campaignId, recordImpression])

  const handleClick = () => {
    if (album.campaignId) {
      recordClick.mutate(album.campaignId)
    }
  }

  const seed = Math.abs(Array.from(album.portfolioId ?? album.campaignId ?? 'a').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 997

  return (
    <Link
      href={`/vendors/${album.vendorSlug}?album=${album.portfolioId}`}
      onClick={handleClick}
      className={`${skPaper()} sk-vcard group flex flex-col gap-3 p-2.5 pb-4`}
    >
      {/* Cover */}
      <div className="bg-sky1 relative aspect-[4/3] overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px]">
        {album.coverImageUrl ? (
          <Image
            src={album.coverImageUrl}
            alt={album.title || 'Album'}
            fill
            {...imageDelivery(album.coverImageUrl)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <PaintedScene seed={seed} motif={seed % 5} />
        )}
        <span className="sk-stamp bg-card absolute top-2 left-2 flex items-center gap-1 !text-blue">
          <Sparkles className="size-3" />
          Promoted
        </span>
      </div>

      {/* Details */}
      <div className="grid gap-1.5 px-2">
        <h3 className="font-display group-hover:text-blue line-clamp-1 text-[1.3rem] leading-tight font-semibold transition-colors">
          {album.title || 'Untitled Album'}
        </h3>
        <p className="text-ink-soft truncate text-[0.9rem]">{album.businessName || 'Vendor'}</p>
        <div className="border-line mt-1 flex items-baseline justify-between gap-2 border-t-2 border-dashed pt-2.5">
          <span className="text-ink-soft text-sm">Portfolio</span>
          <span className="text-blue flex items-center gap-1 text-sm font-bold">
            View portfolio <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function PromotedAlbums({
  limit = 6,
  title = 'Discover Amazing Work',
  subtitle = 'Featured portfolios from top vendors',
  className,
  showViewAll = true,
}: PromotedAlbumsProps) {
  const { data: albums, isLoading, error } = usePromotedAlbums(limit)

  if (isLoading || error || !albums || albums.length === 0) {
    return null
  }

  return (
    <section className={cn('mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16', className)}>
      <ListSectionHead
        eyebrow="Promoted"
        title={title}
        subtitle={subtitle}
        href={showViewAll ? '/discover' : undefined}
        cta={showViewAll ? 'Explore Discover →' : undefined}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {albums.map((album) => <AlbumCard key={album.campaignId} album={album} />)}
      </div>
    </section>
  )
}
