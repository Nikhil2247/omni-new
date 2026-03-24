// ============================================================================
// VENDOR CLAIM SERVICE - API Services
// ============================================================================
// Service layer for vendor profile claim workflow and verification
// ============================================================================

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  InitiateClaimRequest,
  VerifyClaimRequest,
  VendorClaimResponse,
  ClaimStatusResponse,
  InitiateGuestClaimRequest,
  ResendGuestVerificationRequest,
  VerifyGuestClaimRequest,
  GuestClaimInitiatedResponse,
  GuestClaimVerifiedResponse,
  CanGuestClaimResponse,
} from '../types/vendor-claim.types'

// ============================================================================
// Vendor Claim Service
// ============================================================================

export const vendorClaimService = {
  /**
   * Initiate a claim for an UNCLAIMED vendor profile
   */
  initiateClaim: async (payload: InitiateClaimRequest): Promise<VendorClaimResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.INITIATE, payload)
    return data?.data || data
  },

  /**
   * Verify claim with verification code
   */
  verifyClaim: async (payload: VerifyClaimRequest): Promise<VendorClaimResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.VERIFY, payload)
    return data?.data || data
  },

  /**
   * Get claim status for a specific vendor profile
   */
  getClaimStatus: async (vendorProfileId: string): Promise<ClaimStatusResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.STATUS(vendorProfileId))
    return data?.data || data
  },

  /**
   * Get all claims for the current user
   */
  getMyClaims: async (): Promise<VendorClaimResponse[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.MY_CLAIMS)
    return data?.data || data || []
  },

  /**
   * Resend verification code
   */
  resendVerification: async (claimId: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.RESEND(claimId))
    return data?.data || data
  },

  // ============================================================================
  // Guest Claim Methods (No authentication required)
  // ============================================================================

  /**
   * Check if a vendor can be claimed by a guest
   */
  canGuestClaim: async (vendorProfileId: string): Promise<CanGuestClaimResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.CAN_CLAIM(vendorProfileId))
    return data?.data || data
  },

  /**
   * Initiate a guest claim (no auth required)
   * Sends verification code to the provided email
   */
  initiateGuestClaim: async (payload: InitiateGuestClaimRequest): Promise<GuestClaimInitiatedResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.INITIATE_GUEST, payload)
    return data?.data || data
  },

  /**
   * Verify guest claim and create user account
   * Returns auth tokens so user is immediately logged in
   */
  verifyGuestClaim: async (payload: VerifyGuestClaimRequest): Promise<GuestClaimVerifiedResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.VERIFY_GUEST, payload)
    return data?.data || data
  },

  /**
   * Resend guest claim verification code
   */
  resendGuestVerification: async (payload: ResendGuestVerificationRequest): Promise<GuestClaimInitiatedResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.VENDOR_CLAIM.RESEND_GUEST, payload)
    return data?.data || data
  },
}
