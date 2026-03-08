import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { opsService } from '@/lib/api/services/ops.service'
import { opsTeamService } from '@/lib/api/services/ops-team.service'
import type {
  OpsActiveEvent,
  OpsOperationalTask,
  OpsDispute,
  OpsKycRecord,
  OpsRequirementSheet,
  OpsVendorAgreement,
  OpsInvoice,
  OpsInvoicesListResponse,
  OpsVendorProfile,
  OpsSupportTicket,
  LeadConversionRequest,
  CreateActiveEventRequest,
  UpdateActiveEventRequest,
  CreateOperationalTaskRequest,
  UpdateOperationalTaskRequest,
  CreateRequirementSheetRequest,
  CreateRequirementItemRequest,
  CreateVendorAgreementRequest,
  UpdateVendorAgreementRequest,
  CreateDisputeRequest,
} from '@/lib/api/types/ops.types'

export const opsKeys = {
  all: ['ops'] as const,
  events: () => [...opsKeys.all, 'events'] as const,
  event: (id: string) => [...opsKeys.events(), id] as const,
  tasks: () => [...opsKeys.all, 'tasks'] as const,
  task: (id: string) => [...opsKeys.tasks(), id] as const,
  disputes: () => [...opsKeys.all, 'disputes'] as const,
  dispute: (id: string) => [...opsKeys.disputes(), id] as const,
  kycList: () => [...opsKeys.all, 'kyc-list'] as const,
  kyc: (vendorProfileId: string) => [...opsKeys.all, 'kyc', vendorProfileId] as const,
  kycById: (id: string) => [...opsKeys.all, 'kyc', 'id', id] as const,
  requirements: (activeEventId: string) => [...opsKeys.all, 'requirements', activeEventId] as const,
  agreements: (activeEventId: string) => [...opsKeys.all, 'agreements', activeEventId] as const,
  invoices: (vendorAgreementId: string) => [...opsKeys.all, 'invoices', vendorAgreementId] as const,
  allInvoices: (params?: { status?: string; activeEventId?: string; page?: number; limit?: number }) => [...opsKeys.all, 'all-invoices', params || {}] as const,
  vendors: () => [...opsKeys.all, 'vendors'] as const,
  vendor: (id: string) => [...opsKeys.vendors(), id] as const,
  support: () => [...opsKeys.all, 'support'] as const,
  team: {
    managers: () => [...opsKeys.all, 'team', 'managers'] as const,
    assistants: () => [...opsKeys.all, 'team', 'assistants'] as const,
    overview: () => [...opsKeys.all, 'team', 'overview'] as const,
  },
}

export function useOpsActiveEvents(params?: Record<string, unknown>) {
  return useQuery<OpsActiveEvent[]>({
    queryKey: [...opsKeys.events(), params || {}],
    queryFn: async () => {
      const response = await opsService.getActiveEvents(params)
      return response.data
    },
    staleTime: 30_000,
  })
}

export function useOpsActiveEvent(id: string) {
  return useQuery<OpsActiveEvent>({
    queryKey: opsKeys.event(id),
    queryFn: async () => {
      const response = await opsService.getActiveEventById(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useOpsOperationalTasks(params?: Record<string, unknown>) {
  return useQuery<OpsOperationalTask[]>({
    queryKey: [...opsKeys.tasks(), params || {}],
    queryFn: async () => {
      const response = await opsService.getOperationalTasks(params)
      return response.data
    },
    staleTime: 30_000,
  })
}

export function useOpsOperationalTask(id: string) {
  return useQuery<OpsOperationalTask>({
    queryKey: opsKeys.task(id),
    queryFn: async () => {
      const response = await opsService.getOperationalTaskById(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useOpsDisputes(params?: Record<string, unknown>) {
  return useQuery<OpsDispute[]>({
    queryKey: [...opsKeys.disputes(), params || {}],
    queryFn: async () => {
      const response = await opsService.getDisputes(params)
      return response.data
    },
  })
}

export function useOpsDispute(id: string) {
  return useQuery<OpsDispute>({
    queryKey: opsKeys.dispute(id),
    queryFn: async () => {
      const response = await opsService.getDisputeById(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useOpsKycByVendor(vendorProfileId: string) {
  return useQuery<OpsKycRecord | null>({
    queryKey: opsKeys.kyc(vendorProfileId),
    queryFn: async () => {
      const response = await opsService.getKycByVendor(vendorProfileId)
      return response.data
    },
    enabled: !!vendorProfileId,
  })
}

export function useOpsKycById(id: string) {
  return useQuery<OpsKycRecord>({
    queryKey: opsKeys.kycById(id),
    queryFn: async () => {
      const response = await opsService.getKycById(id)
      return response.data
    },
    enabled: !!id,
  })
}

export function useOpsRequirements(activeEventId: string) {
  return useQuery<OpsRequirementSheet | null>({
    queryKey: opsKeys.requirements(activeEventId),
    queryFn: async () => {
      const response = await opsService.getRequirementsByEvent(activeEventId)
      return response.data
    },
    enabled: !!activeEventId,
  })
}

export function useOpsAgreements(activeEventId: string) {
  return useQuery<OpsVendorAgreement[]>({
    queryKey: opsKeys.agreements(activeEventId),
    queryFn: async () => {
      const response = await opsService.getVendorAgreements(activeEventId)
      return response.data
    },
    enabled: !!activeEventId,
  })
}

export function useOpsInvoices(vendorAgreementId: string) {
  return useQuery<OpsInvoice[]>({
    queryKey: opsKeys.invoices(vendorAgreementId),
    queryFn: async () => {
      const response = await opsService.getInvoices(vendorAgreementId)
      const data = response?.data
      if (Array.isArray(data)) {
        return data
      }
      return data ? [data] : []
    },
    enabled: !!vendorAgreementId,
  })
}

export function useOpsAllInvoices(params?: { status?: string; activeEventId?: string; page?: number; limit?: number }) {
  return useQuery<OpsInvoicesListResponse>({
    queryKey: opsKeys.allInvoices(params),
    queryFn: () => opsService.getAllInvoices(params),
    staleTime: 30_000,
  })
}

export function useOpsVendors() {
  return useQuery<OpsVendorProfile[]>({
    queryKey: opsKeys.vendors(),
    queryFn: async () => {
      const response = await opsService.getVendors()
      return response.data
    },
  })
}

export function useOpsSupportTickets() {
  return useQuery<OpsSupportTicket[]>({
    queryKey: opsKeys.support(),
    queryFn: async () => {
      const response = await opsService.getSupportTickets()
      return response.data
    },
  })
}

export function useLeadConversion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LeadConversionRequest) => opsService.convertLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.events() })
    },
  })
}

// ==================== Active Event Mutations ====================
export function useCreateActiveEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateActiveEventRequest) => opsService.createActiveEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.events() })
    },
  })
}

export function useUpdateActiveEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateActiveEventRequest }) =>
      opsService.updateActiveEvent(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.events() })
      queryClient.invalidateQueries({ queryKey: opsKeys.event(variables.id) })
    },
  })
}

export function useUpdateActiveEventStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      opsService.updateActiveEventStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.events() })
      queryClient.invalidateQueries({ queryKey: opsKeys.event(variables.id) })
    },
  })
}

export function useAssignManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, opsManagerId }: { id: string; opsManagerId: string }) =>
      opsService.assignManager(id, opsManagerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.events() })
      queryClient.invalidateQueries({ queryKey: opsKeys.event(variables.id) })
    },
  })
}


export function useDeleteActiveEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.deleteActiveEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.events() })
    },
  })
}

// ==================== Operational Task Mutations ====================
export function useCreateOperationalTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOperationalTaskRequest) => opsService.createOperationalTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.tasks() })
    },
  })
}

export function useUpdateOperationalTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOperationalTaskRequest }) =>
      opsService.updateOperationalTask(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: opsKeys.task(variables.id) })
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes?: string }) =>
      opsService.updateTaskStatus(id, status, reviewNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: opsKeys.task(variables.id) })
    },
  })
}

export function useStartTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.startTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: opsKeys.task(id) })
    },
  })
}

export function useSubmitTaskProof() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, proofUrl, proofNotes }: { id: string; proofUrl?: string; proofNotes?: string }) =>
      opsService.submitTaskProof(id, proofUrl, proofNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: opsKeys.task(variables.id) })
    },
  })
}

export function useReviewTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approved, reviewNotes }: { id: string; approved: boolean; reviewNotes?: string }) =>
      opsService.reviewTask(id, approved, reviewNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: opsKeys.task(variables.id) })
    },
  })
}

export function useDeleteOperationalTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.deleteOperationalTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.tasks() })
    },
  })
}

// ==================== Requirement Mutations ====================
export function useCreateRequirementSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRequirementSheetRequest) => opsService.createRequirementSheet(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.requirements(variables.activeEventId) })
    },
  })
}

export function useAddRequirementItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sheetId, payload }: { sheetId: string; payload: CreateRequirementItemRequest }) =>
      opsService.addRequirementItem(sheetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useUpdateRequirementItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: Partial<CreateRequirementItemRequest> }) =>
      opsService.updateRequirementItem(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useDeleteRequirementItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => opsService.deleteRequirementItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useSendRequirementToClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      opsService.sendRequirementToClient(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

// ==================== Vendor Agreement Mutations ====================
export function useCreateVendorAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVendorAgreementRequest) => opsService.createVendorAgreement(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.agreements(variables.activeEventId) })
    },
  })
}

export function useUpdateVendorAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVendorAgreementRequest }) =>
      opsService.updateVendorAgreement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useSendAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.sendAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useAcceptAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.acceptAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useDeclineAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => opsService.declineAgreement(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useDeleteVendorAgreement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.deleteVendorAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

// ==================== Invoice Mutations ====================
export function useCreateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { vendorAgreementId: string; invoiceNumber?: string; amount: number }) =>
      opsService.createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.markInvoicePaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.all })
    },
  })
}

// ==================== Dispute Mutations ====================
export function useCreateDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDisputeRequest) => opsService.createDispute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opsKeys.disputes() })
    },
  })
}

export function useInvestigateDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => opsService.investigateDispute(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.disputes() })
      queryClient.invalidateQueries({ queryKey: opsKeys.dispute(id) })
    },
  })
}

export function useResolveDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolution, resolvedBy }: { id: string; resolution: string; resolvedBy: string }) =>
      opsService.resolveDispute(id, resolution, resolvedBy),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.disputes() })
      queryClient.invalidateQueries({ queryKey: opsKeys.dispute(variables.id) })
    },
  })
}

// ==================== KYC Mutations ====================
export function useOpsKycList(params?: Record<string, unknown>) {
  return useQuery<OpsKycRecord[]>({
    queryKey: [...opsKeys.kycList(), params || {}],
    queryFn: async () => {
      const response = await opsService.getKycList(params)
      return response.data
    },
  })
}

export function useStartKycReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reviewerId }: { id: string; reviewerId: string }) =>
      opsService.startKycReview(id, reviewerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.kycList() })
      queryClient.invalidateQueries({ queryKey: opsKeys.kycById(variables.id) })
    },
  })
}

export function useApproveKyc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reviewerId }: { id: string; reviewerId: string }) =>
      opsService.approveKyc(id, reviewerId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.kycList() })
      queryClient.invalidateQueries({ queryKey: opsKeys.kycById(variables.id) })
    },
  })
}

export function useRejectKyc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reviewerId, reason }: { id: string; reviewerId: string; reason: string }) =>
      opsService.rejectKyc(id, reviewerId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opsKeys.kycList() })
      queryClient.invalidateQueries({ queryKey: opsKeys.kycById(variables.id) })
    },
  })
}

// ==================== Vendor Query ====================
export function useOpsVendor(id: string) {
  return useQuery<OpsVendorProfile>({
    queryKey: opsKeys.vendor(id),
    queryFn: async () => {
      const response = await opsService.getVendorById(id)
      return response.data
    },
    enabled: !!id,
  })
}

// ==================== Ops Team Queries ====================
export function useOpsManagers() {
  return useQuery({
    queryKey: opsKeys.team.managers(),
    queryFn: () => opsTeamService.getManagers(),
    staleTime: 60_000, // 1 minute
  })
}

export function useOpsAssistants() {
  return useQuery({
    queryKey: opsKeys.team.assistants(),
    queryFn: () => opsTeamService.getAssistants(),
    staleTime: 60_000, // 1 minute
  })
}

export function useOpsTeamOverview() {
  return useQuery({
    queryKey: opsKeys.team.overview(),
    queryFn: () => opsTeamService.getOverview(),
    staleTime: 30_000, // 30 seconds
  })
}

