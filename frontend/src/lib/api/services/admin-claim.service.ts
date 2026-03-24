// ============================================================================
// ADMIN CLAIM SERVICE
// ============================================================================
// Service layer for admin vendor claim management and approval workflow
// ============================================================================

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  AdminClaimResponse,
  AdminClaimFilterParams,
  AdminClaimListResponse,
  ClaimStatusCounts,
  ClaimApprovalResult,
  ApproveClaimRequest,
  RejectClaimRequest,
} from '../types/admin-claim.types'

// ============================================================================
// Admin Claim Service
// ============================================================================

export const adminClaimService = {
  /**
   * Get all claims with filters and pagination
   */
  getAllClaims: async (
    params: AdminClaimFilterParams = {}
  ): Promise<AdminClaimListResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CLAIMS.LIST, { params })
    // API returns { success, data: { claims, total, limit, offset }, meta }
    return data?.data ?? data
  },

  /**
   * Get claims pending review
   */
  getPendingClaims: async (): Promise<AdminClaimResponse[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CLAIMS.PENDING)
    return data?.data ?? data
  },

  /**
   * Get claim counts by status
   */
  getClaimCounts: async (): Promise<ClaimStatusCounts> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CLAIMS.COUNTS)
    return data?.data ?? data
  },

  /**
   * Get claim by ID
   */
  getClaimById: async (id: string): Promise<AdminClaimResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CLAIMS.BY_ID(id))
    return data?.data ?? data
  },

  /**
   * Approve a claim
   */
  approveClaim: async (
    id: string,
    payload?: ApproveClaimRequest
  ): Promise<ClaimApprovalResult> => {
    // Always send an object (even empty) to avoid validation pipe errors
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.CLAIMS.APPROVE(id), payload ?? {})
    return data?.data ?? data
  },

  /**
   * Reject a claim with reason
   */
  rejectClaim: async (
    id: string,
    payload: RejectClaimRequest
  ): Promise<ClaimApprovalResult> => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.CLAIMS.REJECT(id), payload)
    return data?.data ?? data
  },
}
