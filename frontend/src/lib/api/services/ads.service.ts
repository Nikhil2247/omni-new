import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  FeaturedListing,
  BannerAd,
  PromotedAlbum,
  BoostedVendor,
  BannerPlacement,
  ConversionType,
} from '../types/ads.types'

export const adsService = {
  /**
   * Get featured vendor listings for homepage
   */
  getFeaturedListings: async (limit = 8): Promise<FeaturedListing[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.ADS.FEATURED, {
      params: { limit },
    })
    return data?.listings || data?.data?.listings || []
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
    return data?.listings || data?.data?.listings || []
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
    return data?.banners || data?.data?.banners || []
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
    return data?.albums || data?.data?.albums || []
  },

  /**
   * Get list of boosted vendor IDs for search prioritization
   */
  getBoostedVendors: async (): Promise<BoostedVendor[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.ADS.BOOSTED_VENDORS)
    return data?.vendors || data?.data?.vendors || []
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
