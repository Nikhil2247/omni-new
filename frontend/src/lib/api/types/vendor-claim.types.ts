// ============================================================================
// VENDOR CLAIM TYPES
// ============================================================================
// Types for vendor profile claim workflow and verification
// ============================================================================

// ============================================================================
// Enums
// ============================================================================

export type ClaimStatus =
  | 'PENDING'
  | 'VERIFICATION_SENT'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

export type ClaimVerificationMethod =
  | 'EMAIL'
  | 'PHONE'
  | 'DOCUMENT'
  | 'ADMIN_VERIFIED'

// ============================================================================
// Request Types
// ============================================================================

export interface InitiateClaimRequest {
  vendorProfileId: string
  verificationMethod: ClaimVerificationMethod
}

export interface VerifyClaimRequest {
  claimId: string
  verificationCode: string
}

// ============================================================================
// Response Types
// ============================================================================

export interface VendorClaimVendorProfile {
  id: string
  businessName: string
  slug: string
  contactEmail?: string | null
  contactPhone?: string | null
  status: string
}

export interface VendorClaimResponse {
  id: string
  vendorProfileId: string
  userId: string
  status: ClaimStatus
  verificationMethod: ClaimVerificationMethod
  verificationExpiry: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  createdAt: string
  updatedAt: string
  vendorProfile?: VendorClaimVendorProfile
}

export interface ClaimStatusResponse {
  hasClaim: boolean
  claim: VendorClaimResponse | null
  canClaim: boolean
  reason?: string
}

// ============================================================================
// Status Display Helpers
// ============================================================================

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  PENDING: 'Pending',
  VERIFICATION_SENT: 'Verification Sent',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
}

export const CLAIM_STATUS_COLORS: Record<ClaimStatus, string> = {
  PENDING: 'secondary',
  VERIFICATION_SENT: 'warning',
  VERIFIED: 'default',
  APPROVED: 'success',
  REJECTED: 'destructive',
  EXPIRED: 'secondary',
}

export const VERIFICATION_METHOD_LABELS: Record<ClaimVerificationMethod, string> = {
  EMAIL: 'Email Verification',
  PHONE: 'Phone Verification',
  DOCUMENT: 'Document Upload',
  ADMIN_VERIFIED: 'Admin Verified',
}

// ============================================================================
// GUEST CLAIM TYPES - For unauthenticated users
// ============================================================================

export interface InitiateGuestClaimRequest {
  vendorProfileId: string
  email: string
}

export interface VerifyGuestClaimRequest {
  vendorProfileId: string
  email: string
  verificationCode: string
}

export interface GuestClaimInitiatedResponse {
  success: boolean
  message: string
  maskedEmail: string
  expiresAt: string
}

export interface GuestClaimVerifiedResponse {
  success: boolean
  message: string
  userId: string
  vendorProfileId: string
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface CanGuestClaimResponse {
  canClaim: boolean
  reason?: string
  vendorName?: string
}
