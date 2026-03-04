'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type { PortfolioMediaItem } from '@/lib/api/types/portfolio-media.types'
import { useAuthStore } from '@/store/auth-store'
import { WishlistPickerDialog } from '@/components/common/wishlist-picker-dialog'
import { useAddWishlistItem, useCreateWishlist, useWishlistMine, wishlistKeys } from '@/hooks/queries/use-wishlists'
import { useMediaItemTags } from '@/hooks/queries/use-media-tags'
import { getMinioViewUrl } from '@/lib/utils/minio'

interface PortfolioMediaCardProps {
  item: PortfolioMediaItem
  priority?: boolean
}

export function PortfolioMediaCard({ item, priority = false }: PortfolioMediaCardProps) {
  const router = useRouter()
  const { user, hasHydrated } = useAuthStore()
  const userId = user?.id
  const queryClient = useQueryClient()
  const wishlistsQuery = useWishlistMine(Boolean(userId))
  const wishlists = (Array.isArray(wishlistsQuery.data) ? wishlistsQuery.data : []) as import('@/lib/api/types/wishlist.types').Wishlist[]
  const createWishlist = useCreateWishlist(userId ?? '')
  const addItem = useAddWishlistItem()
  const [dialogOpen, setDialogOpen] = useState(false)
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
      className="group relative overflow-hidden rounded-xl sm:rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-lg"
    >
      <Link
        href={`/vendors/${item.vendor.slug}`}
        className="block w-full"
        aria-label={`View ${item.vendor.businessName || 'vendor'} profile`}
      >
        <NextImage
          src={imageUrl}
          alt={item.altText || item.vendor.businessName || 'Portfolio image'}
          width={1200}
          height={900}
          unoptimized={true}
          priority={priority}
          className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      
      {/* Heart button — always visible, top-right corner */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleSave() }}
        disabled={isSaved || isSaving}
        className="absolute top-2 right-2 z-10 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 shadow-sm backdrop-blur-sm flex items-center justify-center transition hover:bg-white hover:scale-110"
        aria-label={isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
      >
        <Heart className={isSaved ? 'h-3.5 w-3.5 sm:h-4 sm:w-4 fill-primary text-primary' : 'h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground'} />
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
    </div>
  )
}
