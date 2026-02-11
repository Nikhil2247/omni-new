// ============================================================================
// SUBSCRIPTION EVENTS - Event Definitions
// ============================================================================

export const SubscriptionEvents = {
  // Subscription lifecycle
  CREATED: 'subscription.created',
  UPGRADED: 'subscription.upgraded',
  DOWNGRADED: 'subscription.downgraded',
  RENEWED: 'subscription.renewed',
  CANCELLED: 'subscription.cancelled',
  EXPIRED: 'subscription.expired',
  PAUSED: 'subscription.paused',
  RESUMED: 'subscription.resumed',
  PLAN_CHANGED: 'subscription.plan-changed',

  // Trial
  TRIAL_STARTED: 'subscription.trial-started',
  TRIAL_ENDING: 'subscription.trial-ending',
  TRIAL_ENDED: 'subscription.trial-ended',

  // Payment
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  PAYMENT_METHOD_ADDED: 'payment-method.added',
  PAYMENT_METHOD_REMOVED: 'payment-method.removed',

  // Invoice
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',

  // Usage
  USAGE_LIMIT_REACHED: 'usage.limit-reached',
  USAGE_LIMIT_APPROACHING: 'usage.limit-approaching',
  USAGE_PERIOD_RESET: 'usage.period-reset',
} as const

// Event payload interfaces
export interface SubscriptionCreatedPayload {
  subscriptionId: string
  vendorProfileId: string
  planId: string
}

export interface SubscriptionCancelledPayload {
  subscriptionId: string
  vendorProfileId: string
  immediate: boolean
  reason?: string
}

export interface PaymentSucceededPayload {
  paymentId: string
  invoiceId: string
  amount: number
}

export interface PaymentFailedPayload {
  paymentId: string
  invoiceId: string
  error: string
}

export interface UsageLimitReachedPayload {
  vendorProfileId: string
  featureType: string
  subscriptionId: string
}

export interface UsageLimitApproachingPayload {
  vendorProfileId: string
  featureType: string
  remaining: number
  limit: number
}
