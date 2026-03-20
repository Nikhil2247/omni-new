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

  const { album: albumData } = album

  return (
    <Link
      href={`/vendors/${albumData.vendor.slug}?album=${albumData.id}`}
      onClick={handleClick}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/20"
    >
      {/* Promoted Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-primary/90 text-primary-foreground text-xs px-2.5 py-1 rounded-full font-medium shadow-lg flex items-center gap-1 backdrop-blur-sm">
          <Sparkles className="w-3 h-3" />
          Promoted
        </span>
      </div>

      {/* Image Section */}
      <div className="relative overflow-hidden">
        {albumData.coverImageUrl ? (
          <div className="w-full aspect-square relative">
            <Image
              src={albumData.coverImageUrl}
              alt={albumData.name || 'Album'}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <Images className="w-16 h-16 text-primary/40" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Media Count */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <Images className="w-3 h-3" />
            {albumData.mediaCount || 0}
          </span>
        </div>

        {/* Album Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h4 className="font-bold text-white text-lg line-clamp-1 drop-shadow-lg">
            {albumData.name || 'Untitled Album'}
          </h4>
          {albumData.description && (
            <p className="text-white/80 text-sm line-clamp-1 mt-0.5 drop-shadow">
              {albumData.description}
            </p>
          )}
        </div>

        {/* Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Vendor Info */}
      <div className="p-3 flex items-center gap-3">
        {albumData.vendor.profilePhotoUrl && (
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-border">
            <Image
              src={albumData.vendor.profilePhotoUrl}
              alt={albumData.vendor.businessName || 'Vendor'}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {albumData.vendor.businessName || 'Vendor'}
          </p>
          <p className="text-xs text-muted-foreground">View Portfolio</p>
        </div>
      </div>
    </Link>
  )
}

function AlbumSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md border border-border">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Images className="w-6 h-6 text-primary" />
              {title}
            </h2>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
