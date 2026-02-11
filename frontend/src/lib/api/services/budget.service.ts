import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  Budget,
  CreateBudgetInput,
  CreateBudgetItemInput,
  UpdateBudgetInput,
  UpdateBudgetItemInput,
} from '../types/budget.types'

export const budgetService = {
  async getByEvent(eventId: string) {
    try {
      const response = await apiClient.get<Budget>(API_ENDPOINTS.USER.BUDGET, {
        params: { eventId },
      })
      const payload: any = response.data
      return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async createBudget(input: CreateBudgetInput) {
    const response = await apiClient.post<Budget>(
      API_ENDPOINTS.USER.BUDGET,
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async updateBudget(id: string, input: UpdateBudgetInput) {
    const response = await apiClient.put<Budget>(
      API_ENDPOINTS.USER.BUDGET_BY_ID(id),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async addItem(budgetId: string, input: CreateBudgetItemInput) {
    const response = await apiClient.post(
      API_ENDPOINTS.USER.BUDGET_ITEMS(budgetId),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async updateItem(itemId: string, input: UpdateBudgetItemInput) {
    const response = await apiClient.put(
      API_ENDPOINTS.USER.BUDGET_ITEM_BY_ID(itemId),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async deleteItem(itemId: string) {
    await apiClient.delete(API_ENDPOINTS.USER.BUDGET_ITEM_BY_ID(itemId))
  },
}
