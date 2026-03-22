// ============================================================================
// ADMIN CLAIM TYPES
// ============================================================================
// Types for admin vendor claim management and approval workflow
// ============================================================================

import {
  ClaimStatus,
  ClaimVerificationMethod,
  VendorClaimResponse,
} from './vendor-claim.types'

// ============================================================================
// Filter Types
// ============================================================================

export interface AdminClaimFilterParams {
  status?: ClaimStatus
  vendorProfileId?: string
  userId?: string
  limit?: number
  offset?: number
}

// ============================================================================
// Response Types
// ============================================================================

export interface AdminClaimUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

export interface AdminClaimResponse extends VendorClaimResponse {
  user?: AdminClaimUser
}

export interface AdminClaimListResponse {
  claims: AdminClaimResponse[]
  total: number
  limit: number
  offset: number
}

export interface ClaimStatusCounts {
  pending: number
  verificationSent: number
  verified: number
  approved: number
  rejected: number
  expired: number
}

// ============================================================================
// Request Types
// ============================================================================

export interface ApproveClaimRequest {
  notes?: string
}

export interface RejectClaimRequest {
  reason: string
  internalNotes?: string
}

// ============================================================================
// Result Types
// ============================================================================

export interface ClaimApprovalResult {
  success: boolean
  message: string
  claim: AdminClaimResponse
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { ClaimStatus, ClaimVerificationMethod } from './vendor-claim.types'
