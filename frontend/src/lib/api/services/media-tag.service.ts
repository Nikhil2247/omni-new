import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { MediaTag, AddMediaTagsPayload, RemoveMediaTagPayload } from '../types/media-tag.types'

export const mediaTagService = {
  list: async (query?: string): Promise<MediaTag[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.MEDIA_TAGS.LIST, { params: { query } })
    return data?.data || data
  },
  listForMedia: async (mediaItemId: string): Promise<MediaTag[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.MEDIA_TAGS.MEDIA(mediaItemId))
    const links = data?.data || data
    return Array.isArray(links) ? links.map((item: any) => item.hashtag || item) : []
  },
  add: async (payload: AddMediaTagsPayload) => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.MEDIA_TAGS.ADD, payload)
    return data?.data || data
  },
  remove: async (payload: RemoveMediaTagPayload) => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.MEDIA_TAGS.REMOVE, payload)
    return data?.data || data
  },
}
