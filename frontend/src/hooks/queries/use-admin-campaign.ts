// ============================================================================
// ADMIN CAMPAIGN HOOKS
// ============================================================================
// React Query hooks for admin campaign management and approval workflow
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminCampaignService } from '@/lib/api/services/admin-campaign.service'
import type {
  AdminCampaignFilterParams,
  RejectCampaignRequest,
} from '@/lib/api/types/admin-campaign.types'

// ============================================================================
// Query Keys
// ============================================================================

export const adminCampaignKeys = {
  campaigns: (params: AdminCampaignFilterParams) => ['admin-campaigns', params] as const,
  campaign: (id: string) => ['admin-campaign', id] as const,
  pendingCampaigns: () => ['admin-campaigns-pending'] as const,
  campaignCounts: () => ['admin-campaign-counts'] as const,
  campaignStats: (id: string) => ['admin-campaign-stats', id] as const,
}

// ============================================================================
// Campaign List Hooks
// ============================================================================

/**
 * Get all campaigns with filters and pagination
 */
export function useAdminCampaigns(params: AdminCampaignFilterParams = {}) {
  return useQuery({
    queryKey: adminCampaignKeys.campaigns(params),
    queryFn: () => adminCampaignService.getAllCampaigns(params),
  })
}

/**
 * Get campaigns pending approval
 */
export function useAdminPendingCampaigns() {
  return useQuery({
    queryKey: adminCampaignKeys.pendingCampaigns(),
    queryFn: () => adminCampaignService.getPendingCampaigns(),
  })
}

/**
 * Get campaign counts by status
 */
export function useAdminCampaignCounts() {
  return useQuery({
    queryKey: adminCampaignKeys.campaignCounts(),
    queryFn: () => adminCampaignService.getCampaignCounts(),
  })
}

/**
 * Get a single campaign by ID
 */
export function useAdminCampaign(id: string) {
  return useQuery({
    queryKey: adminCampaignKeys.campaign(id),
    queryFn: () => adminCampaignService.getCampaignById(id),
    enabled: Boolean(id),
  })
}

/**
 * Get campaign statistics
 */
export function useAdminCampaignStats(id: string) {
  return useQuery({
    queryKey: adminCampaignKeys.campaignStats(id),
    queryFn: () => adminCampaignService.getCampaignStats(id),
    enabled: Boolean(id),
  })
}

// ============================================================================
// Campaign Approval Mutations
// ============================================================================

/**
 * Approve a campaign mutation
 */
export function useApproveCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminCampaignService.approveCampaign(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminCampaignKeys.campaign(id) })
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
      queryClient.invalidateQueries({ queryKey: adminCampaignKeys.pendingCampaigns() })
      queryClient.invalidateQueries({ queryKey: adminCampaignKeys.campaignCounts() })
      toast.success(data.message || 'Campaign approved successfully')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to approve campaign'
      toast.error(msg)
    },
  })
}

/**
 * Reject a campaign mutation
 */
export function useRejectCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectCampaignRequest }) =>
      adminCampaignService.rejectCampaign(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminCampaignKeys.campaign(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] })
      queryClient.invalidateQueries({ queryKey: adminCampaignKeys.pendingCampaigns() })
      queryClient.invalidateQueries({ queryKey: adminCampaignKeys.campaignCounts() })
      toast.success(data.message || 'Campaign rejected')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to reject campaign'
      toast.error(msg)
    },
  })
}
