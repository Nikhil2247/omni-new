// ============================================================================
// PAYMENT EXCEPTIONS - Payment-specific Error Types
// ============================================================================
// Custom exception types for payment processing errors
// ============================================================================

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for payment-related exceptions
 */
export abstract class PaymentException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly code: string,
    public readonly metadata?: Record<string, any>,
  ) {
    super(
      {
        message,
        error: 'Payment Error',
        code,
        ...(metadata && { metadata }),
      },
      statusCode,
    );
  }
}

/**
 * Payment gateway is not configured or unavailable
 */
export class PaymentGatewayNotConfiguredException extends PaymentException {
  constructor(gateway: string = 'Razorpay') {
    super(
      `${gateway} payment gateway is not configured`,
      HttpStatus.SERVICE_UNAVAILABLE,
      'PAYMENT_GATEWAY_NOT_CONFIGURED',
      { gateway },
    );
  }
}

/**
 * Payment already exists (duplicate request)
 */
export class PaymentAlreadyProcessedException extends PaymentException {
  constructor(
    paymentId: string,
    existingPaymentId?: string,
  ) {
    super(
      'Payment has already been processed',
      HttpStatus.CONFLICT,
      'PAYMENT_ALREADY_PROCESSED',
      { paymentId, existingPaymentId },
    );
  }
}

/**
 * Order already exists (duplicate order request)
 */
export class OrderAlreadyExistsException extends PaymentException {
  constructor(
    orderId: string,
    idempotencyKey?: string,
  ) {
    super(
      'Order already exists for this request',
      HttpStatus.CONFLICT,
      'ORDER_ALREADY_EXISTS',
      { orderId, idempotencyKey },
    );
  }
}

/**
 * Payment signature verification failed
 */
export class PaymentSignatureInvalidException extends PaymentException {
  constructor(orderId: string) {
    super(
      'Payment signature verification failed',
      HttpStatus.BAD_REQUEST,
      'PAYMENT_SIGNATURE_INVALID',
      { orderId },
    );
  }
}

/**
 * Payment capture failed
 */
export class PaymentCaptureFailedException extends PaymentException {
  constructor(
    paymentId: string,
    reason?: string,
  ) {
    super(
      reason || 'Failed to capture payment',
      HttpStatus.PAYMENT_REQUIRED,
      'PAYMENT_CAPTURE_FAILED',
      { paymentId, reason },
    );
  }
}

/**
 * Payment creation failed
 */
export class PaymentCreationFailedException extends PaymentException {
  constructor(
    reason?: string,
    gatewayError?: string,
  ) {
    super(
      reason || 'Failed to create payment order',
      HttpStatus.BAD_GATEWAY,
      'PAYMENT_CREATION_FAILED',
      { reason, gatewayError },
    );
  }
}

/**
 * Refund failed
 */
export class RefundFailedException extends PaymentException {
  constructor(
    paymentId: string,
    reason?: string,
  ) {
    super(
      reason || 'Failed to process refund',
      HttpStatus.BAD_GATEWAY,
      'REFUND_FAILED',
      { paymentId, reason },
    );
  }
}

/**
 * Payment not found
 */
export class PaymentNotFoundException extends PaymentException {
  constructor(identifier: string, identifierType: 'id' | 'gatewayId' | 'orderId' = 'id') {
    super(
      `Payment not found`,
      HttpStatus.NOT_FOUND,
      'PAYMENT_NOT_FOUND',
      { [identifierType]: identifier },
    );
  }
}

/**
 * Subscription activation failed after payment
 */
export class SubscriptionActivationFailedException extends PaymentException {
  constructor(
    paymentId: string,
    reason?: string,
  ) {
    super(
      reason || 'Failed to activate subscription after payment',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'SUBSCRIPTION_ACTIVATION_FAILED',
      { paymentId, reason },
    );
  }
}

/**
 * Credit grant failed after payment
 */
export class CreditGrantFailedException extends PaymentException {
  constructor(
    paymentId: string,
    credits: number,
    reason?: string,
  ) {
    super(
      reason || 'Failed to grant credits after payment',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'CREDIT_GRANT_FAILED',
      { paymentId, credits, reason },
    );
  }
}

/**
 * Gateway communication error
 */
export class PaymentGatewayException extends PaymentException {
  constructor(
    operation: string,
    gatewayError?: string,
    gatewayErrorCode?: string,
  ) {
    super(
      `Payment gateway error during ${operation}`,
      HttpStatus.BAD_GATEWAY,
      'PAYMENT_GATEWAY_ERROR',
      { operation, gatewayError, gatewayErrorCode },
    );
  }
}

/**
 * Idempotency key conflict
 */
export class IdempotencyKeyConflictException extends PaymentException {
  constructor(
    idempotencyKey: string,
    existingOrderId: string,
  ) {
    super(
      'A different order was already created with this idempotency key',
      HttpStatus.CONFLICT,
      'IDEMPOTENCY_KEY_CONFLICT',
      { idempotencyKey, existingOrderId },
    );
  }
}
