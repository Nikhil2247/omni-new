export enum PaymentPurpose {
  SUBSCRIPTION = 'SUBSCRIPTION',
  SUBSCRIPTION_UPGRADE = 'SUBSCRIPTION_UPGRADE',
  AD_CREDITS = 'AD_CREDITS',
}

export interface CreateOrderRequest {
  amount: number;
  currency?: string;
  purpose: PaymentPurpose;
  planId?: string;
  credits?: number;
  metadata?: Record<string, any>;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId?: string;
  credits?: number;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId?: string;
  credits?: number;
}

export interface VerifyPaymentResponse {
  success: boolean;
  paymentId: string;
  subscriptionId?: string;
  creditsGranted?: number;
  message?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  gatewayPaymentId: string;
  gatewayOrderId: string;
  paymentMethod?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
      on: (event: string, handler: (response: RazorpayError) => void) => void;
    };
  }
}
