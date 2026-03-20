export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface RefundRequest {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
  // Payment details (optional, populated when fetching with details)
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    gatewayPaymentId: string;
    createdAt: string;
    metadata?: Record<string, any>;
  };
}

export interface CreateRefundRequestDto {
  paymentId: string;
  amount?: number; // optional for partial refund, full refund if not specified
  reason: string;
}

export interface RefundRequestListResponse {
  refundRequests: RefundRequest[];
  total: number;
}

export const REFUND_REASONS = [
  { value: 'service_not_received', label: 'Service not received' },
  { value: 'service_unsatisfactory', label: 'Service quality was unsatisfactory' },
  { value: 'duplicate_payment', label: 'Duplicate payment' },
  { value: 'incorrect_amount', label: 'Incorrect amount charged' },
  { value: 'subscription_cancelled', label: 'Subscription cancelled' },
  { value: 'event_cancelled', label: 'Event cancelled' },
  { value: 'vendor_cancelled', label: 'Vendor cancelled' },
  { value: 'other', label: 'Other reason' },
] as const;

export type RefundReasonValue = typeof REFUND_REASONS[number]['value'];
