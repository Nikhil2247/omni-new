// ============================================================================
// RAZORPAY SERVICE - Payment Gateway Integration
// ============================================================================
// Service for Razorpay payment gateway integration using the official SDK
// Handles order creation, payment verification, refunds, and webhooks
// Includes idempotency support and robust error handling
// ============================================================================

import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
import { CreateOrderDto, CreateOrderResponseDto } from '../dto/razorpay.dto';
import { PaymentRepository } from '../repositories/payment.repository';
import {
  PaymentGatewayNotConfiguredException,
  PaymentGatewayException,
  PaymentCreationFailedException,
  RefundFailedException,
  OrderAlreadyExistsException,
} from '../exceptions/payment.exceptions';

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: any = null;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paymentRepository: PaymentRepository,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    this.webhookSecret = this.configService.get<string>(
      'RAZORPAY_WEBHOOK_SECRET',
    ) || '';

    if (!this.keyId || !this.keySecret) {
      this.logger.warn(
        'Razorpay credentials not configured. Payment processing will fail.',
      );
    } else {
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
      this.logger.log('Razorpay initialized successfully');
    }
  }

  // ============================================================================
  // Order Management
  // ============================================================================

  /**
   * Create a Razorpay order for payment with idempotency support
   * @param dto - Order creation parameters
   * @param userId - User making the payment
   * @param vendorProfileId - Optional vendor profile ID
   * @param idempotencyKey - Optional idempotency key to prevent duplicate orders
   * @returns Order response with Razorpay details
   */
  async createOrder(
    dto: CreateOrderDto,
    userId: string,
    vendorProfileId?: string,
    idempotencyKey?: string,
  ): Promise<CreateOrderResponseDto> {
    this.ensureConfigured();

    // Check for existing order with same idempotency key
    if (idempotencyKey) {
      const existingPayment = await this.paymentRepository.findByIdempotencyKey(
        idempotencyKey,
      );

      if (existingPayment && existingPayment.gatewayOrderId) {
        this.logger.log(
          `Returning existing order for idempotency key: ${idempotencyKey}, orderId: ${existingPayment.gatewayOrderId}`,
        );

        // Return existing order details
        return {
          orderId: existingPayment.gatewayOrderId,
          amount: dto.amount,
          currency: dto.currency,
          keyId: this.keyId,
          planId: dto.planId,
          credits: dto.credits,
          isExisting: true,
        };
      }
    }

    try {
      const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const notes: Record<string, string> = {
        purpose: dto.purpose,
        userId,
      };

      if (vendorProfileId) {
        notes.vendorProfileId = vendorProfileId;
      }

      if (dto.planId) {
        notes.planId = dto.planId;
      }

      if (dto.credits) {
        notes.credits = dto.credits.toString();
      }

      if (idempotencyKey) {
        notes.idempotencyKey = idempotencyKey;
      }

      if (dto.metadata) {
        Object.entries(dto.metadata).forEach(([key, value]) => {
          notes[key] = String(value);
        });
      }

      this.logger.debug(
        `Creating Razorpay order: amount=${dto.amount}, currency=${dto.currency}, purpose=${dto.purpose}`,
      );

      const order = await this.razorpay.orders.create({
        amount: dto.amount,
        currency: dto.currency,
        receipt: receiptId,
        notes,
      });

      this.logger.log(
        `Created Razorpay order: ${order.id} for ${dto.purpose}${idempotencyKey ? ` (idempotencyKey: ${idempotencyKey})` : ''}`,
      );

      this.eventEmitter.emit('payment.order-created', {
        orderId: order.id,
        amount: dto.amount,
        currency: dto.currency,
        purpose: dto.purpose,
        userId,
        vendorProfileId,
        idempotencyKey,
      });

      return {
        orderId: order.id,
        amount: dto.amount,
        currency: dto.currency,
        keyId: this.keyId,
        planId: dto.planId,
        credits: dto.credits,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create Razorpay order: ${error.message}`,
        error.stack,
      );

      // Extract Razorpay-specific error details
      const gatewayError = error.error?.description || error.message;
      const gatewayErrorCode = error.error?.code;

      if (gatewayErrorCode) {
        throw new PaymentGatewayException(
          'order creation',
          gatewayError,
          gatewayErrorCode,
        );
      }

      throw new PaymentCreationFailedException(
        'Failed to create payment order',
        gatewayError,
      );
    }
  }

  /**
   * Fetch order details from Razorpay
   */
  async fetchOrder(orderId: string): Promise<any> {
    this.ensureConfigured();

    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      this.logger.error(`Failed to fetch order ${orderId}: ${error.message}`);
      throw new PaymentGatewayException(
        'fetch order',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  // ============================================================================
  // Payment Verification
  // ============================================================================

  /**
   * Verify payment signature from Razorpay checkout
   * Uses timing-safe comparison to prevent timing attacks
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    if (!this.keySecret) {
      this.logger.error('Payment signature verification failed: keySecret not configured');
      throw new PaymentGatewayNotConfiguredException();
    }

    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body)
        .digest('hex');

      // Use timing-safe comparison
      const isValid =
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        );

      if (!isValid) {
        this.logger.warn(
          `Invalid payment signature for order: ${orderId}, paymentId: ${paymentId}`,
        );
      } else {
        this.logger.debug(
          `Payment signature verified for order: ${orderId}, paymentId: ${paymentId}`,
        );
      }

      return isValid;
    } catch (error) {
      this.logger.error(
        `Payment signature verification error for order ${orderId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Verify webhook signature from Razorpay
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn(
        'Webhook secret not configured, skipping signature verification',
      );
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error(`Webhook signature verification error: ${error.message}`);
      return false;
    }
  }

  // ============================================================================
  // Payment Management
  // ============================================================================

  /**
   * Fetch payment details from Razorpay
   */
  async fetchPayment(paymentId: string): Promise<any> {
    this.ensureConfigured();

    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      this.logger.debug(
        `Fetched payment ${paymentId}: status=${payment.status}, amount=${payment.amount}`,
      );
      return payment;
    } catch (error) {
      this.logger.error(`Failed to fetch payment ${paymentId}: ${error.message}`);
      throw new PaymentGatewayException(
        'fetch payment',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(
    paymentId: string,
    amount: number,
    currency: string = 'INR',
  ): Promise<any> {
    this.ensureConfigured();

    try {
      this.logger.log(
        `Capturing payment ${paymentId}: amount=${amount}, currency=${currency}`,
      );
      const result = await this.razorpay.payments.capture(paymentId, amount, currency);
      this.logger.log(`Payment ${paymentId} captured successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to capture payment ${paymentId}: ${error.message}`,
        error.stack,
      );
      throw new PaymentGatewayException(
        'capture payment',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  // ============================================================================
  // Refunds
  // ============================================================================

  /**
   * Create a refund for a payment
   * @param paymentId - Razorpay payment ID
   * @param amount - Optional refund amount (full refund if not specified)
   * @param notes - Optional notes for the refund
   * @param reason - Optional reason for the refund
   */
  async createRefund(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>,
    reason?: string,
  ): Promise<any> {
    this.ensureConfigured();

    try {
      const refundOptions: any = {};

      if (amount) {
        refundOptions.amount = amount;
      }

      if (notes) {
        refundOptions.notes = notes;
      }

      this.logger.log(
        `Creating refund for payment ${paymentId}${amount ? `: amount=${amount}` : ' (full refund)'}`,
      );

      const refund = await this.razorpay.payments.refund(
        paymentId,
        refundOptions,
      );

      this.logger.log(
        `Created refund ${refund.id} for payment ${paymentId}, status: ${refund.status}`,
      );

      this.eventEmitter.emit('payment.refund-initiated', {
        refundId: refund.id,
        paymentId,
        amount: refund.amount,
        reason,
      });

      return refund;
    } catch (error) {
      this.logger.error(
        `Failed to create refund for payment ${paymentId}: ${error.message}`,
        error.stack,
      );
      throw new RefundFailedException(
        paymentId,
        error.error?.description || error.message,
      );
    }
  }

  /**
   * Fetch refund details
   */
  async fetchRefund(paymentId: string, refundId: string): Promise<any> {
    this.ensureConfigured();

    try {
      return await this.razorpay.refunds.fetch(refundId);
    } catch (error) {
      this.logger.error(`Failed to fetch refund ${refundId}: ${error.message}`);
      throw new PaymentGatewayException(
        'fetch refund',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  // ============================================================================
  // Subscription Management (Razorpay Subscriptions API)
  // ============================================================================

  /**
   * Create a Razorpay subscription
   */
  async createSubscription(
    planId: string,
    totalCount: number,
    notes?: Record<string, string>,
  ): Promise<any> {
    this.ensureConfigured();

    try {
      this.logger.log(`Creating Razorpay subscription for plan: ${planId}`);

      return await this.razorpay.subscriptions.create({
        plan_id: planId,
        total_count: totalCount,
        notes,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create subscription: ${error.message}`,
        error.stack,
      );
      throw new PaymentGatewayException(
        'create subscription',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  /**
   * Fetch subscription details
   */
  async fetchSubscription(subscriptionId: string): Promise<any> {
    this.ensureConfigured();

    try {
      return await this.razorpay.subscriptions.fetch(subscriptionId);
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscription ${subscriptionId}: ${error.message}`,
      );
      throw new PaymentGatewayException(
        'fetch subscription',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = true,
  ): Promise<any> {
    this.ensureConfigured();

    try {
      this.logger.log(`Cancelling subscription ${subscriptionId}`);

      return await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${subscriptionId}: ${error.message}`,
      );
      throw new PaymentGatewayException(
        'cancel subscription',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<any> {
    this.ensureConfigured();

    try {
      this.logger.log(`Pausing subscription ${subscriptionId}`);

      return await this.razorpay.subscriptions.pause(subscriptionId);
    } catch (error) {
      this.logger.error(
        `Failed to pause subscription ${subscriptionId}: ${error.message}`,
      );
      throw new PaymentGatewayException(
        'pause subscription',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<any> {
    this.ensureConfigured();

    try {
      this.logger.log(`Resuming subscription ${subscriptionId}`);

      return await this.razorpay.subscriptions.resume(subscriptionId);
    } catch (error) {
      this.logger.error(
        `Failed to resume subscription ${subscriptionId}: ${error.message}`,
      );
      throw new PaymentGatewayException(
        'resume subscription',
        error.error?.description || error.message,
        error.error?.code,
      );
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Get the Razorpay key ID for frontend integration
   */
  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Check if Razorpay is properly configured
   */
  isConfigured(): boolean {
    return !!this.razorpay;
  }

  /**
   * Ensure Razorpay is configured, throw if not
   * @throws PaymentGatewayNotConfiguredException if Razorpay is not configured
   */
  private ensureConfigured(): void {
    if (!this.razorpay) {
      this.logger.error('Razorpay operation attempted but gateway not configured');
      throw new PaymentGatewayNotConfiguredException();
    }
  }
}
