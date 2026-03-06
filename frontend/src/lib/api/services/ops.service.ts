import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
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
} from '../types/ops.types'

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    timestamp?: string
    requestId?: string
    [key: string]: unknown
  }
}

export const opsService = {
  // ==================== Active Events ====================
  getActiveEvents: async (params?: Record<string, unknown>): Promise<ApiResponse<OpsActiveEvent[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.ACTIVE_EVENTS, { params })
    return data
  },

  getActiveEventById: async (id: string): Promise<ApiResponse<OpsActiveEvent>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.ACTIVE_EVENTS}/${id}`)
    return data
  },

  createActiveEvent: async (payload: CreateActiveEventRequest): Promise<ApiResponse<OpsActiveEvent>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.ACTIVE_EVENTS, payload)
    return data
  },

  updateActiveEvent: async (id: string, payload: UpdateActiveEventRequest): Promise<ApiResponse<OpsActiveEvent>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.ACTIVE_EVENTS}/${id}`, payload)
    return data
  },

  updateActiveEventStatus: async (id: string, status: string): Promise<ApiResponse<OpsActiveEvent>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.ACTIVE_EVENTS}/${id}/status`, { status })
    return data
  },

  assignManager: async (id: string, opsManagerId: string): Promise<ApiResponse<OpsActiveEvent>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.ACTIVE_EVENTS}/${id}/assign-manager`, { opsManagerId })
    return data
  },


  deleteActiveEvent: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.OPS.ACTIVE_EVENTS}/${id}`)
    return data
  },

  // ==================== Operational Tasks ====================
  getOperationalTasks: async (params?: Record<string, unknown>): Promise<ApiResponse<OpsOperationalTask[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.OPERATIONAL_TASKS, { params })
    return data
  },

  getOperationalTaskById: async (id: string): Promise<ApiResponse<OpsOperationalTask>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.OPERATIONAL_TASKS}/${id}`)
    return data
  },

  createOperationalTask: async (payload: CreateOperationalTaskRequest): Promise<ApiResponse<OpsOperationalTask>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.OPERATIONAL_TASKS, payload)
    return data
  },

  updateOperationalTask: async (id: string, payload: UpdateOperationalTaskRequest): Promise<ApiResponse<OpsOperationalTask>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.OPERATIONAL_TASKS}/${id}`, payload)
    return data
  },

  updateTaskStatus: async (id: string, status: string, reviewNotes?: string): Promise<ApiResponse<OpsOperationalTask>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.OPERATIONAL_TASKS}/${id}/status`, { status, reviewNotes })
    return data
  },

  startTask: async (id: string): Promise<ApiResponse<OpsOperationalTask>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.OPERATIONAL_TASKS}/${id}/status`, { status: 'IN_PROGRESS' })
    return data
  },

  submitTaskProof: async (id: string, proofUrl?: string, proofNotes?: string): Promise<ApiResponse<OpsOperationalTask>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.OPERATIONAL_TASKS}/${id}/submit-proof`, { proofUrl, proofNotes })
    return data
  },

  reviewTask: async (id: string, approved: boolean, reviewNotes?: string): Promise<ApiResponse<OpsOperationalTask>> => {
    const status = approved ? 'COMPLETED' : 'REJECTED'
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.OPERATIONAL_TASKS}/${id}/status`, { status, reviewNotes })
    return data
  },

  deleteOperationalTask: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.OPS.OPERATIONAL_TASKS}/${id}`)
    return data
  },

  // ==================== Requirements ====================
  getRequirementsByEvent: async (activeEventId: string): Promise<ApiResponse<OpsRequirementSheet | null>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.REQUIREMENTS, { params: { activeEventId } })
    return data
  },

  getRequirementById: async (id: string): Promise<ApiResponse<OpsRequirementSheet>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.REQUIREMENTS}/${id}`)
    return data
  },

  createRequirementSheet: async (payload: CreateRequirementSheetRequest): Promise<ApiResponse<OpsRequirementSheet>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.REQUIREMENTS, payload)
    return data
  },

  updateRequirementSheet: async (id: string, payload: { notes?: string }): Promise<ApiResponse<OpsRequirementSheet>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.REQUIREMENTS}/${id}`, payload)
    return data
  },

  addRequirementItem: async (sheetId: string, payload: CreateRequirementItemRequest): Promise<ApiResponse<OpsRequirementSheet>> => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.OPS.REQUIREMENTS}/${sheetId}/items`, payload)
    return data
  },

  updateRequirementItem: async (itemId: string, payload: Partial<CreateRequirementItemRequest>): Promise<ApiResponse<OpsRequirementSheet>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.REQUIREMENTS}/items/${itemId}`, payload)
    return data
  },

  deleteRequirementItem: async (itemId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.OPS.REQUIREMENTS}/items/${itemId}`)
    return data
  },

  deleteRequirementSheet: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.OPS.REQUIREMENTS}/${id}`)
    return data
  },

  // ==================== Vendor Agreements ====================
  getVendorAgreements: async (activeEventId: string): Promise<ApiResponse<OpsVendorAgreement[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.VENDOR_AGREEMENTS, { params: { activeEventId } })
    return data
  },

  getVendorAgreementById: async (id: string): Promise<ApiResponse<OpsVendorAgreement>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.VENDOR_AGREEMENTS}/${id}`)
    return data
  },

  createVendorAgreement: async (payload: CreateVendorAgreementRequest): Promise<ApiResponse<OpsVendorAgreement>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.VENDOR_AGREEMENTS, payload)
    return data
  },

  updateVendorAgreement: async (id: string, payload: UpdateVendorAgreementRequest): Promise<ApiResponse<OpsVendorAgreement>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.VENDOR_AGREEMENTS}/${id}`, payload)
    return data
  },

  sendAgreement: async (id: string): Promise<ApiResponse<OpsVendorAgreement>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.VENDOR_AGREEMENTS}/${id}/send`)
    return data
  },

  acceptAgreement: async (id: string): Promise<ApiResponse<OpsVendorAgreement>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.VENDOR_AGREEMENTS}/${id}/accept`)
    return data
  },

  declineAgreement: async (id: string, reason?: string): Promise<ApiResponse<OpsVendorAgreement>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.VENDOR_AGREEMENTS}/${id}/decline`, { reason })
    return data
  },

  deleteVendorAgreement: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.OPS.VENDOR_AGREEMENTS}/${id}`)
    return data
  },

  // ==================== Invoices ====================
  getInvoices: async (vendorAgreementId: string): Promise<ApiResponse<OpsInvoice[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.INVOICES, { params: { vendorAgreementId } })
    return data
  },

  getAllInvoices: async (params?: { status?: string; activeEventId?: string; page?: number; limit?: number }): Promise<OpsInvoicesListResponse> => {
    const { data } = await apiClient.get<{ success: boolean; data: OpsInvoicesListResponse }>(`${API_ENDPOINTS.OPS.INVOICES}/all`, { params })
    return data.data
  },

  getInvoiceById: async (id: string): Promise<ApiResponse<OpsInvoice>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.INVOICES}/${id}`)
    return data
  },

  createInvoice: async (payload: { vendorAgreementId: string; invoiceNumber?: string; amount: number }): Promise<ApiResponse<OpsInvoice>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.INVOICES, payload)
    return data
  },

  markInvoicePaid: async (id: string): Promise<ApiResponse<OpsInvoice>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.INVOICES}/${id}/paid`)
    return data
  },

  deleteInvoice: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.OPS.INVOICES}/${id}`)
    return data
  },

  // ==================== Disputes ====================
  getDisputes: async (params?: Record<string, unknown>): Promise<ApiResponse<OpsDispute[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.DISPUTES, { params })
    return data
  },

  getDisputeById: async (id: string): Promise<ApiResponse<OpsDispute>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.DISPUTES}/${id}`)
    return data
  },

  createDispute: async (payload: CreateDisputeRequest): Promise<ApiResponse<OpsDispute>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.DISPUTES, payload)
    return data
  },

  investigateDispute: async (id: string): Promise<ApiResponse<OpsDispute>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.DISPUTES}/${id}/investigate`)
    return data
  },

  resolveDispute: async (id: string, resolution: string, resolvedBy: string): Promise<ApiResponse<OpsDispute>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.DISPUTES}/${id}/resolve`, { resolution, resolvedBy })
    return data
  },

  // ==================== KYC ====================
  getKycList: async (params?: Record<string, unknown>): Promise<ApiResponse<OpsKycRecord[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.KYC, { params })
    return data
  },

  getKycByVendor: async (vendorProfileId: string): Promise<ApiResponse<OpsKycRecord | null>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.KYC, { params: { vendorProfileId } })
    return data
  },

  getKycById: async (id: string): Promise<ApiResponse<OpsKycRecord>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.KYC}/${id}`)
    return data
  },

  createKyc: async (vendorProfileId: string): Promise<ApiResponse<OpsKycRecord>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.KYC, { vendorProfileId })
    return data
  },

  submitKyc: async (id: string): Promise<ApiResponse<OpsKycRecord>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.KYC}/${id}/submit`)
    return data
  },

  startKycReview: async (id: string, reviewerId: string): Promise<ApiResponse<OpsKycRecord>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.KYC}/${id}/review`, { reviewerId })
    return data
  },

  approveKyc: async (id: string, reviewerId: string): Promise<ApiResponse<OpsKycRecord>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.KYC}/${id}/approve`, { reviewerId })
    return data
  },

  rejectKyc: async (id: string, reviewerId: string, reason: string): Promise<ApiResponse<OpsKycRecord>> => {
    const { data } = await apiClient.put(`${API_ENDPOINTS.OPS.KYC}/${id}/reject`, { reviewerId, reason })
    return data
  },

  // ==================== Vendors ====================
  getVendors: async (params?: Record<string, unknown>): Promise<ApiResponse<OpsVendorProfile[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.VENDORS, { params })
    return data
  },

  getVendorById: async (id: string): Promise<ApiResponse<OpsVendorProfile>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.OPS.VENDORS}/${id}`)
    return data
  },

  // ==================== Support ====================
  getSupportTickets: async (): Promise<ApiResponse<OpsSupportTicket[]>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.SUPPORT)
    return data
  },

  // ==================== Lead Conversion ====================
  convertLead: async (payload: LeadConversionRequest): Promise<ApiResponse<OpsActiveEvent>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.OPS.LEAD_CONVERSION, payload)
    return data
  },
}
