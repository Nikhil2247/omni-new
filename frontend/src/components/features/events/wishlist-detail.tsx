'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { useWishlist, useDeleteWishlistItem } from '@/hooks/queries/use-wishlists'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  Heart,
  Calendar,
  Store,
  ImageIcon,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

export function WishlistDetail({ wishlistId, basePath = '/wishlists' }: { wishlistId: string; basePath?: string }) {
  const { data: wishlist, isLoading, error } = useWishlist(wishlistId)
  const deleteItem = useDeleteWishlistItem()

  const handleRemoveItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId)
      toast.success('Vendor removed from wishlist')
    } catch {
      toast.error('Failed to remove vendor')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !wishlist) {
    return (
      <div className="space-y-6">
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to wishlists
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Unable to load wishlist</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This wishlist may have been deleted or you don&apos;t have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href={basePath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to wishlists
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            {wishlist.name}
          </h1>
          {wishlist.description && (
            <p className="text-muted-foreground">{wishlist.description}</p>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {format(new Date(wishlist.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
        {wishlist.isDefault && (
          <Badge>Default</Badge>
        )}
      </div>

      {/* Wishlist items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Saved Items</span>
            <Badge variant="secondary">{wishlist.items?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!wishlist.items || wishlist.items.length === 0 ? (
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">No wishlist items saved yet</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Save vendor profiles or portfolio media to see them here.
              </p>
              <Button asChild>
                <Link href="/discover">Discover vendors</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {wishlist.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {item.mediaItem ? (
                      <>
                        <div className="mb-1 flex items-center gap-2">
                          {item.mediaItem.type === 'VIDEO' ? (
                            <Video className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">Saved portfolio media</span>
                        </div>
                        {item.mediaItem.caption && (
                          <p className="text-sm text-muted-foreground truncate">
                            {item.mediaItem.caption}
                          </p>
                        )}
                        {item.mediaItem.vendor && (
                          <p className="text-sm text-muted-foreground truncate">
                            From {item.mediaItem.vendor.businessName}
                          </p>
                        )}
                      </>
                    ) : item.vendor ? (
                      <>
                        <Link
                          href={`/vendors/${item.vendor.slug}`}
                          className="font-medium hover:text-primary truncate block"
                        >
                          {item.vendor.businessName}
                        </Link>
                        {item.vendor.tagline && (
                          <p className="text-sm text-muted-foreground truncate">
                            {item.vendor.tagline}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Vendor unavailable</span>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.mediaItem?.vendor && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/vendors/${item.mediaItem.vendor.slug}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Vendor
                        </Link>
                      </Button>
                    )}
                    {item.vendor && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/vendors/${item.vendor.slug}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove wishlist item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {item.vendor?.businessName || item.mediaItem?.caption || 'this item'} from your wishlist.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveItem(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
