'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { usePublicVendor } from '@/hooks/queries/use-public-vendors'
import { useAuthStore } from '@/store/auth-store'
import { WishlistPickerDialog } from '@/components/common/wishlist-picker-dialog'
import { useAddWishlistItem, useCreateWishlist, useWishlistMine, wishlistKeys } from '@/hooks/queries/use-wishlists'
import { Button } from '@/components/ui/button'

interface VendorDetailProps {
  slug: string
}

export function VendorDetail({ slug }: VendorDetailProps) {
  const { data, isLoading, error } = usePublicVendor(slug)
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

  const isSaved =
    locallySaved ||
    (Array.isArray(wishlists) && wishlists.some((list) =>
      list.items?.some((item: { vendorProfileId?: string | null }) => item.vendorProfileId === data?.id)
    ))

  const handleSave = async () => {
    if (!data) return
    if (!userId) {
      router.push('/login')
      return
    }

    if (isSaving || isSaved) {
      return
    }
    setDialogOpen(true)
  }

  const handleConfirm = async ({ wishlistId, wishlistName }: { wishlistId?: string; wishlistName?: string }) => {
    if (!data || !userId) {
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
      await addItem.mutateAsync({ wishlistId: targetId, input: { vendorProfileId: data.id } })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.byId(targetId) })
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.mine() })
      setLocallySaved(true)
      toast.success('Saved to wishlist')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading vendor...</div>
  }

  if (error || !data) {
    return (
      <div className="text-sm text-destructive">
        Vendor not found or unavailable.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{data.businessName}</h1>
          {data.tagline && (
            <p className="text-muted-foreground">{data.tagline}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSave}
          disabled={isSaved || isSaving || createWishlist.isPending}
        >
          <Heart className={isSaved ? 'mr-2 h-4 w-4 text-primary' : 'mr-2 h-4 w-4'} />
          {isSaved ? 'Saved' : 'Save to wishlist'}
        </Button>
      </div>
      <WishlistPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wishlists={wishlists}
        onConfirm={handleConfirm}
        isSaving={isSaving}
      />
      {data.description && (
        <p className="text-muted-foreground">{data.description}</p>
      )}
      <div className="grid gap-3 rounded-lg border bg-card p-4 text-sm">
        <div>
          <span className="font-medium">Status:</span> {data.status}
        </div>
        {data.website && (
          <div>
            <span className="font-medium">Website:</span> {data.website}
          </div>
        )}
        {data.contactEmail && (
          <div>
            <span className="font-medium">Email:</span> {data.contactEmail}
          </div>
        )}
        {data.contactPhone && (
          <div>
            <span className="font-medium">Phone:</span> {data.contactPhone}
          </div>
        )}
        <div>
          <span className="font-medium">Leads:</span> {data.leadCount}
        </div>
        <div>
          <span className="font-medium">Views:</span> {data.viewCount}
        </div>
      </div>
    </div>
  )
}
