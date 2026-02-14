'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Heart, Sparkles, FolderHeart } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useCreateWishlist, useWishlistMine } from '@/hooks/queries/use-wishlists'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const wishlistSchema = z.object({
  name: z.string().min(2, 'Wishlist name is required'),
})

type WishlistValues = z.infer<typeof wishlistSchema>

export function WishlistList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { user } = useAuthStore()
  const userId = user?.id
  const { data: wishlists = [], isLoading, error } = useWishlistMine(Boolean(userId))
  const createWishlist = useCreateWishlist(userId ?? '')

  const form = useForm<WishlistValues>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = async (values: WishlistValues) => {
    if (!userId) {
      return
    }
    await createWishlist.mutateAsync({ name: values.name })
    form.reset()
    setIsCreateDialogOpen(false)
  }

  const wishlistArray = Array.isArray(wishlists) ? wishlists : (wishlists?.data ?? [])
  const totalItems = wishlistArray.reduce((total, list) => total + (list.items?.length ?? 0), 0)

  if (!userId) {
    return <div className="text-sm text-muted-foreground">Loading user profile...</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">Unable to load wishlists.</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">My Wishlists</h2>
          <p className="text-sm text-muted-foreground">Save vendors you love and revisit them anytime.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-pink-500/10 px-4 py-2">
            <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
            <span className="font-semibold text-pink-600">{totalItems} saved</span>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Wishlist
          </Button>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Create a new wishlist</DialogTitle>
            <DialogDescription>
              Organize your favorite vendors by category or event.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="e.g., Haldi Inspirations, Reception Venues"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={createWishlist.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {createWishlist.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Wishlists Grid */}
      {wishlistArray.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistArray.map((wishlist) => (
            <Link key={wishlist.id} href={`/wishlists/${wishlist.id}`}>
              <Card className="group h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-md">
                {/* Gradient header */}
                <div className="relative h-20 bg-linear-to-br from-pink-500 via-purple-500 to-indigo-500">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute right-3 top-3">
                    <Heart className="h-6 w-6 fill-white/80 text-white" />
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {wishlist.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span>{wishlist.items?.length ?? 0} vendors saved</span>
                  </div>

                  {/* Preview dots */}
                  {(wishlist.items?.length ?? 0) > 0 && (
                    <div className="mt-3 flex -space-x-2">
                      {[...Array(Math.min(4, wishlist.items?.length ?? 0))].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full border-2 border-background bg-linear-to-br from-pink-400 to-purple-500"
                        />
                      ))}
                      {(wishlist.items?.length ?? 0) > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                          +{(wishlist.items?.length ?? 0) - 4}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty className="border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Heart className="h-8 w-8 text-pink-500" />
            </EmptyMedia>
            <EmptyTitle>Start Your Collection</EmptyTitle>
            <EmptyDescription>
              Create your first wishlist to save and organize your favorite vendors.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
