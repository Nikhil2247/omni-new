// ============================================================================
// PUBLIC QUOTE APPROVAL SERVICE - API Services
// ============================================================================

import { apiClient } from '../client'

export interface QuoteDetailsResponse {
  id: string
  clientName: string
  eventType: string
  eventDate: string | null
  notes: string | null
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  items: Array<{
    id: string
    category: string
    description: string
    quantity: number
    estimatedBudget: number
    notes: string | null
  }>
  totalAmount: number
}

export interface QuoteApproveResponse {
  success: boolean
  message: string
  approvalStatus: string
  approvedAt: string
}

export interface QuoteRejectInput {
  reason?: string
}

export interface QuoteRejectResponse {
  success: boolean
  message: string
  approvalStatus: string
  rejectedAt: string
}

export const publicQuoteApprovalService = {
  /**
   * Get quote details by token (public endpoint)
   */
  async getDetails(token: string): Promise<QuoteDetailsResponse> {
    const response = await apiClient.get<any>(`/public/quote-approval/${token}`)
    return response.data?.data || response.data
  },

  /**
   * Approve quote (public endpoint)
   */
  async approve(token: string): Promise<QuoteApproveResponse> {
    const response = await apiClient.post<any>(`/public/quote-approval/${token}/approve`)
    return response.data?.data || response.data
  },

  /**
   * Reject quote (public endpoint)
   */
  async reject(token: string, data: QuoteRejectInput): Promise<QuoteRejectResponse> {
    const response = await apiClient.post<any>(`/public/quote-approval/${token}/reject`, data)
    return response.data?.data || response.data
  },
}
