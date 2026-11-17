'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { WishlistBoardDetail } from '@/components/wishlists/wishlist-board-detail'
import { SkContainer } from '@/components/sketch'
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
    <SkContainer className="pb-16 pt-6">
      <WishlistBoardDetail wishlistId={boardId} />
    </SkContainer>
  )
}
