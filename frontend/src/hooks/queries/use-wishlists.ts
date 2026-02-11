import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { wishlistService } from '@/lib/api/services/wishlist.service'
import type { AddWishlistItemInput, CreateWishlistInput, Wishlist } from '@/lib/api/types/wishlist.types'

export const wishlistKeys = {
  all: ['wishlists'] as const,
  mine: () => [...wishlistKeys.all, 'mine'] as const,
  byId: (id: string) => [...wishlistKeys.all, 'detail', id] as const,
}

export function useWishlistMine(enabled = true) {
  return useQuery({
    queryKey: wishlistKeys.mine(),
    queryFn: () => wishlistService.getMine(),
    enabled,
  })
}

export function useWishlist(id?: string) {
  return useQuery({
    queryKey: id ? wishlistKeys.byId(id) : wishlistKeys.all,
    queryFn: () => {
      if (!id) {
        return Promise.resolve(null)
      }
      return wishlistService.getById(id)
    },
    enabled: Boolean(id),
  })
}

export function useCreateWishlist(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<CreateWishlistInput, 'userId'>) =>
      wishlistService.createWishlist({ ...input, userId }),
    onSuccess: (data) => {
      queryClient.setQueryData(wishlistKeys.mine(), (current?: Wishlist[]) => {
        if (!current) {
          return [data]
        }
        return [data, ...current]
      })
      queryClient.invalidateQueries({ queryKey: wishlistKeys.mine() })
    },
  })
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ wishlistId, input }: { wishlistId: string; input: AddWishlistItemInput }) =>
      wishlistService.addVendor(wishlistId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.mine() })
      queryClient.invalidateQueries({ queryKey: wishlistKeys.byId(variables.wishlistId) })
    },
  })
}

export function useDeleteWishlistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => wishlistService.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
    },
  })
}
