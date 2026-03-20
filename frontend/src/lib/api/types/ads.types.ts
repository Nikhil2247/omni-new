import type { VendorProfile } from './vendor.types'

export type BannerPlacement = 'homepage' | 'category' | 'search' | 'profile'
export type ConversionType = 'LEAD' | 'BOOKING' | 'INQUIRY'

export interface FeaturedListing {
  vendorProfileId: string
  campaignId: string
  boostLevel: number
  vendor: VendorProfile
}

export interface BannerAd {
  campaignId: string
  vendorProfileId: string
  businessName: string
  slug: string
  bannerImageUrl?: string
  tagline?: string
  // Legacy fields (for backward compatibility)
  title?: string
  subtitle?: string
  imageUrl?: string
  ctaText?: string
  ctaLink?: string
  vendor?: {
    id: string
    businessName: string
    slug: string
    profilePhotoUrl?: string
    category?: {
      id: string
      name: string
      slug: string
    }
  }
}

export interface PromotedAlbum {
  campaignId: string
  vendorProfileId: string
  albumId: string
  album: {
    id: string
    name: string
    description?: string
    coverImageUrl?: string
    mediaCount: number
    vendor: {
      id: string
      businessName: string
      slug: string
      profilePhotoUrl?: string
    }
  }
}

export interface BoostedVendor {
  vendorProfileId: string
  campaignId: string
  boostLevel: number
}
