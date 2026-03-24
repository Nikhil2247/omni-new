'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart, MapPin, Star, ArrowRight, CheckCircle2, Sparkles, UserPlus, UserCheck, Crown, Award } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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

// Format address from vendor data
function formatAddress(vendor: VendorProfile): string {
  if (vendor.address) {
    const parts = [
      vendor.address.city?.name,
      vendor.address.city?.state?.name,
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(', ')
  }
  return 'Contact for location'
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
      list.items?.some((item: { vendorProfileId?: string | null }) => item.vendorProfileId === vendor.id)
    ))

  const isVerified = !!vendor.verifiedAt
  const isFeatured = vendor.featuredUntil && new Date(vendor.featuredUntil) > new Date()
  const isPremium = vendor.planTier === 'ENTERPRISE'
  const isPro = vendor.planTier === 'PROFESSIONAL' || vendor.planTier === 'ENTERPRISE'

  const reviewCount = vendor.reviewsCount ?? 0
  const averageRating =
    typeof vendor.averageRating === 'number' ? vendor.averageRating.toFixed(1) : null

  const handleCardClick = () => {
    router.push(`/vendors/${vendor.slug}`)
  }

  const handleSave = (e: React.MouseEvent) => {
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
      <div
        onClick={handleCardClick}
        className={cn(
          'group relative bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 border border-border hover:border-primary/20 cursor-pointer',
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

          {/* Action Buttons - Wishlist & Follow */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1.5">
            <TooltipProvider delayDuration={300}>
              {/* Follow Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={toggleFollow.isPending}
                    className={cn(
                      'h-8 w-8 rounded-full shadow-sm backdrop-blur flex items-center justify-center transition hover:scale-110',
                      isFollowing
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-white/90 hover:bg-white text-muted-foreground hover:text-foreground'
                    )}
                    aria-label={isFollowing ? 'Unfollow vendor' : 'Follow vendor'}
                  >
                    {isFollowing ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </TooltipContent>
              </Tooltip>

              {/* Wishlist Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaved || isSaving || createWishlist.isPending}
                    className="h-8 w-8 rounded-full bg-white/90 shadow-sm backdrop-blur flex items-center justify-center transition hover:bg-white hover:scale-110"
                    aria-label={isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4 transition',
                        isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isSaved ? 'Saved' : 'Save to wishlist'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Plan/Featured Badges */}
          {(isPremium || isPro || isFeatured) && (
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex flex-col gap-1 items-end">
              {isPremium && (
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
              {isPro && !isPremium && (
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Pro
                </span>
              )}
              {isFeatured && (
                <span className="bg-primary text-white text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-semibold shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
              )}
            </div>
          )}

          {/* Hover Action - Hidden on mobile */}
          <div className="absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex pointer-events-none">
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
                {averageRating ?? '-'}
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

          {/* Verified Badge & Location Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Location */}
            <div className="flex items-center text-muted-foreground text-xs min-w-0 flex-1">
              <MapPin className="w-3 h-3 mr-1 text-muted-foreground/60 shrink-0" />
              <span className="truncate">{formatAddress(vendor)}</span>
            </div>

            {/* Verified Badge */}
            {isVerified && (
              <div className="flex items-center text-green-600 text-xs shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                <span className="font-medium hidden sm:inline">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

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
