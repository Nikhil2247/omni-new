import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CreateTimelineInput, Timeline, TimelineItem } from '../types/timeline.types'


export const timelineService = {
  async getByEvent(eventId: string) {
    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.USER.TIMELINE,
        { params: { eventId } },
      )
      
      // Unwrap response - backend returns { success, data, meta }
      const data = response.data?.data || response.data
      
      if (!data) return null

      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async createTimeline(input: CreateTimelineInput) {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.USER.TIMELINE,
      input,
    )
    
    // Unwrap response - backend returns { success, data, meta }
    const data = response.data?.data || response.data
    
    if (!data) return null

    return data
  },

  async deleteTimeline(id: string) {
    await apiClient.delete(API_ENDPOINTS.USER.TIMELINE_BY_ID(id))
  },

  async updateTimeline(id: string, updates: { name?: string; eventDate?: string }): Promise<Timeline> {
    const response = await apiClient.put<any>(
      `${API_ENDPOINTS.USER.TIMELINE}/${id}`,
      updates,
    )
    
    const data = response.data?.data || response.data

    return data
  },

  async addItem(timelineId: string, item: { title: string; description?: string; scheduledTime: string; duration?: number }): Promise<TimelineItem> {
    const response = await apiClient.post<any>(
      `${API_ENDPOINTS.USER.TIMELINE}/${timelineId}/items`,
      item,
    )
    return response.data?.data || response.data
  },

  async updateItem(timelineId: string, itemId: string, updates: { title?: string; description?: string; scheduledTime?: string; duration?: number; isCompleted?: boolean }): Promise<TimelineItem> {
    const response = await apiClient.put<any>(
      `${API_ENDPOINTS.USER.TIMELINE}/${timelineId}/items/${itemId}`,
      updates,
    )
    return response.data?.data || response.data
  },

  async deleteItem(timelineId: string, itemId: string): Promise<void> {
    await apiClient.delete(
      `${API_ENDPOINTS.USER.TIMELINE}/${timelineId}/items/${itemId}`,
    )
  },
}
