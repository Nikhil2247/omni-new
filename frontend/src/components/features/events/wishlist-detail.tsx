'use client'

import { useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlist, useDeleteWishlistItem } from '@/hooks/queries/use-wishlists'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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

export function WishlistDetail({ wishlistId, basePath = '/wishlists' }: { wishlistId: string; basePath?: string }) {
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
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to wishlists
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Unable to load wishlist</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This wishlist may have been deleted or you don&apos;t have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Collect all media items that have a viewable URL for lightbox navigation
  const lightboxMedia = (wishlist.items ?? [])
    .filter((item) => item.mediaItem && (item.mediaItem.cdnUrl || item.mediaItem.url))
    .map((item) => ({
      url: item.mediaItem!.cdnUrl || item.mediaItem!.url!,
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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href={basePath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to wishlists
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            {wishlist.name}
          </h1>
          {wishlist.description && (
            <p className="text-muted-foreground">{wishlist.description}</p>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {format(new Date(wishlist.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
        {wishlist.isDefault && (
          <Badge>Default</Badge>
        )}
      </div>

      {/* Wishlist items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Saved Items</span>
            <Badge variant="secondary">{wishlist.items?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!wishlist.items || wishlist.items.length === 0 ? (
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">No wishlist items saved yet</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Save vendor profiles or portfolio media to see them here.
              </p>
              <Button asChild>
                <Link href="/discover">Discover vendors</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlist.items.map((item) => {
                const thumbnailUrl =
                  item.mediaItem?.thumbnailUrl ||
                  item.mediaItem?.cdnUrl ||
                  item.mediaItem?.url
                const previewUrl =
                  item.mediaItem?.cdnUrl ||
                  item.mediaItem?.url

                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm">
                    {/* Leading visual */}
                    {item.mediaItem ? (
                      <button
                        type="button"
                        aria-label="View media"
                        onClick={() => previewUrl && openLightbox(previewUrl)}
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {thumbnailUrl ? (
                          <>
                            <NextImage
                              src={thumbnailUrl}
                              alt={item.mediaItem.altText || item.mediaItem.caption || 'Media'}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            {item.mediaItem.type === 'VIDEO' && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="h-4 w-4 fill-white text-white" />
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            {item.mediaItem.type === 'VIDEO' ? (
                              <Video className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-400 to-purple-500 text-lg font-semibold text-white shadow-sm">
                        {item.vendor?.businessName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {item.mediaItem ? (
                        <>
                          <p className="truncate text-sm font-medium leading-tight">
                            {item.mediaItem.caption || 'Portfolio media'}
                          </p>
                          {item.mediaItem.vendor && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.mediaItem.vendor.businessName}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-1 h-4 px-1.5 text-[10px] leading-none">
                            {item.mediaItem.type === 'VIDEO' ? 'Video' : 'Photo'}
                          </Badge>
                        </>
                      ) : item.vendor ? (
                        <>
                          <Link
                            href={`/vendors/${item.vendor.slug}`}
                            className="truncate text-sm font-medium leading-tight hover:text-primary transition-colors"
                          >
                            {item.vendor.businessName}
                          </Link>
                          {item.vendor.tagline && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.vendor.tagline}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-1 h-4 px-1.5 text-[10px] leading-none">Vendor</Badge>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Unavailable</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2">
                        {item.notes && (
                          <span className="truncate text-[11px] text-muted-foreground italic">
                            &ldquo;{item.notes}&rdquo;
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(item.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      {(item.mediaItem?.vendor || item.vendor) && (
                        <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 px-2.5 text-xs">
                          <Link href={`/vendors/${(item.mediaItem?.vendor ?? item.vendor)!.slug}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/70 to-transparent p-4">
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
