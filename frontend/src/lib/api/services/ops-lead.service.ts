import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type { CreateLeadMessagePayload, LeadResponse, LeadSearchParams, UpdateLeadPayload } from '../types/lead.types'

/**
 * Ops-specific Lead Service
 * For OPERATIONAL_ADMIN and OPERATIONAL_MANAGER roles
 * Access to all leads for conversion and management
 */
export const opsLeadService = {
  /**
   * Get all leads with search/filter
   * Used by ops admin to view and manage all leads
   */
  list: async (params: LeadSearchParams = {}): Promise<PaginatedResponse<LeadResponse>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.LEADS, { params })
    return data
  },

  /**
   * Get lead by ID with full details
   * Includes messages, event info, vendor profile
   */
  getById: async (id: string): Promise<LeadResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.LEAD_BY_ID(id))
    return data
  },

  /**
   * Update lead status
   * For marking as contacted, qualified, etc.
   */
  update: async (id: string, payload: UpdateLeadPayload): Promise<LeadResponse> => {
    const { data } = await apiClient.patch(API_ENDPOINTS.OPS.LEAD_BY_ID(id), payload)
    return data
  },

  /**
   * Send message to lead
   * For ops team to communicate with planners/vendors
   */
  sendMessage: async (leadId: string, payload: CreateLeadMessagePayload) => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.LEAD_MESSAGES(leadId), payload)
    return data
  },
}
