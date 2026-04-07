export type BannerPlacement = 'homepage' | 'category' | 'search' | 'profile'
export type ConversionType = 'LEAD' | 'BOOKING' | 'INQUIRY'

export interface FeaturedListing {
  vendorProfileId: string
  campaignId: string
  businessName: string
  slug: string
  categoryId: string
  profilePhotoUrl?: string
  tagline?: string
  averageRating?: number
  totalReviews: number
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
  portfolioId: string
  title: string
  coverImageUrl?: string
  businessName: string
  vendorSlug: string
}

export interface BoostedVendor {
  vendorProfileId: string
  campaignId: string
  boostScore: number
  businessName?: string
  slug?: string
  profilePhotoUrl?: string
  tagline?: string
  averageRating?: number
  totalReviews?: number
}
