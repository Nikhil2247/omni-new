'use client'

import { useEffect } from 'react'
import { WishlistList } from '@/components/features/events/wishlist-list'
import { trackDashboard } from '@/lib/analytics/umami'

export default function BusinessWishlistsPage() {
  useEffect(() => {
    trackDashboard.sectionView('wishlists', 'business')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wishlist Boards</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save and organise vendors you want to collaborate with or reference.
        </p>
      </div>
      <WishlistList basePath="/business/wishlists" />
    </div>
  )
}
