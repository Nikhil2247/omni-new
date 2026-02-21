'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart, MapPin, Star, ArrowRight, CheckCircle2, Sparkles, UserPlus, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { VendorProfile } from '@/lib/api/types/vendor.types'
import { useAuthStore } from '@/store/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import { WishlistPickerDialog } from '@/components/common/wishlist-picker-dialog'
import {
  useAddWishlistItem,
  useCreateWishlist,
  useWishlistMine,
  wishlistKeys,
} from '@/hooks/queries/use-wishlists'
import { useToggleVendorFollow } from '@/hooks/queries/use-vendor-follows'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VendorCardProps {
  vendor: VendorProfile
  className?: string
}

// Category colors mapping
const categoryColors: Record<string, string> = {
  venues: 'bg-blue-100 text-blue-800',
  photography: 'bg-pink-100 text-pink-800',
  videography: 'bg-purple-100 text-purple-800',
  catering: 'bg-orange-100 text-orange-800',
  florists: 'bg-emerald-100 text-emerald-800',
  'wedding-planning': 'bg-indigo-100 text-indigo-800',
  'dj-music': 'bg-green-100 text-green-800',
  'makeup-hair': 'bg-rose-100 text-rose-800',
  decor: 'bg-violet-100 text-violet-800',
  cakes: 'bg-amber-100 text-amber-800',
  invitations: 'bg-cyan-100 text-cyan-800',
  rentals: 'bg-teal-100 text-teal-800',
}

export function VendorCard({ vendor, className = '' }: VendorCardProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const userId = user?.id
  const queryClient = useQueryClient()
  const wishlistsQuery = useWishlistMine(Boolean(userId))
  const wishlists = (Array.isArray(wishlistsQuery.data) ? wishlistsQuery.data : []) as import('@/lib/api/types/wishlist.types').Wishlist[]
  const createWishlist = useCreateWishlist(userId ?? '')
  const addItem = useAddWishlistItem()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [locallySaved, setLocallySaved] = useState(false)
  const toggleFollow = useToggleVendorFollow()
  
  // Use isFollowing from vendor data if available (when authenticated), otherwise false
  const [isFollowing, setIsFollowing] = useState(vendor.isFollowing ?? false)

  useEffect(() => {
    setIsFollowing(vendor.isFollowing ?? false)
  }, [vendor.id, vendor.isFollowing])

  const isSaved =
    locallySaved ||
    (Array.isArray(wishlists) && wishlists.some((list) =>
      list.items?.some((item: { vendorProfileId?: string }) => item.vendorProfileId === vendor.id)
    ))

  const isVerified = !!vendor.verifiedAt
  const isFeatured = vendor.featuredUntil && new Date(vendor.featuredUntil) > new Date()

  const reviewCount = vendor.reviewsCount ?? 0
  const averageRating =
    typeof vendor.averageRating === 'number' ? vendor.averageRating.toFixed(1) : null

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      router.push('/login')
      return
    }

    if (isSaving || isSaved) {
      return
    }
    setDialogOpen(true)
  }

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      router.push('/login')
      return
    }

    const previousState = isFollowing
    setIsFollowing(!previousState)
    
    try {
      const result = await toggleFollow.mutateAsync(vendor.id)
      if (typeof result?.following === 'boolean') {
        setIsFollowing(result.following)
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState)
      toast.error('Failed to update follow status')
    }
  }

  const handleConfirm = async ({
    wishlistId,
    wishlistName,
  }: {
    wishlistId?: string
    wishlistName?: string
  }) => {
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
      await addItem.mutateAsync({
        wishlistId: targetId,
        input: { vendorProfileId: vendor.id },
      })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.byId(targetId) })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.mine() })
      setLocallySaved(true)
      toast.success('Saved to wishlist')
    } finally {
      setIsSaving(false)
    }
  }

  const categoryColor = categoryColors[vendor.category?.slug || ''] || 'bg-gray-100 text-gray-800'

  return (
    <>
      <Link href={`/vendors/${vendor.slug}`} className="block">
        <div
          className={cn(
            'group relative bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/20',
            className
          )}
        >
          {/* Image Section */}
          <div className="relative overflow-hidden">
            {/* Profile Photo or Placeholder */}
            {vendor.profilePhotoUrl ? (
              <div className="w-full aspect-3/2 relative">
                <Image
                  src={vendor.profilePhotoUrl}
                  alt={vendor.businessName || 'Vendor'}
                  fill
                  unoptimized={true}
                  priority={true}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
            ) : (
              <div className="w-full aspect-3/2 bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/60 text-3xl font-bold text-primary-foreground shadow-lg">
                  {vendor.businessName?.charAt(0) || 'V'}
                </div>
              </div>
            )}

            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block" />

            {/* Category Badge */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
              <span
              className={cn(
                'text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold backdrop-blur-sm bg-white/90',
                categoryColor
              )}
              >
              {vendor.category?.name || vendor.categoryId || 'Vendor'}
              </span>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved || isSaving || createWishlist.isPending}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 h-8 w-8 rounded-full bg-white/90 shadow-sm backdrop-blur flex items-center justify-center transition hover:bg-white hover:scale-110"
              aria-label={isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition',
                  isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                )}
              />
            </button>

            {/* Featured/Verified Badge */}
            {(isFeatured || isVerified) && (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
                {isFeatured && (
                  <span className="bg-primary text-white text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>
            )}

            {/* Hover Action - Hidden on mobile */}
            <div className="absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex">
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                View Details
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-3 sm:p-4">
            {/* Header with Rating */}
            <div className="flex items-start justify-between mb-1 gap-3">
              {/* Vendor Name */}
              <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors duration-300 flex-1 min-w-0 line-clamp-1">
                {vendor.businessName || 'Unnamed Vendor'}
              </h3>

              {/* Rating Section */}
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-primary text-primary" />
                <span className="text-foreground font-semibold text-xs">
                  {averageRating ?? '—'}
                </span>
                <span className="text-muted-foreground text-xs hidden sm:inline">
                  ({reviewCount})
                </span>
              </div>
            </div>

            {/* Tagline/Description */}
            <p className="text-muted-foreground text-[11px] sm:text-xs mb-2 line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {vendor.tagline || vendor.description || 'Professional service provider committed to making your event exceptional.'}
            </p>

            {/* Verified Badge */}
            {isVerified && (
              <div className="flex items-center text-green-600 text-xs mb-2">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                <span className="font-medium">Verified Vendor</span>
              </div>
            )}

            {/* Stats Section */}
            <div className="flex items-center text-muted-foreground text-xs mb-3">
              <MapPin className="w-3 h-3 mr-1.5 text-muted-foreground/60 shrink-0" />
              <span className="truncate">{vendor.serviceRadius ? `${vendor.serviceRadius}km service area` : 'Contact for location'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFollow}
                disabled={toggleFollow.isPending}
                className="flex-1"
              >
                {isFollowing ? (
                  <UserCheck className="mr-2 h-4 w-4" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            </div>

            {/* Price and CTA Section */}
            {/* <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                <span className="text-sm font-bold text-foreground">
                  {vendor.viewCount} views
                </span>
              </div>

           
              <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-primary text-white p-1.5 sm:p-2 rounded-full">
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </Link>

      <WishlistPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wishlists={wishlists}
        onConfirm={handleConfirm}
        isSaving={isSaving}
      />
    </>
  )
}
