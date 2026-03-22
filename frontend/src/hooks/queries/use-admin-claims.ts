// ============================================================================
// ADMIN CLAIM HOOKS
// ============================================================================
// React Query hooks for admin vendor claim management and approval workflow
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminClaimService } from '@/lib/api/services/admin-claim.service'
import type {
  AdminClaimFilterParams,
  AdminClaimListResponse,
  AdminClaimResponse,
  ClaimStatusCounts,
  RejectClaimRequest,
} from '@/lib/api/types/admin-claim.types'

// ============================================================================
// Query Keys
// ============================================================================

export const adminClaimKeys = {
  all: ['admin-claims'] as const,
  list: (params?: AdminClaimFilterParams) => [...adminClaimKeys.all, 'list', params] as const,
  pending: () => [...adminClaimKeys.all, 'pending'] as const,
  counts: () => [...adminClaimKeys.all, 'counts'] as const,
  detail: (id: string) => [...adminClaimKeys.all, 'detail', id] as const,
}

// ============================================================================
// Query Option Types
// ============================================================================

type AdminClaimsOptions = Omit<
  UseQueryOptions<AdminClaimListResponse, Error>,
  'queryKey' | 'queryFn'
>

type AdminPendingClaimsOptions = Omit<
  UseQueryOptions<AdminClaimResponse[], Error>,
  'queryKey' | 'queryFn'
>

type AdminClaimCountsOptions = Omit<
  UseQueryOptions<ClaimStatusCounts, Error>,
  'queryKey' | 'queryFn'
>

type AdminClaimOptions = Omit<
  UseQueryOptions<AdminClaimResponse, Error>,
  'queryKey' | 'queryFn'
>

// ============================================================================
// Claim List Hooks
// ============================================================================

/**
 * Get all claims with filters and pagination
 */
export function useAdminClaims(
  params?: AdminClaimFilterParams,
  options?: AdminClaimsOptions
) {
  return useQuery({
    queryKey: adminClaimKeys.list(params),
    queryFn: () => adminClaimService.getAllClaims(params),
    ...options,
  })
}

/**
 * Get claims pending review
 */
export function useAdminPendingClaims(options?: AdminPendingClaimsOptions) {
  return useQuery({
    queryKey: adminClaimKeys.pending(),
    queryFn: () => adminClaimService.getPendingClaims(),
    ...options,
  })
}

/**
 * Get claim counts by status
 */
export function useAdminClaimCounts(options?: AdminClaimCountsOptions) {
  return useQuery({
    queryKey: adminClaimKeys.counts(),
    queryFn: () => adminClaimService.getClaimCounts(),
    ...options,
  })
}

/**
 * Get a single claim by ID
 */
export function useAdminClaim(id: string, options?: AdminClaimOptions) {
  return useQuery({
    queryKey: adminClaimKeys.detail(id),
    queryFn: () => adminClaimService.getClaimById(id),
    enabled: Boolean(id),
    ...options,
  })
}

// ============================================================================
// Claim Approval Mutations
// ============================================================================

/**
 * Approve a claim mutation
 */
export function useApproveClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      adminClaimService.approveClaim(id, notes ? { notes } : undefined),
    onSuccess: (data, variables) => {
      // Invalidate all related queries for proper cache refresh
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.all })
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.pending() })
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.counts() })
      toast.success(data.message || 'Claim approved successfully')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to approve claim'
      toast.error(msg)
    },
  })
}

/**
 * Reject a claim mutation
 */
export function useRejectClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectClaimRequest }) =>
      adminClaimService.rejectClaim(id, payload),
    onSuccess: (data, variables) => {
      // Invalidate all related queries for proper cache refresh
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.all })
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.pending() })
      queryClient.invalidateQueries({ queryKey: adminClaimKeys.counts() })
      toast.success(data.message || 'Claim rejected')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to reject claim'
      toast.error(msg)
    },
  })
}
