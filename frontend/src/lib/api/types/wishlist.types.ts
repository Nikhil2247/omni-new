export interface WishlistItemVendor {
  id: string
  businessName: string
  slug: string
  categoryId: string
  tagline?: string | null
}

export interface WishlistItem {
  id: string
  wishlistId: string
  vendorProfileId: string
  notes?: string | null
  createdAt: string
  vendor?: WishlistItemVendor | null
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
  vendorProfileId: string
  notes?: string
}
