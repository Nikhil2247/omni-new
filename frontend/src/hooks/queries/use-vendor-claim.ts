// ============================================================================
// VENDOR CLAIM HOOKS
// ============================================================================
// React Query hooks for vendor profile claiming workflow
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { vendorClaimService } from '@/lib/api/services/vendor-claim.service'
import type {
  ClaimStatusResponse,
  InitiateClaimRequest,
  VerifyClaimRequest,
  VendorClaimResponse,
  InitiateGuestClaimRequest,
  ResendGuestVerificationRequest,
  VerifyGuestClaimRequest,
  GuestClaimInitiatedResponse,
  GuestClaimVerifiedResponse,
  CanGuestClaimResponse,
} from '@/lib/api/types/vendor-claim.types'

// ============================================================================
// Query Keys
// ============================================================================

export const vendorClaimKeys = {
  all: ['vendor-claims'] as const,
  status: (vendorProfileId: string) => [...vendorClaimKeys.all, 'status', vendorProfileId] as const,
  myClaims: () => [...vendorClaimKeys.all, 'my-claims'] as const,
  canGuestClaim: (vendorProfileId: string) => [...vendorClaimKeys.all, 'can-guest-claim', vendorProfileId] as const,
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get claim status for a specific vendor profile
 */
export function useClaimStatus(vendorProfileId: string, options?: { enabled?: boolean }) {
  return useQuery<ClaimStatusResponse>({
    queryKey: vendorClaimKeys.status(vendorProfileId),
    queryFn: () => vendorClaimService.getClaimStatus(vendorProfileId),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!vendorProfileId,
  })
}

/**
 * Get all claims for the current user
 */
export function useMyClaims(options?: { enabled?: boolean }) {
  return useQuery<VendorClaimResponse[]>({
    queryKey: vendorClaimKeys.myClaims(),
    queryFn: () => vendorClaimService.getMyClaims(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Initiate a vendor claim
 */
export function useInitiateClaim() {
  const queryClient = useQueryClient()
  return useMutation<VendorClaimResponse, Error, InitiateClaimRequest>({
    mutationFn: (payload) => vendorClaimService.initiateClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorClaimKeys.myClaims() })
      toast.success('Claim initiated successfully. Please check your email for verification.')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to initiate claim'
      toast.error(msg)
    },
  })
}

/**
 * Verify a vendor claim with the verification code
 */
export function useVerifyClaim() {
  const queryClient = useQueryClient()
  return useMutation<VendorClaimResponse, Error, VerifyClaimRequest & { vendorProfileId?: string }>({
    mutationFn: ({ claimId, verificationCode }) =>
      vendorClaimService.verifyClaim({ claimId, verificationCode }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorClaimKeys.myClaims() })
      if (variables.vendorProfileId) {
        queryClient.invalidateQueries({ queryKey: vendorClaimKeys.status(variables.vendorProfileId) })
      }
      // Invalidate all status queries as we may not have the vendorProfileId
      queryClient.invalidateQueries({ queryKey: vendorClaimKeys.all })
      toast.success('Claim verified successfully!')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to verify claim'
      toast.error(msg)
    },
  })
}

/**
 * Resend verification code for a claim
 */
export function useResendVerification() {
  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (claimId) => vendorClaimService.resendVerification(claimId),
    onSuccess: (data) => {
      toast.success(data.message || 'Verification code resent successfully')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification code'
      toast.error(msg)
    },
  })
}

// ============================================================================
// Guest Claim Hooks (No authentication required)
// ============================================================================

/**
 * Check if a vendor can be claimed by a guest
 */
export function useCanGuestClaim(vendorProfileId: string, options?: { enabled?: boolean }) {
  return useQuery<CanGuestClaimResponse>({
    queryKey: vendorClaimKeys.canGuestClaim(vendorProfileId),
    queryFn: () => vendorClaimService.canGuestClaim(vendorProfileId),
    staleTime: 60_000,
    enabled: (options?.enabled ?? true) && !!vendorProfileId,
  })
}

/**
 * Initiate a guest claim
 */
export function useInitiateGuestClaim() {
  const queryClient = useQueryClient()
  return useMutation<GuestClaimInitiatedResponse, Error, InitiateGuestClaimRequest>({
    mutationFn: (payload) => vendorClaimService.initiateGuestClaim(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorClaimKeys.canGuestClaim(variables.vendorProfileId) })
      toast.success(data.message || 'Verification code sent to your email')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to initiate claim'
      toast.error(msg)
    },
  })
}

/**
 * Verify guest claim and create user account
 */
export function useVerifyGuestClaim() {
  const queryClient = useQueryClient()
  return useMutation<GuestClaimVerifiedResponse, Error, VerifyGuestClaimRequest>({
    mutationFn: (payload) => vendorClaimService.verifyGuestClaim(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorClaimKeys.all })
      toast.success(data.message || 'Business claimed successfully!')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to verify claim'
      toast.error(msg)
    },
  })
}

/**
 * Resend guest claim verification code
 */
export function useResendGuestVerification() {
  return useMutation<GuestClaimInitiatedResponse, Error, ResendGuestVerificationRequest>({
    mutationFn: (payload) => vendorClaimService.resendGuestVerification(payload),
    onSuccess: (data) => {
      toast.success(data.message || 'New verification code sent')
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification code'
      toast.error(msg)
    },
  })
}
