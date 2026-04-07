import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import { getMinioViewUrl } from '@/lib/utils/minio'
import type {
  FeaturedListing,
  BannerAd,
  PromotedAlbum,
  BoostedVendor,
  BannerPlacement,
  ConversionType,
} from '../types/ads.types'

const resolveMediaUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined
  return getMinioViewUrl(value) || value
}

export const adsService = {
  /**
   * Get featured vendor listings for homepage
   */
  getFeaturedListings: async (limit = 8): Promise<FeaturedListing[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.ADS.FEATURED, {
      params: { limit },
    })
    const listings = data?.listings || data?.data?.listings || []
    return listings.map((listing: FeaturedListing) => ({
      ...listing,
      profilePhotoUrl: resolveMediaUrl(listing.profilePhotoUrl),
    }))
  },

  /**
   * Get featured vendor listings by category
   */
  getFeaturedByCategory: async (
    categoryId: string,
    limit = 4,
  ): Promise<FeaturedListing[]> => {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PUBLIC.ADS.FEATURED_BY_CATEGORY(categoryId),
      { params: { limit } },
    )
    const listings = data?.listings || data?.data?.listings || []
    return listings.map((listing: FeaturedListing) => ({
      ...listing,
      profilePhotoUrl: resolveMediaUrl(listing.profilePhotoUrl),
    }))
  },

  /**
   * Get banner ads for a specific placement
   */
  getBannerAds: async (
    placement: BannerPlacement = 'homepage',
    categoryId?: string,
    limit = 3,
  ): Promise<BannerAd[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.ADS.BANNERS, {
      params: { placement, categoryId, limit },
    })
    const banners = data?.banners || data?.data?.banners || []
    return banners.map((banner: BannerAd) => ({
      ...banner,
      bannerImageUrl: resolveMediaUrl(banner.bannerImageUrl),
      imageUrl: resolveMediaUrl(banner.imageUrl),
      vendor: banner.vendor
        ? {
            ...banner.vendor,
            profilePhotoUrl: resolveMediaUrl(banner.vendor.profilePhotoUrl),
          }
        : banner.vendor,
    }))
  },

  /**
   * Record a banner ad click
   */
  recordBannerClick: async (campaignId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.PUBLIC.ADS.BANNER_CLICK(campaignId))
  },

  /**
   * Get promoted albums for discover page
   */
  getPromotedAlbums: async (limit = 6): Promise<PromotedAlbum[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.ADS.ALBUMS, {
      params: { limit },
    })
    const albums = data?.albums || data?.data?.albums || []
    return albums.map((album: PromotedAlbum) => ({
      ...album,
      coverImageUrl: resolveMediaUrl(album.coverImageUrl),
    }))
  },

  /**
   * Get list of boosted vendor IDs for search prioritization
   */
  getBoostedVendors: async (): Promise<BoostedVendor[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.ADS.BOOSTED_VENDORS)
    const vendors = data?.vendors || data?.data?.vendors || []
    return vendors.map((vendor: BoostedVendor) => ({
      ...vendor,
      profilePhotoUrl: resolveMediaUrl(vendor.profilePhotoUrl),
    }))
  },

  /**
   * Check if a specific vendor is boosted
   */
  isVendorBoosted: async (vendorProfileId: string): Promise<boolean> => {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PUBLIC.ADS.IS_BOOSTED(vendorProfileId),
    )
    return data?.isBoosted || data?.data?.isBoosted || false
  },

  /**
   * Record impression on boosted profile
   */
  recordBoostImpression: async (campaignId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.PUBLIC.ADS.BOOST_IMPRESSION(campaignId))
  },

  /**
   * Record click on boosted profile
   */
  recordBoostClick: async (campaignId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.PUBLIC.ADS.BOOST_CLICK(campaignId))
  },

  /**
   * Record a conversion event (lead, booking, inquiry)
   */
  recordConversion: async (
    vendorProfileId: string,
    type: ConversionType,
  ): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.PUBLIC.ADS.CONVERSION, {
      vendorProfileId,
      type,
    })
  },
}
