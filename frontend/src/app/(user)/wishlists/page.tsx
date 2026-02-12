'use client'

import { WishlistList } from '@/components/features/events/wishlist-list'
import { useAuthStore } from '@/store/auth-store'
import { useWishlistMine } from '@/hooks/queries/use-wishlists'
import { Card } from '@/components/ui/card'
import { Heart, Sparkles, FolderHeart, TrendingUp } from 'lucide-react'

export default function WishlistsPage() {
  const { user } = useAuthStore()
  const userId = user?.id
  const { data: wishlists = [] } = useWishlistMine(Boolean(userId))

  const wishlistArray = Array.isArray(wishlists) ? wishlists : (wishlists?.data ?? [])
  const totalItems = wishlistArray.reduce((total, list) => total + (list.items?.length ?? 0), 0)
  const totalBoards = wishlistArray.length

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 dark:from-pink-950/30 dark:via-rose-950/30 dark:to-purple-950/30 p-6">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">My Wishlists</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Save and organize vendors you love
            </p>
          </div>

          {/* Hearts animation container */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Heart className="h-6 w-6 fill-pink-500 text-pink-500 dark:fill-pink-400 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Saved</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Heart className="h-5 w-5 fill-pink-500 text-pink-500 dark:fill-pink-400 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Favorites</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <FolderHeart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Boards</p>
              <p className="text-2xl font-bold">{totalBoards}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg/Board</p>
              <p className="text-2xl font-bold">
                {totalBoards > 0 ? Math.round(totalItems / totalBoards) : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Wishlists Component */}
      <WishlistList />
    </div>
  )
}
