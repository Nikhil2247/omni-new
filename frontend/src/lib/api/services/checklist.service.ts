import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  Checklist,
  CreateChecklistInput,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from '../types/checklist.types'

export const checklistService = {
  async getByEvent(eventId: string) {
    try {
      const response = await apiClient.get<Checklist | Checklist[]>(
        API_ENDPOINTS.USER.CHECKLISTS,
        { params: { eventId } },
      )
      const payload: any = response.data
      const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
      if (Array.isArray(data)) {
        return data[0] ?? null
      }
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async createChecklist(input: CreateChecklistInput) {
    const response = await apiClient.post<Checklist>(
      API_ENDPOINTS.USER.CHECKLISTS,
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async addItem(checklistId: string, input: CreateChecklistItemInput) {
    const response = await apiClient.post(
      API_ENDPOINTS.USER.CHECKLIST_ITEMS(checklistId),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async updateItem(itemId: string, input: UpdateChecklistItemInput) {
    const response = await apiClient.put(
      API_ENDPOINTS.USER.CHECKLIST_ITEM_BY_ID(itemId),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async deleteItem(itemId: string) {
    await apiClient.delete(API_ENDPOINTS.USER.CHECKLIST_ITEM_BY_ID(itemId))
  },
}
