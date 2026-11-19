'use client'

import { imageDelivery } from '@/lib/utils/cloudinary'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Heart, X, ExternalLink, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type { PortfolioMediaItem } from '@/lib/api/types/portfolio-media.types'
import { useAuthStore } from '@/store/auth-store'
import { WishlistPickerDialog } from '@/components/common/wishlist-picker-dialog'
import { useAddWishlistItem, useCreateWishlist, useWishlistMine, wishlistKeys } from '@/hooks/queries/use-wishlists'
import { useMediaItemTags } from '@/hooks/queries/use-media-tags'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { cn } from '@/lib/utils'
import { cardAspect, cropScale } from '@/lib/utils/masonry'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface PortfolioMediaCardProps {
  item: PortfolioMediaItem
  priority?: boolean
  isBoosted?: boolean
}

export function PortfolioMediaCard({ item, priority = false, isBoosted = false }: PortfolioMediaCardProps) {
  const router = useRouter()
  const { user, hasHydrated } = useAuthStore()
  const userId = user?.id
  const queryClient = useQueryClient()
  const wishlistsQuery = useWishlistMine(Boolean(userId))
  const wishlists = (Array.isArray(wishlistsQuery.data) ? wishlistsQuery.data : []) as import('@/lib/api/types/wishlist.types').Wishlist[]
  const createWishlist = useCreateWishlist(userId ?? '')
  const addItem = useAddWishlistItem()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [locallySaved, setLocallySaved] = useState(false)

  const previewUrl = item.cdnUrl || item.url
  const imageUrl = item.cdnUrl || getMinioViewUrl(previewUrl) || previewUrl

  const isSaved =
    locallySaved ||
    (Array.isArray(wishlists) && wishlists.some((list) =>
      list.items?.some((entry: { mediaItemId?: string | null }) => entry.mediaItemId === item.id)
    ))

  const handleSave = async () => {
    if (!hasHydrated) {
      return
    }
    if (!userId) {
      router.push('/login')
      return
    }
    if (isSaved || isSaving) {
      return
    }

    setDialogOpen(true)
  }

  const handleConfirm = async ({ wishlistId, wishlistName }: { wishlistId?: string; wishlistName?: string }) => {
    if (!userId) {
      return
    }

    let targetId = wishlistId

    if (!targetId && wishlistName) {
      const created = await createWishlist.mutateAsync({ name: wishlistName })
      targetId = created.id
    }

    if (!targetId) {
      return
    }

    try {
      setIsSaving(true)
      await addItem.mutateAsync({ wishlistId: targetId, input: { mediaItemId: item.id } })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.byId(targetId) })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.mine() })
      setLocallySaved(true)
      toast.success('Saved to wishlist')
    } finally {
      setIsSaving(false)
    }
  }

  const { data: tags = [] } = useMediaItemTags(item.id)

  return (
    <div
      className={cn(
        'group border-ink bg-sky1 relative overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2 transition-all duration-300',
        isBoosted && 'outline-gold outline-2 outline-offset-2 outline-dashed',
      )}
    >
      {isBoosted && (
        <div className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
          <span className="border-ink bg-gold inline-flex items-center gap-1 rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#2a1c00] uppercase">
            <Sparkles className="h-2.5 w-2.5" />
            Promoted
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="block w-full text-left"
        aria-label={`Preview ${item.vendor.businessName || 'vendor'} portfolio`}
      >
        {/* The card reserves its shape up front (no layout shift) and crops the photo to fill it. */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: `1 / ${cardAspect(item)}` }}>
          <NextImage
            src={imageUrl}
            alt={item.altText || item.vendor.businessName || 'Portfolio image'}
            fill
            sizes={`(max-width: 767px) calc(50vw * ${cropScale(item).toFixed(2)}), (max-width: 1023px) calc(34vw * ${cropScale(item).toFixed(2)}), (max-width: 1279px) calc(25vw * ${cropScale(item).toFixed(2)}), (max-width: 1535px) calc(20vw * ${cropScale(item).toFixed(2)}), calc(17vw * ${cropScale(item).toFixed(2)})`}
            {...imageDelivery(imageUrl)}
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </button>
      
      {/* Heart button — always visible, top-right corner */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleSave() }}
        disabled={isSaved || isSaving}
        className="border-ink bg-card absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full border-2 transition hover:scale-110"
        aria-label={isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
      >
        <Heart className={isSaved ? 'size-4 fill-current text-rose' : 'size-4 text-ink'} />
      </button>

      {/* Overlay - Always visible on mobile, fade in on hover for desktop */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 text-white transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
        <div className="flex flex-col gap-1">
          {/* Text Content */}
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/80">
            {item.vendor.categoryName ?? 'Featured'}
          </p>
          <Link 
            href={`/vendors/${item.vendor.slug}`} 
            className="block text-xs sm:text-sm font-semibold hover:underline line-clamp-1"
          >
            {item.vendor.businessName || 'View Vendor'}
          </Link>
          {item.caption && (
            <p className="text-[10px] sm:text-xs text-white/90 line-clamp-2">
              {item.caption}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag.id} 
                  className="rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[9px] sm:text-[10px] font-medium"
                >
                  #{tag.tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <WishlistPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wishlists={wishlists}
        onConfirm={handleConfirm}
        isSaving={isSaving}
      />

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-0">
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative">
            <NextImage
              src={imageUrl}
              alt={item.altText || item.vendor.businessName || 'Portfolio image'}
              width={1600}
              height={1200}
              {...imageDelivery(imageUrl)}
              className="w-full h-auto max-h-[70vh] object-contain"
            />

            {/* Info overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent p-4">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-white/70 mb-1">
                    {item.vendor.categoryName ?? 'Featured Vendor'}
                  </p>
                  <h3 className="text-lg font-semibold text-white truncate">
                    {item.vendor.businessName || 'View Vendor'}
                  </h3>
                  {item.caption && (
                    <p className="text-sm text-white/80 mt-1 line-clamp-2">{item.caption}</p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-medium text-white"
                        >
                          #{tag.tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setPreviewOpen(false)
                    router.push(`/vendors/${item.vendor.slug}`)
                  }}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Profile
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
