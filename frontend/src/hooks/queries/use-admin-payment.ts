// ============================================================================
// ADMIN PAYMENT & SUBSCRIPTION HOOKS
// ============================================================================
// React Query hooks for admin payment and subscription management
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminPaymentService, adminSubscriptionService } from '@/lib/api/services/admin-payment.service'
import type {
  AdminPaymentListParams,
  RefundPaymentRequest,
  AdminSubscriptionListParams,
  ModifySubscriptionRequest,
  CancelSubscriptionRequest,
} from '@/lib/api/types/admin-payment.types'

// ============================================================================
// Query Keys
// ============================================================================

const adminPaymentKeys = {
  payments: (params: AdminPaymentListParams) => ['admin-payments', params] as const,
  payment: (id: string) => ['admin-payment', id] as const,
  paymentStats: () => ['admin-payment-stats'] as const,
  subscriptions: (params: AdminSubscriptionListParams) => ['admin-subscriptions', params] as const,
  subscription: (id: string) => ['admin-subscription', id] as const,
  subscriptionStats: () => ['admin-subscription-stats'] as const,
}

// ============================================================================
// Payment Hooks
// ============================================================================

/**
 * Get all payments with filters and pagination
 */
export function useAdminPayments(params: AdminPaymentListParams = {}) {
  return useQuery({
    queryKey: adminPaymentKeys.payments(params),
    queryFn: () => adminPaymentService.getAllPayments(params),
  })
}

/**
 * Get a single payment by ID
 */
export function useAdminPayment(id: string) {
  return useQuery({
    queryKey: adminPaymentKeys.payment(id),
    queryFn: () => adminPaymentService.getPaymentById(id),
    enabled: Boolean(id),
  })
}

/**
 * Get payment statistics
 */
export function useAdminPaymentStats() {
  return useQuery({
    queryKey: adminPaymentKeys.paymentStats(),
    queryFn: () => adminPaymentService.getPaymentStats(),
  })
}

/**
 * Refund a payment mutation
 */
export function useRefundPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RefundPaymentRequest }) =>
      adminPaymentService.refundPayment(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.payment(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.paymentStats() })
      toast.success(data.message || 'Payment refunded successfully')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to refund payment'
      toast.error(msg)
    },
  })
}

// ============================================================================
// Subscription Hooks
// ============================================================================

/**
 * Get all subscriptions with filters and pagination
 */
export function useAdminSubscriptions(params: AdminSubscriptionListParams = {}) {
  return useQuery({
    queryKey: adminPaymentKeys.subscriptions(params),
    queryFn: () => adminSubscriptionService.getAllSubscriptions(params),
  })
}

/**
 * Get a single subscription by ID
 */
export function useAdminSubscription(id: string) {
  return useQuery({
    queryKey: adminPaymentKeys.subscription(id),
    queryFn: () => adminSubscriptionService.getSubscriptionById(id),
    enabled: Boolean(id),
  })
}

/**
 * Get subscription statistics
 */
export function useAdminSubscriptionStats() {
  return useQuery({
    queryKey: adminPaymentKeys.subscriptionStats(),
    queryFn: () => adminSubscriptionService.getSubscriptionStats(),
  })
}

/**
 * Modify a subscription mutation
 */
export function useModifySubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModifySubscriptionRequest }) =>
      adminSubscriptionService.modifySubscription(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.subscription(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.subscriptionStats() })
      toast.success(data.message || 'Subscription modified successfully')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to modify subscription'
      toast.error(msg)
    },
  })
}

/**
 * Cancel a subscription mutation
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CancelSubscriptionRequest }) =>
      adminSubscriptionService.cancelSubscription(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.subscription(variables.id) })
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.subscriptionStats() })
      toast.success(data.message || 'Subscription cancelled successfully')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to cancel subscription'
      toast.error(msg)
    },
  })
}
