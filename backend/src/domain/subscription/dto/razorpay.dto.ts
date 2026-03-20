// ============================================================================
// RAZORPAY DTOs - Payment Gateway DTOs
// ============================================================================
// DTOs for Razorpay payment gateway integration
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
} from 'class-validator';

export enum PaymentPurpose {
  SUBSCRIPTION = 'SUBSCRIPTION',
  SUBSCRIPTION_UPGRADE = 'SUBSCRIPTION_UPGRADE',
  AD_CREDITS = 'AD_CREDITS',
}

// ============================================================================
// Create Order DTOs
// ============================================================================

export class CreateOrderDto {
  @ApiProperty({
    description: 'Amount in smallest currency unit (paise for INR)',
  })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  currency: string = 'INR';

  @ApiProperty({ enum: PaymentPurpose })
  @IsEnum(PaymentPurpose)
  purpose: PaymentPurpose;

  @ApiPropertyOptional({ description: 'Plan ID for subscription payments' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Number of credits for ad credit purchase',
  })
  @IsOptional()
  @IsNumber()
  credits?: number;

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate order creation',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateOrderResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  keyId: string;

  @ApiPropertyOptional()
  planId?: string;

  @ApiPropertyOptional()
  credits?: number;

  @ApiPropertyOptional({
    description: 'True if this order was already created (idempotent response)',
  })
  isExisting?: boolean;
}

// ============================================================================
// Verify Payment DTOs
// ============================================================================

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  razorpay_order_id: string;

  @ApiProperty()
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty()
  @IsString()
  razorpay_signature: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  credits?: number;
}

export class PaymentVerificationResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  paymentId: string;

  @ApiPropertyOptional()
  subscriptionId?: string;

  @ApiPropertyOptional()
  creditsGranted?: number;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional({
    description: 'True if this payment was already processed (idempotent response)',
  })
  isExisting?: boolean;
}

// ============================================================================
// Webhook DTOs
// ============================================================================

/**
 * Razorpay Payment Entity (from webhook payload)
 */
export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id?: string;
  invoice_id?: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status?: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email: string;
  contact: string;
  customer_id?: string;
  notes: Record<string, string>;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
}

/**
 * Razorpay Refund Entity (from webhook payload)
 */
export interface RazorpayRefundEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt?: string;
  acquirer_data?: Record<string, any>;
  created_at: number;
  batch_id?: string;
  status: string;
  speed_processed: string;
  speed_requested: string;
}

/**
 * Razorpay Subscription Entity (from webhook payload)
 */
export interface RazorpaySubscriptionEntity {
  id: string;
  entity: string;
  plan_id: string;
  customer_id?: string;
  status: string;
  current_start: number;
  current_end: number;
  ended_at?: number;
  quantity: number;
  notes: Record<string, string>;
  charge_at: number;
  offer_id?: string;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at?: number;
  source: string;
  payment_method: string;
  created_at: number;
  expire_by?: number;
  customer_notify: number;
  remaining_count?: number;
  paid_count?: number;
  total_count?: number;
}

/**
 * Razorpay Order Entity (from webhook payload)
 */
export interface RazorpayOrderEntity {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  offer_id?: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export class RazorpayWebhookPayload {
  event: string;
  entity: string;
  account_id: string;
  contains?: string[];
  created_at: number;
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    refund?: {
      entity: RazorpayRefundEntity;
    };
    subscription?: {
      entity: RazorpaySubscriptionEntity;
    };
    order?: {
      entity: RazorpayOrderEntity;
    };
  };
}

// ============================================================================
// Razorpay Webhook Event Types
// ============================================================================

export type RazorpayPaymentEvent =
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'payment.pending';

export type RazorpayRefundEvent =
  | 'refund.created'
  | 'refund.processed'
  | 'refund.failed';

export type RazorpaySubscriptionEvent =
  | 'subscription.activated'
  | 'subscription.charged'
  | 'subscription.completed'
  | 'subscription.updated'
  | 'subscription.pending'
  | 'subscription.halted'
  | 'subscription.cancelled'
  | 'subscription.paused'
  | 'subscription.resumed';

export type RazorpayOrderEvent = 'order.paid';

export type RazorpayWebhookEvent =
  | RazorpayPaymentEvent
  | RazorpayRefundEvent
  | RazorpaySubscriptionEvent
  | RazorpayOrderEvent;

// ============================================================================
// Record Payment DTO (internal use)
// ============================================================================

export class RecordPaymentDto {
  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  vendorProfileId?: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  gatewayPaymentId: string;

  @ApiProperty()
  gatewayOrderId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  method: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}
