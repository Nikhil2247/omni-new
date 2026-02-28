'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { WishlistDetail } from '@/components/features/events/wishlist-detail'
import { trackWishlist } from '@/lib/analytics/umami'

export default function WishlistDetailPage() {
  const params = useParams()
  const boardId = params.boardId as string

  useEffect(() => {
    if (boardId) trackWishlist.view(boardId)
  }, [boardId])

  if (!boardId) {
    return null
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-12 lg:py-16">
      <WishlistDetail wishlistId={boardId} />
    </div>
  )
}
