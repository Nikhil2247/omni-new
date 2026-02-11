import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type { VendorProfile, VendorSearchParams } from '../types/vendor.types'
import type { PortfolioMediaItem, PortfolioMediaSearchParams } from '../types/portfolio-media.types'
import type { BlogCategory, BlogPost, BlogPostSearchParams, BlogTag } from '../types/marketing.types'
import type { SystemStatusState } from '../types/system.types'
import type { VendorReview } from '../types/vendor-review.types'
import type { MediaTag } from '../types/media-tag.types'

export const publicService = {
  getVendors: async (
    params: VendorSearchParams = {},
  ): Promise<PaginatedResponse<VendorProfile>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.VENDORS, {
      params,
    })
    return data
  },

  getVendorBySlug: async (slug: string): Promise<VendorProfile> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.VENDOR(slug))
    // Backend wraps responses in { success, data, meta } format
    return data?.data || data
  },

  getFeatured: async (limit = 10): Promise<VendorProfile[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.FEATURED, {
      params: { limit },
    })
    // Backend wraps responses in { success, data, meta } format
    return data?.data || data
  },

  getDiscoveryMedia: async (
    params: PortfolioMediaSearchParams = {},
  ): Promise<PaginatedResponse<PortfolioMediaItem>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.MEDIA, {
      params,
    })
    return data
  },

  getByCategory: async (
    categoryId: string,
    limit = 20,
  ): Promise<VendorProfile[]> => {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PUBLIC.DISCOVERY.BY_CATEGORY(categoryId),
      { params: { limit } },
    )
    // Backend wraps responses in { success, data, meta } format
    return data?.data || data
  },

  getByCity: async (cityId: string, limit = 20): Promise<VendorProfile[]> => {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PUBLIC.DISCOVERY.BY_CITY(cityId),
      { params: { limit } },
    )
    // Backend wraps responses in { success, data, meta } format
    return data?.data || data
  },

  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.HEALTH)
    return data
  },

  getSystemStatus: async (): Promise<SystemStatusState> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.SYSTEM_STATUS)
    return data
  },

  getBlogPosts: async (
    params: BlogPostSearchParams = {},
  ): Promise<PaginatedResponse<BlogPost>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.BLOG.POSTS, { params })
    return data
  },

  getBlogPostBySlug: async (slug: string): Promise<BlogPost> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.BLOG.POST_BY_SLUG(slug))
    return data?.data || data
  },

  getBlogCategories: async (): Promise<BlogCategory[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.BLOG.CATEGORIES)
    return data
  },

  getBlogTags: async (): Promise<BlogTag[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.BLOG.TAGS)
    return data
  },

  getVendorReviews: async (vendorProfileId: string): Promise<VendorReview[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.VENDOR_REVIEWS(vendorProfileId))
    return data?.data || data
  },

  getMediaTags: async (query?: string): Promise<MediaTag[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.MEDIA_TAGS.LIST, { params: { query } })
    return data?.data || data
  },
}
