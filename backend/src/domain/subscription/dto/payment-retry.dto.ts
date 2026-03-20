// ============================================================================
// PAYMENT RETRY DTOs - Subscription Domain
// ============================================================================
// DTOs for payment retry operations and results
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================================================
// Payment Retry Result DTOs
// ============================================================================

export class PaymentRetryResultDto {
  @ApiProperty({ description: 'Payment ID that was retried' })
  paymentId: string;

  @ApiProperty({ description: 'Whether the retry was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if retry failed' })
  error?: string;

  @ApiProperty({ description: 'Current retry count after this attempt' })
  retryCount: number;

  @ApiPropertyOptional({ description: 'New payment ID if a new payment was created' })
  newPaymentId?: string;

  @ApiPropertyOptional({ description: 'Gateway payment ID if successful' })
  gatewayPaymentId?: string;
}

export class PaymentRetryBatchResultDto {
  @ApiProperty({ description: 'Total number of payments processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Number of successful retries' })
  successCount: number;

  @ApiProperty({ description: 'Number of failed retries' })
  failureCount: number;

  @ApiProperty({ description: 'Number of payments that reached max retries' })
  maxRetriesReachedCount: number;

  @ApiProperty({
    description: 'Individual results for each payment',
    type: [PaymentRetryResultDto],
  })
  results: PaymentRetryResultDto[];

  @ApiProperty({ description: 'Timestamp when the batch processing started' })
  startedAt: Date;

  @ApiProperty({ description: 'Timestamp when the batch processing completed' })
  completedAt: Date;
}

// ============================================================================
// Payment Retry Configuration
// ============================================================================

export interface PaymentRetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Number of days to look back for failed payments */
  lookbackDays: number;
  /** Minimum delay between retries in hours */
  minRetryDelayHours: number;
}

export const DEFAULT_RETRY_CONFIG: PaymentRetryConfig = {
  maxRetries: 3,
  lookbackDays: 7,
  minRetryDelayHours: 4,
};

// ============================================================================
// Retryable Payment Interface
// ============================================================================

export interface RetryablePayment {
  id: string;
  invoiceId: string | null;
  paymentMethodId: string | null;
  userId: string | null;
  vendorProfileId: string | null;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  gatewayProvider: string | null;
  gatewayPaymentId: string | null;
  gatewayOrderId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
  lastRetryAt: Date | null;
}

// ============================================================================
// Payment Failure Reminder DTO
// ============================================================================

export class PaymentFailureReminderDto {
  @ApiProperty({ description: 'Subscription ID' })
  subscriptionId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'User email' })
  email?: string;

  @ApiProperty({ description: 'Outstanding amount' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Plan name' })
  planName?: string;

  @ApiProperty({ description: 'Days until subscription expires' })
  daysUntilExpiry: number;

  @ApiProperty({ description: 'Retry payment link' })
  retryLink: string;
}
