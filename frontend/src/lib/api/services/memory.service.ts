import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CreateMemoryInput, EventMemory } from '../types/memory.types'

export const memoryService = {
  async getByEvent(eventId: string) {
    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.USER.MEMORIES,
        { params: { eventId } },
      )
      // Unwrap backend response format: { success: true, data: {...} }
      return (response.data?.data || response.data) as EventMemory | null
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async createMemory(input: CreateMemoryInput) {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.USER.MEMORIES,
      input,
    )
    // Unwrap backend response format: { success: true, data: {...} }
    return (response.data?.data || response.data) as EventMemory
  },

  async deleteMemory(id: string) {
    await apiClient.delete(API_ENDPOINTS.USER.MEMORY_BY_ID(id))
  },
}
