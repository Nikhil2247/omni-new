import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadService } from '@/lib/api/services/lead.service'
import { opsLeadService } from '@/lib/api/services/ops-lead.service'
import type { CreateLeadMessagePayload, CreateLeadPayload, LeadSearchParams, UpdateLeadPayload } from '@/lib/api/types/lead.types'

const leadKeys = {
  all: ['leads'] as const,
  list: (params: LeadSearchParams) => [...leadKeys.all, 'list', params] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
}

export function useCreateLead() {
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadService.create(payload),
  })
}

export function useUserLeads(params: LeadSearchParams) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => leadService.list(params),
    enabled: Boolean(params.plannerId),
  })
}

export function useLeadDetail(leadId: string) {
  return useQuery({
    queryKey: leadKeys.detail(leadId),
    queryFn: () => leadService.getById(leadId),
    enabled: Boolean(leadId),
  })
}

export function useSendLeadMessage(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLeadMessagePayload) => leadService.sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    },
  })
}

// ============================================================================
// OPS-SPECIFIC HOOKS - For OPERATIONAL_ADMIN & OPERATIONAL_MANAGER
// ============================================================================

/**
 * Ops: Fetch all leads with search/filter
 * Used by ops admin to view and manage all leads
 */
export function useOpsLeads(params: LeadSearchParams = {}) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => opsLeadService.list(params),
    staleTime: 30_000,
  })
}

/**
 * Ops: Get lead detail by ID
 * Used by ops team to view full lead details
 */
export function useOpsLeadDetail(leadId: string) {
  return useQuery({
    queryKey: leadKeys.detail(leadId),
    queryFn: () => opsLeadService.getById(leadId),
    enabled: !!leadId,
  })
}

/**
 * Ops: Update lead status
 * Used to mark leads as contacted, qualified, etc.
 */
export function useUpdateOpsLead(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateLeadPayload) => opsLeadService.update(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

/**
 * Ops: Send message to lead
 * Used by ops team to communicate with planners/vendors
 */
export function useSendOpsLeadMessage(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLeadMessagePayload) => opsLeadService.sendMessage(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    },
  })
}

