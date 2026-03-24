import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type { VendorProfile, VendorSearchParams } from '../types/vendor.types'
import type { PortfolioMediaItem, PortfolioMediaSearchParams } from '../types/portfolio-media.types'
import type { BlogCategory, BlogPost, BlogPostSearchParams, BlogTag } from '../types/marketing.types'
import type { SystemStatusState } from '../types/system.types'
import type { VendorReview } from '../types/vendor-review.types'
import type { MediaTag } from '../types/media-tag.types'
import type { ConsentDefinition, ConsentDefinitionsResponse, ConsentType } from '../types/business.types'
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

const toPaginatedResponse = <T>(
  payload: unknown,
): PaginatedResponse<T> => {
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return payload as PaginatedResponse<T>
  }

  if (Array.isArray(payload)) {
    const data = payload as T[]
    return {
      data,
      meta: {
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: data.length > 0 ? 1 : 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
  }

  return {
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
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
    // Supports both shapes:
    // 1) { success, data: [...], meta }
    // 2) { success, data: { data: [...], meta }, meta }
    // 3) { data: [...], meta }
    const envelopeData = data?.data
    const paginatedLike =
      envelopeData &&
      typeof envelopeData === 'object' &&
      Array.isArray(envelopeData.data)
        ? envelopeData
        : data

    const normalizedPaginated = toPaginatedResponse<PortfolioMediaItem>(
      paginatedLike,
    )
    return normalizePaginated(normalizedPaginated, normalizeDiscoveryMedia)
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

  // ==================== CONSENT DEFINITIONS ====================
  getUserConsentDefinitions: async (): Promise<ConsentDefinitionsResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.CONSENTS.DEFINITIONS_USERS)
    return data?.data || data
  },

  getVendorConsentDefinitions: async (): Promise<ConsentDefinitionsResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.CONSENTS.DEFINITIONS_VENDORS)
    return data?.data || data
  },

  getRequiredConsentDefinitions: async (type: 'user' | 'vendor' = 'user'): Promise<ConsentDefinition[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.CONSENTS.DEFINITIONS_REQUIRED, {
      params: { type },
    })
    return data?.data || data
  },

  getConsentDefinitionByType: async (consentType: ConsentType, version?: string): Promise<ConsentDefinition> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.CONSENTS.DEFINITION_BY_TYPE(consentType), {
      params: version ? { version } : undefined,
    })
    return data?.data || data
  },

  getConsentDefinitionById: async (id: string): Promise<ConsentDefinition> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.CONSENTS.DEFINITION_BY_ID(id))
    return data?.data || data
  },
}
