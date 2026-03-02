export interface WishlistItemVendor {
  id: string
  businessName: string
  slug: string
  categoryId: string
  tagline?: string | null
}

export interface WishlistItemMedia {
  id: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  thumbnailUrl?: string | null
  cdnUrl?: string | null
  altText?: string | null
  caption?: string | null
  createdAt: string
  vendor?: WishlistItemVendor | null
}

export interface WishlistItem {
  id: string
  wishlistId: string
  vendorProfileId?: string | null
  mediaItemId?: string | null
  notes?: string | null
  createdAt: string
  vendor?: WishlistItemVendor | null
  mediaItem?: WishlistItemMedia | null
}

export interface Wishlist {
  id: string
  userId: string
  name: string
  description?: string | null
  isDefault?: boolean
  createdAt: string
  items?: WishlistItem[]
}

export interface CreateWishlistInput {
  userId: string
  name: string
  description?: string
  isDefault?: boolean
}

export interface AddWishlistItemInput {
  vendorProfileId?: string
  mediaItemId?: string
  notes?: string
}
