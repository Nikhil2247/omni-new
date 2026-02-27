import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type { VendorProfile, VendorSearchParams } from '../types/vendor.types'
import type { PortfolioMediaItem, PortfolioMediaSearchParams } from '../types/portfolio-media.types'
import type { BlogCategory, BlogPost, BlogPostSearchParams, BlogTag } from '../types/marketing.types'
import type { SystemStatusState } from '../types/system.types'
import type { VendorReview } from '../types/vendor-review.types'
import type { MediaTag } from '../types/media-tag.types'
import { getMinioViewUrl } from '@/lib/utils/minio'

const resolveMediaUrl = (value?: string | null): string | null | undefined => {
  if (value == null) {
    return value
  }
  return getMinioViewUrl(value) || value
}

const normalizePortfolioMediaItem = <T extends {
  url?: string | null
  thumbnailUrl?: string | null
  cdnUrl?: string | null
}>(item: T): T => ({
  ...item,
  url: resolveMediaUrl(item.url) ?? item.url,
  thumbnailUrl: resolveMediaUrl(item.thumbnailUrl) ?? item.thumbnailUrl,
  cdnUrl: resolveMediaUrl(item.cdnUrl) ?? item.cdnUrl,
})

type VendorPortfolioMedia = {
  url?: string | null
  thumbnailUrl?: string | null
  cdnUrl?: string | null
}

type VendorPortfolio = {
  mediaItems?: VendorPortfolioMedia[] | null
}

type VendorWithPortfolios = VendorProfile & {
  portfolios?: VendorPortfolio[]
}

const normalizeVendor = (vendor: VendorProfile): VendorProfile => {
  const vendorWithPortfolios = vendor as VendorWithPortfolios

  return {
    ...vendor,
    profilePhotoUrl: resolveMediaUrl(vendor.profilePhotoUrl) ?? vendor.profilePhotoUrl,
    bannerImageUrl: resolveMediaUrl(vendor.bannerImageUrl) ?? vendor.bannerImageUrl,
    portfolios: Array.isArray(vendorWithPortfolios.portfolios)
      ? vendorWithPortfolios.portfolios.map((portfolio) => ({
          ...portfolio,
          mediaItems: Array.isArray(portfolio?.mediaItems)
            ? portfolio.mediaItems.map((item) => normalizePortfolioMediaItem(item))
            : portfolio?.mediaItems,
        }))
      : vendorWithPortfolios.portfolios,
  } as VendorProfile
}

const normalizeDiscoveryMedia = (item: PortfolioMediaItem): PortfolioMediaItem => ({
  ...item,
  url: resolveMediaUrl(item.url) || item.url,
  thumbnailUrl: resolveMediaUrl(item.thumbnailUrl) ?? item.thumbnailUrl,
  cdnUrl: resolveMediaUrl(item.cdnUrl) ?? item.cdnUrl,
})

const normalizeBlogPost = (post: BlogPost): BlogPost => ({
  ...post,
  featuredImage: resolveMediaUrl(post.featuredImage) ?? post.featuredImage,
  ogImage: resolveMediaUrl(post.ogImage) ?? post.ogImage,
})

const normalizePaginated = <T>(
  response: PaginatedResponse<T>,
  mapper: (item: T) => T,
): PaginatedResponse<T> => {
  if (!response?.data || !Array.isArray(response.data)) {
    return response
  }

  return {
    ...response,
    data: response.data.map(mapper),
  }
}

export const publicService = {
  getVendors: async (
    params: VendorSearchParams = {},
  ): Promise<PaginatedResponse<VendorProfile>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.VENDORS, {
      params,
    })
    return normalizePaginated(data, normalizeVendor)
  },

  getVendorBySlug: async (slug: string): Promise<VendorProfile> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.VENDOR(slug))
    // Backend wraps responses in { success, data, meta } format
    return normalizeVendor(data?.data || data)
  },

  getFeatured: async (limit = 10): Promise<VendorProfile[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.FEATURED, {
      params: { limit },
    })
    // Backend wraps responses in { success, data, meta } format
    return (data?.data || data).map(normalizeVendor)
  },

  getDiscoveryMedia: async (
    params: PortfolioMediaSearchParams = {},
  ): Promise<PaginatedResponse<PortfolioMediaItem>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.DISCOVERY.MEDIA, {
      params,
    })
    return normalizePaginated(data, normalizeDiscoveryMedia)
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
    return (data?.data || data).map(normalizeVendor)
  },

  getByCity: async (cityId: string, limit = 20): Promise<VendorProfile[]> => {
    const { data } = await apiClient.get(
      API_ENDPOINTS.PUBLIC.DISCOVERY.BY_CITY(cityId),
      { params: { limit } },
    )
    // Backend wraps responses in { success, data, meta } format
    return (data?.data || data).map(normalizeVendor)
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
    return normalizePaginated(data, normalizeBlogPost)
  },

  getBlogPostBySlug: async (slug: string): Promise<BlogPost> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.BLOG.POST_BY_SLUG(slug))
    return normalizeBlogPost(data?.data || data)
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
