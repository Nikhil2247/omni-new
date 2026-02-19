// ============================================================================
// PAYMENT DTOs - Subscription Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';

export enum PaymentMethodType {
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAST_DUE = 'PAST_DUE',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
}

// ============================================================================
// Payment Method DTOs
// ============================================================================

export class CreatePaymentMethodDto {
  @ApiProperty({ description: 'Subscription ID' })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({ description: 'Payment method type', enum: PaymentMethodType })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiPropertyOptional({ description: 'Card last 4 digits' })
  @IsOptional()
  @IsString()
  cardLast4?: string;

  @ApiPropertyOptional({ description: 'Card brand (visa, mastercard, etc.)' })
  @IsOptional()
  @IsString()
  cardBrand?: string;

  @ApiPropertyOptional({ description: 'Card expiry month' })
  @IsOptional()
  @IsNumber()
  cardExpMonth?: number;

  @ApiPropertyOptional({ description: 'Card expiry year' })
  @IsOptional()
  @IsNumber()
  cardExpYear?: number;

  @ApiPropertyOptional({ description: 'Set as default payment method' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class PaymentMethodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subscriptionId: string;

  @ApiProperty({ enum: PaymentMethodType })
  type: PaymentMethodType;

  @ApiPropertyOptional()
  cardLast4?: string;

  @ApiPropertyOptional()
  cardBrand?: string;

  @ApiPropertyOptional()
  cardExpMonth?: number;

  @ApiPropertyOptional()
  cardExpYear?: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;
}

// ============================================================================
// Invoice DTOs
// ============================================================================

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  subscriptionId: string;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  discountAmount?: number;

  @ApiPropertyOptional()
  taxAmount?: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  pdfUrl?: string;

  @ApiProperty()
  createdAt: Date;

  lineItems?: any[];
}

// ============================================================================
// Payment DTOs
// ============================================================================

export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Payment method ID' })
  @IsUUID()
  paymentMethodId: string;

  @ApiProperty({ description: 'Amount to pay' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency', default: 'INR' })
  @IsString()
  currency: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  paymentMethodId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional()
  failureMessage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  processedAt?: Date;
}

// ============================================================================
// Coupon DTOs
// ============================================================================

export class ApplyCouponDto {
  @ApiProperty({ description: 'Coupon code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Plan ID to apply coupon to' })
  @IsUUID()
  planId: string;
}

export class CouponResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  discountType: string;

  @ApiProperty()
  discountValue: number;

  @ApiPropertyOptional()
  maxRedemptions?: number;

  @ApiProperty()
  timesRedeemed: number;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  isActive: boolean;
}
