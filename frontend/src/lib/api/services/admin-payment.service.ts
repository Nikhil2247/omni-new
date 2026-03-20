// ============================================================================
// ADMIN PAYMENT & SUBSCRIPTION SERVICE
// ============================================================================
// Service layer for admin payment and subscription management
// ============================================================================

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type {
  AdminPayment,
  AdminPaymentListParams,
  RefundPaymentRequest,
  RefundPaymentResponse,
  PaymentStats,
  AdminSubscription,
  AdminSubscriptionListParams,
  ModifySubscriptionRequest,
  ModifySubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  SubscriptionStats,
} from '../types/admin-payment.types'

// ============================================================================
// Admin Payment Service
// ============================================================================

export const adminPaymentService = {
  /**
   * Get all payments with filters and pagination
   */
  getAllPayments: async (
    params: AdminPaymentListParams = {}
  ): Promise<PaginatedResponse<AdminPayment>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.PAYMENTS.LIST, { params })
    return data
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (id: string): Promise<AdminPayment> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.PAYMENTS.BY_ID(id))
    return data?.data ?? data
  },

  /**
   * Refund a payment (full or partial)
   */
  refundPayment: async (
    id: string,
    payload: RefundPaymentRequest
  ): Promise<RefundPaymentResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.PAYMENTS.REFUND(id), payload)
    return data?.data ?? data
  },

  /**
   * Get payment statistics
   */
  getPaymentStats: async (): Promise<PaymentStats> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.PAYMENTS.STATS)
    return data?.data ?? data
  },
}

// ============================================================================
// Admin Subscription Service
// ============================================================================

export const adminSubscriptionService = {
  /**
   * Get all subscriptions with filters and pagination
   */
  getAllSubscriptions: async (
    params: AdminSubscriptionListParams = {}
  ): Promise<PaginatedResponse<AdminSubscription>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.LIST, { params })
    return data
  },

  /**
   * Get subscription by ID
   */
  getSubscriptionById: async (id: string): Promise<AdminSubscription> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.BY_ID(id))
    return data?.data ?? data
  },

  /**
   * Modify a subscription (change plan, status, etc.)
   */
  modifySubscription: async (
    id: string,
    payload: ModifySubscriptionRequest
  ): Promise<ModifySubscriptionResponse> => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.MODIFY(id), payload)
    return data?.data ?? data
  },

  /**
   * Cancel a subscription
   */
  cancelSubscription: async (
    id: string,
    payload: CancelSubscriptionRequest
  ): Promise<CancelSubscriptionResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.CANCEL(id), payload)
    return data?.data ?? data
  },

  /**
   * Get subscription statistics
   */
  getSubscriptionStats: async (): Promise<SubscriptionStats> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.STATS)
    return data?.data ?? data
  },
}
