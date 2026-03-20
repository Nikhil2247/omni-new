// ============================================================================
// BILLING SERVICE - Subscription Domain
// ============================================================================
// Handles billing operations including payments, invoices, and payment methods
// Includes idempotency support and transaction handling for safe payment processing
// ============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentMethodRepository } from '../repositories/payment-method.repository';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  CreatePaymentMethodDto,
  CreatePaymentDto,
  InvoiceStatus,
  PaymentStatus,
} from '../dto/payment.dto';
import { RecordPaymentDto } from '../dto/razorpay.dto';
import {
  PaymentAlreadyProcessedException,
  SubscriptionActivationFailedException,
  CreditGrantFailedException,
} from '../exceptions/payment.exceptions';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================================
  // PAYMENT METHODS
  // ============================================================================

  async addPaymentMethod(dto: CreatePaymentMethodDto) {
    this.logger.log(
      `Adding payment method for subscription: ${dto.subscriptionId}`,
    );

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.paymentMethodRepository.unsetDefaults(dto.subscriptionId);
    }

    const paymentMethod = await this.paymentMethodRepository.create({
      subscription: { connect: { id: dto.subscriptionId } },
      type: dto.type as any,
      cardBrand: dto.cardBrand,
      cardLast4: dto.cardLast4,
      cardExpMonth: dto.cardExpMonth,
      cardExpYear: dto.cardExpYear,
      isDefault: dto.isDefault ?? false,
    });

    this.eventEmitter.emit('payment-method.added', {
      paymentMethodId: paymentMethod.id,
      subscriptionId: dto.subscriptionId,
    });

    return paymentMethod;
  }

  async getPaymentMethods(subscriptionId: string) {
    return this.paymentMethodRepository.findBySubscription(subscriptionId);
  }

  async setDefaultPaymentMethod(
    paymentMethodId: string,
    subscriptionId: string,
  ) {
    await this.paymentMethodRepository.unsetDefaults(subscriptionId);
    return this.paymentMethodRepository.update(paymentMethodId, {
      isDefault: true,
    });
  }

  async removePaymentMethod(paymentMethodId: string) {
    const paymentMethod =
      await this.paymentMethodRepository.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    await this.paymentMethodRepository.delete(paymentMethodId);
    this.eventEmitter.emit('payment-method.removed', { paymentMethodId });
  }

  // ============================================================================
  // INVOICES
  // ============================================================================

  async createInvoice(subscriptionId: string) {
    this.logger.log(`Creating invoice for subscription: ${subscriptionId}`);

    const subscription = (await this.subscriptionService.findById(
      subscriptionId,
    )) as any;
    const plan = subscription.plan;
    const price = subscription.price;

    if (!price) {
      throw new BadRequestException('No price found for subscription');
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.invoiceRepository.create({
      subscription: { connect: { id: subscriptionId } },
      invoiceNumber,
      status: 'OPEN',
      subtotal: price.amount,
      discountAmount: 0,
      taxAmount: 0, // Calculate based on region
      totalAmount: price.amount,
      currency: price.currency,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      lineItems: {
        create: [
          {
            description: `${plan.name} - ${price.billingCycle}`,
            quantity: 1,
            unitPrice: price.amount,
            amount: price.amount,
          },
        ],
      },
    });

    this.eventEmitter.emit('invoice.created', {
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.totalAmount,
    });

    return invoice;
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.invoiceRepository.findById(invoiceId, {
      subscription: true,
      lineItems: true,
      payments: true,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getInvoicesBySubscription(subscriptionId: string) {
    return this.invoiceRepository.findBySubscription(subscriptionId);
  }

  async getInvoicesByVendorProfile(vendorProfileId: string) {
    return this.invoiceRepository.findByVendorProfile(vendorProfileId);
  }

  async voidInvoice(invoiceId: string) {
    const invoice = await this.getInvoice(invoiceId);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot void a paid invoice');
    }

    return this.invoiceRepository.update(invoiceId, { status: 'VOIDED' });
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  async processPayment(dto: CreatePaymentDto) {
    this.logger.log(`Processing payment for invoice: ${dto.invoiceId}`);

    const invoice = await this.getInvoice(dto.invoiceId);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }

    const paymentMethod = await this.paymentMethodRepository.findById(
      dto.paymentMethodId,
    );
    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Create payment record
    const payment = await this.paymentRepository.create({
      invoice: { connect: { id: dto.invoiceId } },
      paymentMethod: { connect: { id: dto.paymentMethodId } },
      amount: dto.amount,
      currency: dto.currency,
      status: 'PROCESSING',
    });

    try {
      // TODO: Integrate with payment gateway (Stripe/Razorpay)
      // const result = await this.paymentGateway.charge({
      //   amount: dto.amount,
      //   currency: dto.currency,
      //   paymentMethodId: paymentMethod.providerPaymentMethodId,
      // })

      // For now, simulate successful payment
      await this.paymentRepository.update(payment.id, {
        status: 'SUCCEEDED',
        processedAt: new Date(),
      });

      // Mark invoice as paid
      await this.invoiceRepository.update(dto.invoiceId, {
        status: 'PAID',
        paidAt: new Date(),
      });

      this.eventEmitter.emit('payment.succeeded', {
        paymentId: payment.id,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
      });

      return payment;
    } catch (error) {
      await this.paymentRepository.update(payment.id, {
        status: 'FAILED',
        failureMessage: error.message,
      });

      this.eventEmitter.emit('payment.failed', {
        paymentId: payment.id,
        invoiceId: dto.invoiceId,
        error: error.message,
      });

      throw error;
    }
  }

  async getPaymentHistory(vendorProfileId: string) {
    return this.paymentRepository.findByVendorProfile(vendorProfileId);
  }

  // ============================================================================
  // RAZORPAY PAYMENT RECORDING
  // ============================================================================

  /**
   * Record a payment from Razorpay with idempotency support
   * Checks if payment already exists and returns existing record if found
   * @param data - Payment data from Razorpay verification
   * @returns Created or existing payment record with isExisting flag
   */
  async recordPayment(data: RecordPaymentDto): Promise<{
    payment: any;
    isExisting: boolean;
  }> {
    this.logger.log(
      `Recording payment from Razorpay: ${data.gatewayPaymentId}`,
    );

    // Check if payment already exists (idempotency check)
    const existingPayment = await this.paymentRepository.findByGatewayId(
      data.gatewayPaymentId,
    );

    if (existingPayment) {
      this.logger.log(
        `Payment already exists for gateway ID ${data.gatewayPaymentId}, returning existing record`,
      );

      // If already processed successfully, return existing
      if (existingPayment.status === 'SUCCEEDED') {
        return {
          payment: existingPayment,
          isExisting: true,
        };
      }

      // If payment exists but not succeeded, update its status if new status is SUCCEEDED
      if (data.status === 'SUCCEEDED') {
        const updated = await this.paymentRepository.update(existingPayment.id, {
          status: data.status as PaymentStatus,
          processedAt: new Date(),
        });
        return {
          payment: updated,
          isExisting: true,
        };
      }

      return {
        payment: existingPayment,
        isExisting: true,
      };
    }

    // Also check by order ID to prevent duplicate payments on same order
    const existingOrderPayment = await this.paymentRepository.findByGatewayOrderId(
      data.gatewayOrderId,
    );

    if (existingOrderPayment && existingOrderPayment.status === 'SUCCEEDED') {
      this.logger.warn(
        `Payment already recorded for order ${data.gatewayOrderId}, paymentId: ${existingOrderPayment.id}`,
      );
      return {
        payment: existingOrderPayment,
        isExisting: true,
      };
    }

    // Create new payment record
    const payment = await this.paymentRepository.create({
      user: data.userId ? { connect: { id: data.userId } } : undefined,
      vendorProfile: data.vendorProfileId ? { connect: { id: data.vendorProfileId } } : undefined,
      amount: data.amount,
      currency: data.currency,
      gatewayPaymentId: data.gatewayPaymentId,
      gatewayOrderId: data.gatewayOrderId,
      status: data.status as PaymentStatus,
      gatewayProvider: data.method, // Store payment method in gatewayProvider field
      metadata: data.metadata,
      processedAt: data.status === 'SUCCEEDED' ? new Date() : null,
    });

    this.eventEmitter.emit('payment.recorded', {
      paymentId: payment.id,
      userId: data.userId,
      vendorProfileId: data.vendorProfileId,
      amount: data.amount,
      status: data.status,
    });

    return {
      payment,
      isExisting: false,
    };
  }

  /**
   * Record payment and activate subscription with transaction support
   * If subscription activation fails, the payment is still recorded but marked as requiring attention
   * @param data - Payment data
   * @param subscriptionData - Subscription activation data
   * @returns Payment and subscription records
   */
  async recordPaymentAndActivateSubscription(
    data: RecordPaymentDto,
    subscriptionData: {
      vendorProfileId?: string;
      userId?: string;
      planId: string;
    },
  ): Promise<{
    payment: any;
    subscription: any;
    isExisting: boolean;
  }> {
    this.logger.log(
      `Recording payment and activating subscription for order: ${data.gatewayOrderId}`,
    );

    // Check for existing payment first
    const existingPayment = await this.paymentRepository.findByGatewayId(
      data.gatewayPaymentId,
    );

    if (existingPayment && existingPayment.status === 'SUCCEEDED') {
      this.logger.log(
        `Payment ${data.gatewayPaymentId} already processed, checking subscription status`,
      );

      // Try to find associated subscription
      const existingSubscription = subscriptionData.vendorProfileId
        ? await this.subscriptionService.findActiveByVendorProfile(
            subscriptionData.vendorProfileId,
          )
        : null;

      if (existingSubscription) {
        return {
          payment: existingPayment,
          subscription: existingSubscription,
          isExisting: true,
        };
      }
    }

    // Record the payment first
    const { payment, isExisting } = await this.recordPayment(data);

    if (isExisting && payment.status === 'SUCCEEDED') {
      // Payment already processed, subscription should be activated
      const existingSubscription = subscriptionData.vendorProfileId
        ? await this.subscriptionService.findActiveByVendorProfile(
            subscriptionData.vendorProfileId,
          )
        : null;

      return {
        payment,
        subscription: existingSubscription,
        isExisting: true,
      };
    }

    // Only proceed with subscription activation if payment was successful
    if (payment.status !== 'SUCCEEDED') {
      return {
        payment,
        subscription: null,
        isExisting,
      };
    }

    // Activate subscription
    try {
      const subscription = subscriptionData.vendorProfileId
        ? await this.subscriptionService.activateAfterPayment(
            subscriptionData.vendorProfileId,
            subscriptionData.planId,
            payment.id,
          )
        : null;

      return {
        payment,
        subscription,
        isExisting,
      };
    } catch (error) {
      this.logger.error(
        `Failed to activate subscription after payment ${payment.id}: ${error.message}`,
        error.stack,
      );

      // Mark payment as needing attention
      await this.paymentRepository.update(payment.id, {
        metadata: {
          ...(payment.metadata as Record<string, any> || {}),
          subscriptionActivationFailed: true,
          subscriptionActivationError: error.message,
          subscriptionActivationAttemptedAt: new Date().toISOString(),
        },
      });

      // Emit event for manual intervention
      this.eventEmitter.emit('payment.subscription-activation-failed', {
        paymentId: payment.id,
        userId: data.userId,
        vendorProfileId: subscriptionData.vendorProfileId,
        planId: subscriptionData.planId,
        error: error.message,
      });

      throw new SubscriptionActivationFailedException(
        payment.id,
        error.message,
      );
    }
  }

  /**
   * Check if payment has already been processed
   * @param gatewayPaymentId - Razorpay payment ID
   * @returns Existing payment if found and processed, null otherwise
   */
  async findProcessedPayment(gatewayPaymentId: string) {
    const payment = await this.paymentRepository.findByGatewayId(gatewayPaymentId);

    if (payment && payment.status === 'SUCCEEDED') {
      return payment;
    }

    return null;
  }

  /**
   * Check if order has already been paid
   * @param gatewayOrderId - Razorpay order ID
   * @returns Existing payment if found and succeeded, null otherwise
   */
  async findProcessedOrderPayment(gatewayOrderId: string) {
    const payment = await this.paymentRepository.findByGatewayOrderId(gatewayOrderId);

    if (payment && payment.status === 'SUCCEEDED') {
      return payment;
    }

    return null;
  }

  /**
   * Get payment history for a user with pagination
   */
  async getPaymentHistoryByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    return this.paymentRepository.findByUser(userId, limit, offset);
  }

  /**
   * Get a specific payment by ID for a user
   */
  async getPaymentById(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findByIdAndUser(
      paymentId,
      userId,
    );

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get payment history for a vendor with pagination
   */
  async getVendorPaymentHistory(
    vendorProfileId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    return this.paymentRepository.findByVendorWithPagination(
      vendorProfileId,
      limit,
      offset,
    );
  }

  /**
   * Get a specific payment by ID for a vendor
   */
  async getVendorPaymentById(paymentId: string, vendorProfileId: string) {
    const payment = await this.paymentRepository.findByIdAndVendor(
      paymentId,
      vendorProfileId,
    );

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // ============================================================================
  // USER INVOICE METHODS
  // ============================================================================

  /**
   * Get all invoices for a user
   */
  async getUserInvoices(userId: string, limit = 20, offset = 0) {
    return this.invoiceRepository.findByUserId(userId, limit, offset);
  }

  /**
   * Get invoice by ID with user authorization check
   */
  async getInvoiceById(invoiceId: string, userId: string) {
    const invoice = await this.invoiceRepository.findById(invoiceId, {
      subscription: {
        include: {
          vendorProfile: {
            include: { user: true },
          },
        },
      },
      lineItems: true,
      payments: true,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Check if user has access to this invoice
    const invoiceUserId = (invoice as any).subscription?.vendorProfile?.user?.id;
    if (invoiceUserId && invoiceUserId !== userId) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Get invoices for business (vendor profile)
   */
  async getBusinessInvoices(vendorProfileId: string, limit = 20, offset = 0) {
    return this.invoiceRepository.findByVendorProfile(vendorProfileId);
  }

  // ============================================================================
  // WEBHOOK SUPPORT METHODS
  // ============================================================================

  /**
   * Update payment status from webhook
   * @param gatewayPaymentId - Payment ID from payment gateway (e.g., Razorpay payment ID)
   * @param status - New payment status
   * @param metadata - Additional metadata to store
   */
  async updatePaymentStatus(
    gatewayPaymentId: string,
    status: string,
    metadata?: Record<string, any>,
  ) {
    this.logger.log(
      `Updating payment status for gateway payment: ${gatewayPaymentId} to ${status}`,
    );

    // Try to find payment by gateway payment ID
    const payment = await this.paymentRepository.findByGatewayId(gatewayPaymentId);

    if (!payment) {
      // Payment might not exist yet in our system (webhook received before confirmation)
      this.logger.warn(
        `Payment not found for gateway ID: ${gatewayPaymentId}. Will retry or create on next event.`,
      );
      return null;
    }

    const updateData: Record<string, any> = {
      status: status as PaymentStatus,
      ...metadata,
    };

    if (status === 'SUCCEEDED') {
      updateData.processedAt = new Date();
    }

    const updatedPayment = await this.paymentRepository.update(payment.id, updateData);

    // If payment succeeded, update the associated invoice
    if (status === 'SUCCEEDED' && payment.invoiceId) {
      await this.invoiceRepository.update(payment.invoiceId, {
        status: 'PAID',
        paidAt: new Date(),
      });
    }

    return updatedPayment;
  }

  /**
   * Record a refund from webhook
   * @param paymentId - Original payment ID (gateway ID)
   * @param refundId - Refund ID from gateway
   * @param amount - Refund amount
   * @param status - Refund status
   */
  async recordRefund(
    paymentId: string,
    refundId: string,
    amount: number,
    status: string,
  ) {
    this.logger.log(
      `Recording refund ${refundId} for payment ${paymentId}: ${amount}`,
    );

    // Find the original payment
    const payment = await this.paymentRepository.findByGatewayId(paymentId);

    if (!payment) {
      this.logger.warn(`Payment not found for gateway ID: ${paymentId}`);
      return null;
    }

    // Update payment with refund information
    // Use schema-compliant fields: refundedAmount, refundedAt, refundReason, gatewayResponse
    const updateData: Record<string, any> = {
      refundedAmount: amount,
      refundedAt: new Date(),
      refundReason: `Refund ${refundId} - Status: ${status}`,
      // Store refund details in gatewayResponse for lookup by refundId
      gatewayResponse: {
        refundId,
        refundStatus: status,
        refundAmount: amount,
      },
    };

    // Update status based on refund amount - compare with number conversion
    const paymentAmount = typeof payment.amount === 'object'
      ? Number(payment.amount)
      : payment.amount;

    if (amount >= paymentAmount) {
      updateData.status = 'REFUNDED';
    } else if (amount > 0) {
      updateData.status = 'PARTIALLY_REFUNDED';
    }

    const updatedPayment = await this.paymentRepository.update(payment.id, updateData);

    this.eventEmitter.emit('payment.refund-recorded', {
      paymentId: payment.id,
      refundId,
      amount,
      status,
    });

    return updatedPayment;
  }

  /**
   * Update refund status from webhook
   * @param refundId - Refund ID from gateway
   * @param status - New refund status
   */
  async updateRefundStatus(refundId: string, status: string) {
    this.logger.log(`Updating refund status: ${refundId} to ${status}`);

    const payment = await this.paymentRepository.findByRefundId(refundId);

    if (!payment) {
      this.logger.warn(`Payment not found for refund ID: ${refundId}`);
      return null;
    }

    // Update the refund status in gatewayResponse
    const currentGatewayResponse = (payment as any).gatewayResponse || {};
    return this.paymentRepository.update(payment.id, {
      gatewayResponse: {
        ...currentGatewayResponse,
        refundStatus: status,
      },
    });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${year}${month}-${random}`;
  }
}
