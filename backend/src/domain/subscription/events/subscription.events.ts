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
  EXPIRING_SOON: 'subscription.expiring-soon',
  PAUSED: 'subscription.paused',
  RESUMED: 'subscription.resumed',
  PLAN_CHANGED: 'subscription.plan-changed',
  ACTIVATED_AFTER_PAYMENT: 'subscription.activated-after-payment',
  RENEWAL_REMINDER: 'subscription.renewal-reminder',

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
  SUBSCRIPTION_PAYMENT_FAILED: 'subscription-payment.failed',

  // Payment Retry
  PAYMENT_RETRY_INITIATED: 'payment.retry-initiated',
  PAYMENT_RETRY_SUCCEEDED: 'payment.retry-succeeded',
  PAYMENT_RETRY_FAILED: 'payment.retry-failed',
  PAYMENT_MAX_RETRIES_REACHED: 'payment.max-retries-reached',
  PAYMENT_RETRY_BATCH_COMPLETED: 'payment.retry-batch-completed',
  PAYMENT_FAILURE_REMINDER: 'payment.failure-reminder',
  SUBSCRIPTION_GRACE_PERIOD_EXPIRED: 'subscription.grace-period-expired',

  // Invoice
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',

  // Usage
  USAGE_LIMIT_REACHED: 'usage.limit-reached',
  USAGE_LIMIT_APPROACHING: 'usage.limit-approaching',
  USAGE_PERIOD_RESET: 'usage.period-reset',

  // Ad Credits
  CREDITS_PURCHASED: 'ad-credits.purchased',
} as const;

// Event payload interfaces
export interface SubscriptionCreatedPayload {
  subscriptionId: string;
  vendorProfileId: string;
  planId: string;
}

export interface SubscriptionCancelledPayload {
  subscriptionId: string;
  vendorProfileId: string;
  immediate: boolean;
  reason?: string;
}

export interface PaymentSucceededPayload {
  paymentId: string;
  invoiceId: string;
  amount: number;
}

export interface PaymentFailedPayload {
  paymentId: string;
  invoiceId: string;
  error: string;
}

export interface UsageLimitReachedPayload {
  vendorProfileId: string;
  featureType: string;
  subscriptionId: string;
}

export interface UsageLimitApproachingPayload {
  vendorProfileId: string;
  featureType: string;
  remaining: number;
  limit: number;
}

export interface SubscriptionActivatedPayload {
  subscriptionId: string;
  vendorProfileId?: string;
  userId?: string;
  planId: string;
  paymentId?: string;
  isUpgrade: boolean;
}

export interface SubscriptionRenewedPayload {
  subscriptionId: string;
  userId?: string;
}

export interface SubscriptionPaymentFailedPayload {
  subscriptionId: string;
  vendorProfileId?: string;
  userId?: string;
  reason: string;
  attemptCount?: number;
}

export interface CreditsPurchasedPayload {
  vendorProfileId: string;
  userId?: string;
  amount: number;
  credits: number;
  transactionId: string;
}

export interface SubscriptionExpiredPayload {
  subscriptionId: string;
  vendorProfileId: string;
}

export interface RenewalReminderPayload {
  subscriptionId: string;
  userId?: string;
  email?: string;
  planName?: string;
  renewalDate: Date;
  amount?: number;
  currency?: string;
  daysRemaining?: number;
  type: 'vendor' | 'user';
}

export interface TrialEndingPayload {
  subscriptionId: string;
  userId?: string;
  email?: string;
  planName?: string;
  trialEnd: Date;
  daysRemaining?: number;
  type: 'vendor' | 'user';
}

// ============================================================================
// Payment Retry Event Payloads
// ============================================================================

export interface PaymentRetryInitiatedPayload {
  originalPaymentId: string;
  newPaymentId: string;
  orderId: string;
  subscriptionId: string;
  retryCount: number;
  amount: number;
  currency: string;
}

export interface PaymentRetrySucceededPayload {
  paymentId: string;
  subscriptionId: string;
  gatewayPaymentId: string;
  retryCount: number;
  amount: number;
}

export interface PaymentRetryFailedPayload {
  paymentId: string;
  subscriptionId?: string;
  error: string;
  retryCount: number;
  willRetryAgain?: boolean;
}

export interface PaymentMaxRetriesReachedPayload {
  paymentId: string;
  subscriptionId?: string;
  retryCount: number;
  finalError: string;
}

export interface PaymentFailureReminderPayload {
  subscriptionId: string;
  userId?: string;
  vendorProfileId?: string;
  email: string;
  amount: number;
  currency: string;
  planName?: string;
  daysUntilExpiry: number;
  retryLink: string;
}

export interface SubscriptionGracePeriodExpiredPayload {
  subscriptionId: string;
  vendorProfileId?: string;
  userId?: string;
  email?: string;
  planName?: string;
  daysPastDue: number;
}
