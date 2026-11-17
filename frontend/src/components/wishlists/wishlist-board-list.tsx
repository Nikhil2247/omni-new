'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Play } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useCreateWishlist, useWishlistMine } from '@/hooks/queries/use-wishlists'
import { PaintedScene, SketchButton, skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { getMinioViewUrl } from '@/lib/utils/minio'

const wishlistSchema = z.object({
  name: z.string().min(2, 'Wishlist name is required'),
})

type WishlistValues = z.infer<typeof wishlistSchema>

type WishlistItemLike = {
  mediaItem?: {
    thumbnailUrl?: string | null
    cdnUrl?: string | null
    url?: string | null
    type?: string | null
  } | null
  vendor?: { bannerImageUrl?: string | null; profilePhotoUrl?: string | null } | null
}

function itemImage(item: WishlistItemLike): { src: string; video: boolean } | null {
  const raw =
    item.mediaItem?.thumbnailUrl ||
    item.mediaItem?.cdnUrl ||
    item.mediaItem?.url ||
    item.vendor?.bannerImageUrl ||
    item.vendor?.profilePhotoUrl
  if (!raw) return null
  return { src: getMinioViewUrl(raw) || raw, video: item.mediaItem?.type === 'VIDEO' }
}

function seedFor(id: string, n: number) {
  let h = 7
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973
  return h + n * 3
}

export function WishlistBoardList({ basePath = '/wishlists' }: { basePath?: string } = {}) {
  const [formError, setFormError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const userId = user?.id
  const { data: wishlists = [], isLoading, error } = useWishlistMine(Boolean(userId))
  const createWishlist = useCreateWishlist(userId ?? '')

  const form = useForm<WishlistValues>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = async (values: WishlistValues) => {
    if (!userId) return
    setFormError(null)
    try {
      await createWishlist.mutateAsync({ name: values.name })
      form.reset()
    } catch {
      setFormError('Unable to create the board. Please try again.')
    }
  }

  const wishlistArray = Array.isArray(wishlists) ? wishlists : (wishlists?.data ?? [])
  const nameError = form.formState.errors.name?.message

  return (
    <div>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="my-5 flex flex-wrap items-end gap-3"
      >
        <div className="sk-field !mb-0 min-w-[220px] max-sm:w-full max-sm:min-w-0">
          <label htmlFor="board-name">New board</label>
          <input
            id="board-name"
            placeholder="e.g. Sangeet ideas"
            aria-invalid={!!nameError}
            {...form.register('name')}
          />
        </div>
        <SketchButton type="submit" size="sm" disabled={createWishlist.isPending || !userId}>
          {createWishlist.isPending ? 'Creating...' : 'Create board'}
        </SketchButton>
        {nameError || formError ? (
          <p role="alert" className="w-full text-xs font-bold text-destructive">
            {nameError ?? formError}
          </p>
        ) : null}
      </form>

      {!userId || isLoading ? (
        <p className="text-sm text-ink-soft">Loading your boards...</p>
      ) : error ? (
        <p role="alert" className="text-sm font-bold text-destructive">
          Unable to load wishlists.
        </p>
      ) : wishlistArray.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-7 max-sm:grid-cols-1">
          {wishlistArray.map((wishlist, i) => {
            const items = (wishlist.items ?? []) as WishlistItemLike[]
            const tiles = items.slice(0, 4).map(itemImage)
            while (tiles.length < 4) tiles.push(null)
            const count = items.length

            return (
              <Link
                key={wishlist.id}
                href={`${basePath}/${wishlist.id}`}
                className={cn(
                  skPaper({ alt: i % 2 === 1 }),
                  'grid gap-2.5 p-3 pb-4 text-left text-inherit transition-transform hover:-translate-y-0.5',
                )}
              >
                <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-[var(--hand2)] border-2 border-ink">
                  {tiles.map((tile, n) => (
                    <div key={n} className="relative overflow-hidden bg-sky1">
                      {tile ? (
                        <>
                          <NextImage
                            src={tile.src}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          {tile.video ? (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                              <Play className="h-4 w-4 fill-white text-white" />
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <PaintedScene seed={seedFor(wishlist.id, n)} motif={n} />
                      )}
                    </div>
                  ))}
                </div>
                <b className="truncate font-display text-[1.2rem] font-bold">{wishlist.name}</b>
                <span className="text-[0.9rem] text-ink-soft">
                  {count} {count === 1 ? 'item' : 'items'} saved
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className={cn(skPaper({ alt: true }), 'p-8 text-center')}>
          <h2 className="font-display text-xl font-bold">Start your collection</h2>
          <p className="mt-2 text-ink-soft">
            Create your first board above to save and organize your favorite profiles and media.
          </p>
        </div>
      )}
    </div>
  )
}
