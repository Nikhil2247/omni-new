'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { WishlistDetail } from '@/components/features/events/wishlist-detail'
import { trackWishlist } from '@/lib/analytics/umami'

export default function BusinessWishlistDetailPage() {
  const params = useParams()
  const boardId = params.boardId as string

  useEffect(() => {
    if (boardId) trackWishlist.view(boardId)
  }, [boardId])

  if (!boardId) return null

  return (
    <div className="space-y-6">
      <WishlistDetail wishlistId={boardId} basePath="/business/wishlists" />
    </div>
  )
}
