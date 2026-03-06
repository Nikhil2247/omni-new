import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

// Types
export interface QuotationLineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED'

export interface CreateQuotationPayload {
  vendorAgreementId: string
  currency?: string
  items: QuotationLineItem[]
  subtotal: number
  taxRate?: number
  taxAmount?: number
  discount?: number
  discountType?: 'PERCENTAGE' | 'FIXED'
  totalAmount: number
  notes?: string
  termsAndConditions?: string
  validUntil?: string
}

export interface UpdateQuotationPayload {
  currency?: string
  items?: QuotationLineItem[]
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  discount?: number
  discountType?: 'PERCENTAGE' | 'FIXED'
  totalAmount?: number
  notes?: string
  termsAndConditions?: string
  validUntil?: string
}

export interface QuotationResponse {
  id: string
  vendorAgreementId: string
  quotationNumber: string
  currency: string
  items: QuotationLineItem[]
  subtotal: number
  taxRate: number | null
  taxAmount: number | null
  discount: number | null
  discountType: string | null
  totalAmount: number
  notes: string | null
  termsAndConditions: string | null
  validUntil: string | null
  status: QuotationStatus
  sentAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  vendorAgreement?: {
    id: string
    vendorName: string
    activeEvent?: {
      id: string
      clientName: string
      eventType: string
      eventDate: string | null
      venueName: string | null
    }
  }
  invoice?: {
    id: string
    invoiceNumber: string
    status: string
  } | null
}

export interface QuotationSearchParams {
  vendorAgreementId?: string
  activeEventId?: string
  status?: QuotationStatus
  page?: number
  limit?: number
}

// Query keys
const quotationKeys = {
  all: ['quotations'] as const,
  list: (params: QuotationSearchParams) => [...quotationKeys.all, 'list', params] as const,
  detail: (id: string) => [...quotationKeys.all, 'detail', id] as const,
  byAgreement: (agreementId: string) => [...quotationKeys.all, 'agreement', agreementId] as const,
}

// Ops gateway endpoints
const OPS_QUOTATIONS = '/ops/quotations'

// Hooks
export function useOpsQuotations(params: QuotationSearchParams = {}) {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data: {
          items: QuotationResponse[]
          total: number
          page: number
          limit: number
          totalPages: number
        }
      }>(OPS_QUOTATIONS, { params })
      return response.data.data
    },
  })
}

export function useOpsQuotationDetail(quotationId: string) {
  return useQuery({
    queryKey: quotationKeys.detail(quotationId),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data: QuotationResponse
      }>(`${OPS_QUOTATIONS}/${quotationId}`)
      return response.data.data
    },
    enabled: !!quotationId,
  })
}

export function useQuotationByAgreement(vendorAgreementId: string) {
  return useQuery({
    queryKey: quotationKeys.byAgreement(vendorAgreementId),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        data: QuotationResponse | null
      }>(`${OPS_QUOTATIONS}/agreement/${vendorAgreementId}`)
      return response.data.data
    },
    enabled: !!vendorAgreementId,
  })
}

export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateQuotationPayload) => {
      const response = await apiClient.post<{
        success: boolean
        data: QuotationResponse
      }>(OPS_QUOTATIONS, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
    },
  })
}

export function useUpdateQuotation(quotationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateQuotationPayload) => {
      const response = await apiClient.put<{
        success: boolean
        data: QuotationResponse
      }>(`${OPS_QUOTATIONS}/${quotationId}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) })
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
    },
  })
}

export function useSendQuotation(quotationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (message?: string) => {
      const response = await apiClient.post<{
        success: boolean
        data: QuotationResponse
      }>(`${OPS_QUOTATIONS}/${quotationId}/send`, { message })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) })
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
    },
  })
}

export function useAcceptQuotation(quotationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        success: boolean
        data: QuotationResponse
      }>(`${OPS_QUOTATIONS}/${quotationId}/accept`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) })
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
    },
  })
}

export function useRejectQuotation(quotationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reason?: string) => {
      const response = await apiClient.post<{
        success: boolean
        data: QuotationResponse
      }>(`${OPS_QUOTATIONS}/${quotationId}/reject`, { reason })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) })
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
    },
  })
}

export function useConvertQuotationToInvoice(quotationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        success: boolean
        data: {
          quotation: QuotationResponse
          invoice: { id: string; invoiceNumber: string }
        }
      }>(`${OPS_QUOTATIONS}/${quotationId}/convert-to-invoice`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) })
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
      // Also invalidate invoices
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (quotationId: string) => {
      await apiClient.delete(`${OPS_QUOTATIONS}/${quotationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
    },
  })
}
