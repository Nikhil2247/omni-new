// ============================================================================
// BILLING SERVICE - Subscription Domain
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
import {
  CreatePaymentMethodDto,
  CreatePaymentDto,
  InvoiceStatus,
  PaymentStatus,
} from '../dto/payment.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly eventEmitter: EventEmitter2,
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
