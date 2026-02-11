import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { AddWishlistItemInput, CreateWishlistInput, Wishlist, WishlistItem } from '../types/wishlist.types'

export const wishlistService = {
  async getMine() {
    try {
      const response = await apiClient.get<Wishlist[] | { data?: Wishlist[] } | null>(API_ENDPOINTS.USER.WISHLISTS)
      const payload = response.data as { data?: Wishlist[] } | Wishlist[] | null
      if (payload && typeof payload === 'object' && 'data' in payload) {
        return payload.data ?? []
      }
      return payload ?? []
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []
      }
      throw error
    }
  },

  async getById(id: string) {
    const response = await apiClient.get<Wishlist | { data?: Wishlist }>(API_ENDPOINTS.USER.WISHLIST_BY_ID(id))
    const payload = response.data as { data?: Wishlist } | Wishlist
    return typeof payload === 'object' && 'data' in payload ? (payload.data as Wishlist) : (payload as Wishlist)
  },

  async createWishlist(input: CreateWishlistInput) {
    const response = await apiClient.post<Wishlist | { data?: Wishlist }>(API_ENDPOINTS.USER.WISHLISTS, input)
    const payload = response.data as { data?: Wishlist } | Wishlist
    return typeof payload === 'object' && 'data' in payload ? (payload.data as Wishlist) : (payload as Wishlist)
  },

  async addVendor(wishlistId: string, input: AddWishlistItemInput) {
    const response = await apiClient.post<WishlistItem | { data?: WishlistItem }>(
      API_ENDPOINTS.USER.WISHLIST_ITEMS(wishlistId),
      input,
    )
    const payload = response.data as { data?: WishlistItem } | WishlistItem
    return typeof payload === 'object' && 'data' in payload ? (payload.data as WishlistItem) : (payload as WishlistItem)
  },

  async deleteItem(itemId: string) {
    await apiClient.delete(API_ENDPOINTS.USER.WISHLIST_ITEM_BY_ID(itemId))
  },

  async deleteWishlist(id: string) {
    await apiClient.delete(API_ENDPOINTS.USER.WISHLIST_BY_ID(id))
  },
}
