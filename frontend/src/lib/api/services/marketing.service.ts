import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type {
  BlogPost,
  BlogPostCreatePayload,
  BlogPostSearchParams,
  BlogPostUpdatePayload,
  MarketingCampaign,
  MarketingCategory,
  MarketingMediaItem,
  MarketingPromotion,
} from '../types/marketing.types'

export const marketingService = {
  listCampaigns: async (): Promise<MarketingCampaign[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.MARKETING.CAMPAIGNS)
    return data?.data ?? data ?? []
  },
  listCategories: async (): Promise<MarketingCategory[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.MARKETING.CATEGORIES)
    return data?.data ?? data ?? []
  },
  listMedia: async (): Promise<MarketingMediaItem[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.MARKETING.MEDIA)
    return data?.data ?? data ?? []
  },
  listPromotions: async (): Promise<MarketingPromotion[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.MARKETING.PROMOTIONS)
    return data?.data ?? data ?? []
  },
  searchBlogPosts: async (params: BlogPostSearchParams = {}): Promise<PaginatedResponse<BlogPost>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.MARKETING.CONTENT.POSTS, { params })
    return data?.data ? data : data
  },
  getBlogPost: async (id: string): Promise<BlogPost> => {
    const { data } = await apiClient.get(API_ENDPOINTS.MARKETING.CONTENT.POST_BY_ID(id))
    return data?.data ?? data
  },
  createBlogPost: async (payload: BlogPostCreatePayload): Promise<BlogPost> => {
    const { data } = await apiClient.post(API_ENDPOINTS.MARKETING.CONTENT.POSTS, payload)
    return data?.data ?? data
  },
  updateBlogPost: async (id: string, payload: BlogPostUpdatePayload): Promise<BlogPost> => {
    const { data } = await apiClient.put(API_ENDPOINTS.MARKETING.CONTENT.POST_BY_ID(id), payload)
    return data?.data ?? data
  },
  deleteBlogPost: async (id: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.MARKETING.CONTENT.POST_BY_ID(id))
    return data?.data ?? data
  },
  publishBlogPost: async (id: string): Promise<BlogPost> => {
    const { data } = await apiClient.post(API_ENDPOINTS.MARKETING.CONTENT.PUBLISH_POST(id))
    return data?.data ?? data
  },
  uploadBlogImage: async (file: File): Promise<{ path: string; url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post(API_ENDPOINTS.MARKETING.CONTENT.UPLOAD_IMAGE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data?.data ?? data
  },
}
