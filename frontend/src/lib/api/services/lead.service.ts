import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type { CreateLeadMessagePayload, CreateLeadPayload, LeadResponse, LeadSearchParams } from '../types/lead.types'

export const leadService = {
  create: async (payload: CreateLeadPayload): Promise<LeadResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.INTERACTIONS.LEADS, payload)
    return data?.data || data
  },
  list: async (params: LeadSearchParams = {}): Promise<PaginatedResponse<LeadResponse>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.INTERACTIONS.LEADS, { params })
    return data?.data || data
  },
  getById: async (id: string): Promise<LeadResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.INTERACTIONS.LEAD_BY_ID(id))
    return data?.data || data
  },
  sendMessage: async (payload: CreateLeadMessagePayload) => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.INTERACTIONS.MESSAGES, payload)
    return data?.data || data
  },
}
