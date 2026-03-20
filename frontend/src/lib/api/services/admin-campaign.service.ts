// ============================================================================
// ADMIN CAMPAIGN SERVICE
// ============================================================================
// Service layer for admin campaign management and approval workflow
// ============================================================================

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  AdminCampaign,
  AdminCampaignFilterParams,
  AdminCampaignListResponse,
  CampaignStatusCounts,
  CampaignApprovalResult,
  CampaignStats,
  RejectCampaignRequest,
} from '../types/admin-campaign.types'

// ============================================================================
// Admin Campaign Service
// ============================================================================

export const adminCampaignService = {
  /**
   * Get all campaigns with filters and pagination
   */
  getAllCampaigns: async (
    params: AdminCampaignFilterParams = {}
  ): Promise<AdminCampaignListResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CAMPAIGNS.LIST, { params })
    return data
  },

  /**
   * Get campaigns pending approval
   */
  getPendingCampaigns: async (): Promise<AdminCampaign[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CAMPAIGNS.PENDING)
    return data?.data ?? data
  },

  /**
   * Get campaign counts by status
   */
  getCampaignCounts: async (): Promise<CampaignStatusCounts> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CAMPAIGNS.COUNTS)
    return data?.data ?? data
  },

  /**
   * Get campaign by ID
   */
  getCampaignById: async (id: string): Promise<AdminCampaign> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CAMPAIGNS.BY_ID(id))
    return data?.data ?? data
  },

  /**
   * Get campaign statistics
   */
  getCampaignStats: async (id: string): Promise<CampaignStats> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CAMPAIGNS.STATS(id))
    return data?.data ?? data
  },

  /**
   * Approve a campaign
   */
  approveCampaign: async (id: string): Promise<CampaignApprovalResult> => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.CAMPAIGNS.APPROVE(id))
    return data?.data ?? data
  },

  /**
   * Reject a campaign with reason
   */
  rejectCampaign: async (
    id: string,
    payload: RejectCampaignRequest
  ): Promise<CampaignApprovalResult> => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.CAMPAIGNS.REJECT(id), payload)
    return data?.data ?? data
  },
}
