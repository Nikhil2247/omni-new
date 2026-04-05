'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Images, Play } from 'lucide-react'
import { usePromotedAlbums, useRecordBoostImpression, useRecordBoostClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
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

  return (
    <Link
      href={`/vendors/${album.vendorSlug}?album=${album.portfolioId}`}
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-primary/15 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
    >
      {/* Promoted Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-md backdrop-blur-sm">
          <Sparkles className="w-3 h-3" />
          Promoted
        </span>
      </div>

      {/* Image Section */}
      <div className="relative overflow-hidden">
        {album.coverImageUrl ? (
          <div className="w-full aspect-square relative">
            <Image
              src={album.coverImageUrl}
              alt={album.title || 'Album'}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="w-full aspect-square bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <Images className="w-16 h-16 text-primary/40" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/72 via-black/22 to-transparent" />

        {/* Media Count */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <Images className="w-3 h-3" />
            Portfolio
          </span>
        </div>

        {/* Album Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="font-bold text-white text-lg line-clamp-1 drop-shadow-lg">
            {album.title || 'Untitled Album'}
          </h4>
          <p className="text-white/80 text-sm line-clamp-1 mt-0.5 drop-shadow">
            {album.businessName}
          </p>
        </div>

        {/* Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-white/18 p-3.5 backdrop-blur-sm">
            <Play className="h-7 w-7 fill-white text-white" />
          </div>
        </div>
      </div>

      {/* Vendor Info */}
      <div className="p-3 flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {album.businessName || 'Vendor'}
          </p>
          <p className="text-xs text-muted-foreground">View Portfolio</p>
        </div>
      </div>
    </Link>
  )
}

function AlbumSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-primary/10">
      <Skeleton className="w-full aspect-square" />
      <div className="p-3 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
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

  if (error || (!isLoading && (!albums || albums.length === 0))) {
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
              Promoted
            </div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
              <Images className="h-6 w-6 text-primary" />
              {title}
            </h2>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>

          {showViewAll && (
            <Link
              href="/discover"
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 text-sm"
            >
              Explore More
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {isLoading
            ? Array.from({ length: limit }).map((_, i) => (
                <AlbumSkeleton key={i} />
              ))
            : albums?.map((album) => (
                <AlbumCard key={album.campaignId} album={album} />
              ))}
        </div>
      </div>
    </section>
  )
}
