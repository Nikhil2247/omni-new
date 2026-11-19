'use client'

import { optimizeImageUrl } from '@/lib/utils/cloudinary'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Heart, MapPin, ArrowRight, CheckCircle2, Sparkles, UserPlus, UserCheck, Crown, Award } from 'lucide-react'
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
import { useBoostedVendors, useRecordBoostClick } from '@/hooks/queries/use-ads'
import { cn } from '@/lib/utils'
import { PaintedScene } from '@/components/sketch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/** A stable number from a string, so a vendor without a photo always gets the same painted scene. */
function hashSeed(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h) % 997
}

interface VendorCardProps {
  vendor: VendorProfile
  className?: string
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
  const { data: boostedVendors = [] } = useBoostedVendors()
  const recordBoostClick = useRecordBoostClick()

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
  const boostedInfo = boostedVendors.find((entry) => entry.vendorProfileId === vendor.id)
  const isBoosted = Boolean(boostedInfo)

  const reviewCount = vendor.reviewsCount ?? 0
  const averageRating =
    typeof vendor.averageRating === 'number' ? vendor.averageRating.toFixed(1) : null

  const handleCardClick = () => {
    if (boostedInfo?.campaignId) {
      recordBoostClick.mutate(boostedInfo.campaignId)
    }
    router.push(`/vendors/${vendor.slug}`)
  }

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
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

  const categoryLabel = vendor.category?.name?.trim()
  const seed = hashSeed(vendor.id || vendor.slug || vendor.businessName || 'vendor')

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        aria-label={`Open ${vendor.businessName || 'vendor'} profile`}
        className={cn(
          'sk-vcard sk-paper group flex cursor-pointer flex-col gap-3 p-2.5 pb-4',
          isBoosted && 'outline-gold outline-2 outline-offset-4 outline-dashed',
          className
        )}
      >
        {/* Cover: photo, or a painted scene when the vendor has no photo */}
        <div className="bg-sky1 relative aspect-[4/3] overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px]">
          {vendor.profilePhotoUrl ? (
            <Image
              src={optimizeImageUrl(vendor.profilePhotoUrl, 640)}
              alt={vendor.businessName || 'Vendor'}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <PaintedScene seed={seed} motif={seed % 5} />
          )}

          {/* Follow and wishlist */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={toggleFollow.isPending}
                    className={cn(
                      'border-ink flex size-9 items-center justify-center rounded-full border-2 transition hover:scale-110',
                      isFollowing ? 'bg-blue text-on-blue' : 'bg-card text-ink'
                    )}
                    aria-label={isFollowing ? 'Unfollow vendor' : 'Follow vendor'}
                  >
                    {isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaved || isSaving || createWishlist.isPending}
                    className="border-ink bg-card flex size-9 items-center justify-center rounded-full border-2 transition hover:scale-110"
                    aria-label={isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
                  >
                    <Heart className={cn('size-[18px] transition', isSaved ? 'text-rose fill-current' : 'text-ink')} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {isSaved ? 'Saved' : 'Save to wishlist'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Plan and featured stamps */}
          {(isPremium || isPro || isFeatured) && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
              {isPremium && (
                <span className="sk-stamp bg-card flex items-center gap-1">
                  <Crown className="size-3" />
                  Premium
                </span>
              )}
              {isPro && !isPremium && (
                <span className="sk-stamp sk-stamp--wait bg-card flex items-center gap-1">
                  <Award className="size-3" />
                  Pro
                </span>
              )}
              {isFeatured && (
                <span className="sk-stamp bg-card !text-blue flex items-center gap-1">
                  <Sparkles className="size-3" />
                  Featured
                </span>
              )}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="grid gap-1.5 px-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display group-hover:text-blue line-clamp-1 min-w-0 flex-1 text-[1.3rem] leading-tight font-semibold transition-colors">
              {vendor.businessName || 'Unnamed Vendor'}
            </h3>
            {isVerified && (
              <span className="sk-stamp shrink-0">
                <CheckCircle2 className="mr-0.5 -mt-0.5 inline size-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-ink-soft flex items-center gap-1 text-[0.9rem]">
            {categoryLabel ? <span>{categoryLabel}</span> : null}
            {categoryLabel ? <span aria-hidden>·</span> : null}
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{formatAddress(vendor)}</span>
          </p>
          <p className="line-clamp-2 text-[0.94rem]">
            {vendor.tagline || vendor.description || 'Professional service provider committed to making your event exceptional.'}
          </p>
          <div className="border-line mt-1 flex items-baseline justify-between gap-2 border-t-2 border-dashed pt-2.5">
            <span className="font-bold">
              <b className="text-gold mr-0.5 font-normal">★</b>
              {averageRating ?? '-'} <small className="text-ink-soft font-normal">({reviewCount})</small>
            </span>
            <span className="text-blue flex items-center gap-1 text-sm font-bold">
              View profile <ArrowRight className="size-3.5" />
            </span>
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
