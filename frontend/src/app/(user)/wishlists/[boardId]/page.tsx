'use client'

import { useParams } from 'next/navigation'
import { WishlistDetail } from '@/components/features/events/wishlist-detail'

export default function WishlistDetailPage() {
  const params = useParams()
  const boardId = params.boardId as string

  if (!boardId) {
    return null
  }

  return (
    <div className="space-y-6">
      <WishlistDetail wishlistId={boardId} />
    </div>
  )
}
