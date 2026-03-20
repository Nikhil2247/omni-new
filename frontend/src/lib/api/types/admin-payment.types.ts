// ============================================================================
// ADMIN PAYMENT & SUBSCRIPTION TYPES
// ============================================================================
// Types for admin payment and subscription management
// ============================================================================

import type { SubscriptionStatus, BillingCycle, PlanTier, UserPlanTier } from './subscription.types'

// ============================================================================
// Payment Types
// ============================================================================

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

export interface AdminPayment {
  id: string
  userId: string
  vendorProfileId?: string | null
  amount: number
  currency: string
  status: PaymentStatus
  gatewayPaymentId: string
  gatewayOrderId: string
  paymentMethod?: string | null
  purpose: string
  metadata?: Record<string, unknown> | null
  refundedAmount?: number
  refundReason?: string | null
  createdAt: string
  updatedAt: string
  // Related entities (populated by admin endpoint)
  user?: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
  }
  vendorProfile?: {
    id: string
    businessName: string
  } | null
}

export interface AdminPaymentListParams {
  status?: PaymentStatus
  userId?: string
  vendorProfileId?: string
  search?: string
  fromDate?: string
  toDate?: string
  minAmount?: number
  maxAmount?: number
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'amount' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface RefundPaymentRequest {
  amount?: number // Partial refund amount, if not provided, full refund
  reason: string
}

export interface RefundPaymentResponse {
  success: boolean
  payment: AdminPayment
  refundId?: string
  message?: string
}

export interface PaymentStats {
  totalPayments: number
  totalAmount: number
  successfulPayments: number
  successfulAmount: number
  failedPayments: number
  pendingPayments: number
  refundedAmount: number
  averagePaymentAmount: number
  paymentsByStatus: Array<{
    status: PaymentStatus
    count: number
    amount: number
  }>
  paymentsByPeriod: Array<{
    period: string
    count: number
    amount: number
  }>
  recentPayments: AdminPayment[]
}

// ============================================================================
// Subscription Types
// ============================================================================

export type AdminSubscriptionType = 'USER' | 'VENDOR'

export interface AdminSubscription {
  id: string
  userId?: string | null
  vendorProfileId?: string | null
  type: AdminSubscriptionType
  planId: string
  priceId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  trialStart?: string | null
  trialEnd?: string | null
  cancelAtPeriodEnd: boolean
  cancelledAt?: string | null
  cancelReason?: string | null
  createdAt: string
  updatedAt: string
  // Related entities
  user?: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
  } | null
  vendorProfile?: {
    id: string
    businessName: string
  } | null
  plan?: {
    id: string
    name: string
    slug: string
    tier: PlanTier | UserPlanTier
  }
  price?: {
    id: string
    billingCycle: BillingCycle
    amount: number
    currency: string
  }
}

export interface AdminSubscriptionListParams {
  status?: SubscriptionStatus
  type?: AdminSubscriptionType
  planId?: string
  userId?: string
  vendorProfileId?: string
  search?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'currentPeriodEnd' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface ModifySubscriptionRequest {
  planId?: string
  priceId?: string
  status?: SubscriptionStatus
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  notes?: string
}

export interface ModifySubscriptionResponse {
  success: boolean
  subscription: AdminSubscription
  message?: string
}

export interface CancelSubscriptionRequest {
  reason: string
  cancelImmediately?: boolean
  refundProrated?: boolean
}

export interface CancelSubscriptionResponse {
  success: boolean
  subscription: AdminSubscription
  refundAmount?: number
  message?: string
}

export interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  trialingSubscriptions: number
  cancelledSubscriptions: number
  expiredSubscriptions: number
  userSubscriptions: number
  vendorSubscriptions: number
  monthlyRecurringRevenue: number
  annualRecurringRevenue: number
  churnRate: number
  subscriptionsByPlan: Array<{
    planId: string
    planName: string
    count: number
    revenue: number
  }>
  subscriptionsByStatus: Array<{
    status: SubscriptionStatus
    count: number
  }>
  subscriptionTrends: Array<{
    period: string
    newSubscriptions: number
    cancellations: number
    netGrowth: number
  }>
  recentSubscriptions: AdminSubscription[]
}
