'use client'

import { useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlist, useDeleteWishlistItem } from '@/hooks/queries/use-wishlists'
import { Brush, Chip, Eyebrow, PaintedScene, Paper, SketchButton, skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Heart,
  Calendar,
  Store,
  ImageIcon,
  Video,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { getMinioViewUrl } from '@/lib/utils/minio'

export function WishlistBoardDetail({ wishlistId, basePath = '/wishlists' }: { wishlistId: string; basePath?: string }) {
  const { data: wishlist, isLoading, error } = useWishlist(wishlistId)
  const deleteItem = useDeleteWishlistItem()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const handleRemoveItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId)
      toast.success('Item removed from wishlist')
    } catch {
      toast.error('Failed to remove item')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !wishlist) {
    return (
      <div className="space-y-6">
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm font-bold text-blue hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to wishlists
        </Link>
        <Paper alt className="px-6 py-12 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-rose" />
          <h2 className="font-display text-xl font-bold">Unable to load wishlist</h2>
          <p className="mt-2 text-sm text-ink-soft">
            This wishlist may have been deleted or you don&apos;t have access to it.
          </p>
        </Paper>
      </div>
    )
  }

  // Collect all media items that have a viewable URL for lightbox navigation
  const lightboxMedia = (wishlist.items ?? [])
    .filter((item) => item.mediaItem && (item.mediaItem.cdnUrl || item.mediaItem.url || item.mediaItem.thumbnailUrl))
    .map((item) => ({
      url:
        getMinioViewUrl(item.mediaItem!.cdnUrl || item.mediaItem!.url || item.mediaItem!.thumbnailUrl) ||
        item.mediaItem!.cdnUrl ||
        item.mediaItem!.url ||
        item.mediaItem!.thumbnailUrl ||
        '',
      alt: item.mediaItem!.altText || item.mediaItem!.caption || 'Wishlisted media',
      type: item.mediaItem!.type as 'IMAGE' | 'VIDEO',
    }))

  const openLightbox = (url: string) => {
    const idx = lightboxMedia.findIndex((m) => m.url === url)
    setLightboxIndex(idx >= 0 ? idx : 0)
    setLightboxOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="space-y-1">
          <Link href={basePath} className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-blue hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to wishlists
          </Link>
          <div><Eyebrow>Wishlist</Eyebrow></div>
          <h1 className="font-display text-[clamp(2rem,4.4vw,3.2rem)] font-bold leading-[1.05]">
            <Brush>{wishlist.name}</Brush>
          </h1>
          {wishlist.description && (
            <p className="text-ink-soft">{wishlist.description}</p>
          )}
          <p className="flex items-center gap-1 text-sm text-ink-soft">
            <Calendar className="h-4 w-4" />
            Created {format(new Date(wishlist.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
        {wishlist.isDefault && (
          <Chip>Default</Chip>
        )}
      </div>

      {/* Wishlist items */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-[1.6rem] font-bold">Saved items</h2>
          <Chip>{wishlist.items?.length ?? 0}</Chip>
        </div>
        <div>
          {!wishlist.items || wishlist.items.length === 0 ? (
            <Paper alt className="px-6 py-12 text-center">
              <Store className="mx-auto mb-4 h-12 w-12 text-ink-soft" />
              <h3 className="font-display text-lg font-bold">No wishlist items saved yet</h3>
              <p className="mb-4 mt-2 text-sm text-ink-soft">
                Save vendor profiles or portfolio media to see them here.
              </p>
              <SketchButton asChild>
                <Link href="/discover">Discover vendors</Link>
              </SketchButton>
            </Paper>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wishlist.items.map((item, idx) => {
                const thumbnailUrl = getMinioViewUrl(
                  item.mediaItem?.thumbnailUrl ||
                    item.mediaItem?.cdnUrl ||
                    item.mediaItem?.url
                ) || item.mediaItem?.thumbnailUrl || item.mediaItem?.cdnUrl || item.mediaItem?.url
                const previewUrl = getMinioViewUrl(
                  item.mediaItem?.cdnUrl ||
                    item.mediaItem?.url ||
                    item.mediaItem?.thumbnailUrl
                ) || item.mediaItem?.cdnUrl || item.mediaItem?.url || item.mediaItem?.thumbnailUrl

                return (
                  <div key={item.id} className={cn(skPaper({ alt: idx % 2 === 1 }), 'p-3')}>
                    {item.mediaItem ? (
                      <button
                        type="button"
                        aria-label="View media"
                        onClick={() => previewUrl && openLightbox(previewUrl)}
                        className="relative block h-52 w-full overflow-hidden rounded-[var(--hand2)] border-2 border-ink bg-sky1 focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-gold focus-visible:outline-offset-4"
                      >
                        {thumbnailUrl ? (
                          <>
                            <NextImage
                              src={thumbnailUrl}
                              alt={item.mediaItem.altText || item.mediaItem.caption || 'Media'}
                              fill
                              unoptimized
                              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                            />
                            {item.mediaItem.type === 'VIDEO' && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="h-8 w-8 fill-white text-white" />
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="relative block h-full w-full">
                            <PaintedScene seed={idx + 5} motif={idx} />
                            <span className="absolute inset-0 flex items-center justify-center">
                              {item.mediaItem.type === 'VIDEO' ? (
                                <Video className="h-7 w-7 text-on-blue drop-shadow" />
                              ) : (
                                <ImageIcon className="h-7 w-7 text-on-blue drop-shadow" />
                              )}
                            </span>
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="relative h-52 w-full overflow-hidden rounded-[var(--hand2)] border-2 border-ink bg-sky1">
                        <PaintedScene seed={idx + 11} motif={idx} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-card font-display text-3xl font-bold text-blue">
                            {item.vendor?.businessName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2.5 px-1 pb-1 pt-3">
                      {item.mediaItem ? (
                        <>
                          <p className="line-clamp-1 text-sm font-medium leading-tight">
                            {item.mediaItem.caption || 'Portfolio media'}
                          </p>
                          {item.mediaItem.vendor && (
                            <p className="line-clamp-1 text-xs text-ink-soft">
                              {item.mediaItem.vendor.businessName}
                            </p>
                          )}
                          <Chip>
                            {item.mediaItem.type === 'VIDEO' ? 'Video' : 'Photo'}
                          </Chip>
                        </>
                      ) : item.vendor ? (
                        <>
                          <Link
                            href={`/vendors/${item.vendor.slug}`}
                            className="line-clamp-1 text-sm font-medium leading-tight transition-colors hover:text-blue"
                          >
                            {item.vendor.businessName}
                          </Link>
                          {item.vendor.tagline && (
                            <p className="line-clamp-1 text-xs text-ink-soft">
                              {item.vendor.tagline}
                            </p>
                          )}
                          <Chip>Vendor</Chip>
                        </>
                      ) : (
                        <p className="text-sm text-ink-soft">Unavailable</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {item.notes && (
                          <span className="line-clamp-1 text-[11px] text-ink-soft italic">
                            &ldquo;{item.notes}&rdquo;
                          </span>
                        )}
                        <span className="text-[11px] text-ink-soft">
                          {format(new Date(item.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        {(item.mediaItem?.vendor || item.vendor) && (
                          <SketchButton variant="ghost" size="sm" asChild className="gap-1">
                            <Link href={`/vendors/${(item.mediaItem?.vendor ?? item.vendor)!.slug}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                              View
                            </Link>
                          </SketchButton>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <SketchButton variant="ghost" size="icon" aria-label="Remove from wishlist" className="hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </SketchButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove from wishlist?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &ldquo;{item.vendor?.businessName || item.mediaItem?.caption || 'This item'}&rdquo; will be removed from this wishlist.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveItem(item.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox — full-screen overlay matching vendor page style */}
      <AnimatePresence>
        {lightboxOpen && lightboxMedia.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Prev / Next */}
            {lightboxMedia.length > 1 && (
              <>
                <button
                  className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev === 0 ? lightboxMedia.length - 1 : prev - 1))
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex((prev) => (prev === lightboxMedia.length - 1 ? 0 : prev + 1))
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Media */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxMedia[lightboxIndex]?.type === 'VIDEO' ? (
                <video
                  src={lightboxMedia[lightboxIndex].url}
                  controls
                  className="max-h-[90vh] max-w-[90vw] rounded-xl"
                />
              ) : (
                <NextImage
                  src={lightboxMedia[lightboxIndex]?.url || ''}
                  alt={lightboxMedia[lightboxIndex]?.alt || ''}
                  width={1400}
                  height={900}
                  unoptimized
                  priority
                  className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
                />
              )}

              {/* Caption */}
              {lightboxMedia[lightboxIndex]?.alt && (
                <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-linear-to-t from-black/70 to-transparent p-4">
                  <p className="text-sm text-white/90">{lightboxMedia[lightboxIndex].alt}</p>
                </div>
              )}
            </motion.div>

            {/* Counter */}
            {lightboxMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
                {lightboxIndex + 1} / {lightboxMedia.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
