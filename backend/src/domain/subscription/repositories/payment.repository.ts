// ============================================================================
// PAYMENT REPOSITORY - Subscription Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, Payment } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  async findByInvoice(invoiceId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      include: { paymentMethod: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVendorProfile(vendorProfileId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        invoice: {
          subscription: { vendorProfileId },
        },
      },
      include: {
        invoice: {
          include: {
            subscription: { include: { plan: true } },
          },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  async getRecentPayments(limit: number = 10): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { status: 'SUCCEEDED' },
      include: {
        invoice: {
          include: { subscription: { include: { vendorProfile: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ============================================================================
  // User & Vendor Payment Methods
  // ============================================================================

  /**
   * Find payments by user ID with pagination
   */
  async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        invoice: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Find payment by ID and user ID
   */
  async findByIdAndUser(
    paymentId: string,
    userId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  /**
   * Find payments by vendor profile ID with pagination
   */
  async findByVendorWithPagination(
    vendorProfileId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { vendorProfileId },
      include: {
        invoice: {
          include: {
            subscription: { include: { plan: true } },
          },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Find payment by ID and vendor profile ID
   */
  async findByIdAndVendor(
    paymentId: string,
    vendorProfileId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        vendorProfileId,
      },
      include: {
        invoice: {
          include: {
            subscription: { include: { plan: true } },
          },
        },
        paymentMethod: true,
      },
    });
  }

  // ============================================================================
  // Webhook Support Methods
  // ============================================================================

  /**
   * Find payment by gateway payment ID (e.g., Razorpay payment ID)
   */
  async findByGatewayId(gatewayPaymentId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { gatewayPaymentId },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  /**
   * Find payment by refund ID stored in gatewayResponse
   * Refund ID is stored in gatewayResponse.refundId when refund is initiated
   */
  async findByRefundId(refundId: string): Promise<Payment | null> {
    // Search for refundId in gatewayResponse JSON field
    return this.prisma.payment.findFirst({
      where: {
        gatewayResponse: {
          path: ['refundId'],
          equals: refundId,
        },
      },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  /**
   * Update payment by gateway ID
   */
  async updateByGatewayId(
    gatewayPaymentId: string,
    data: Prisma.PaymentUpdateInput,
  ): Promise<Payment | null> {
    const payment = await this.findByGatewayId(gatewayPaymentId);
    if (!payment) return null;

    return this.prisma.payment.update({
      where: { id: payment.id },
      data,
    });
  }

  // ============================================================================
  // Idempotency Support Methods
  // ============================================================================

  /**
   * Find payment by gateway order ID
   * Used to check for duplicate payment attempts on the same order
   */
  async findByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { gatewayOrderId },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  /**
   * Find payment by idempotency key stored in metadata
   * Used to prevent duplicate order creation
   */
  async findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['idempotencyKey'],
          equals: idempotencyKey,
        },
      },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  /**
   * Find payment by gateway payment ID and user ID (for security)
   * Ensures payment belongs to the requesting user
   */
  async findByGatewayIdAndUser(
    gatewayPaymentId: string,
    userId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        gatewayPaymentId,
        userId,
      },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  /**
   * Find payment by gateway order ID and user ID (for security)
   * Ensures order belongs to the requesting user
   */
  async findByGatewayOrderIdAndUser(
    gatewayOrderId: string,
    userId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        gatewayOrderId,
        userId,
      },
      include: {
        invoice: true,
        paymentMethod: true,
      },
    });
  }

  /**
   * Check if a payment with the given gateway payment ID already exists
   */
  async existsByGatewayPaymentId(gatewayPaymentId: string): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: { gatewayPaymentId },
    });
    return count > 0;
  }

  /**
   * Check if a payment with the given gateway order ID already exists
   */
  async existsByGatewayOrderId(gatewayOrderId: string): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: { gatewayOrderId },
    });
    return count > 0;
  }

  // ============================================================================
  // Payment Retry Methods
  // ============================================================================

  /**
   * Find failed payments that are eligible for retry
   * Criteria:
   * - Status is FAILED
   * - Failed within the lookback period
   * - Retry count is less than max retries
   * - Associated subscription is still active or past_due
   * - Has not been retried too recently (minimum delay between retries)
   */
  async findRetryablePayments(
    maxRetries: number = 3,
    lookbackDays: number = 7,
    minRetryDelayHours: number = 4,
  ): Promise<Payment[]> {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    const minRetryTime = new Date();
    minRetryTime.setHours(minRetryTime.getHours() - minRetryDelayHours);

    return this.prisma.payment.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: lookbackDate,
        },
        // Check retry count in metadata
        OR: [
          {
            metadata: {
              equals: Prisma.DbNull,
            },
          },
          {
            NOT: {
              metadata: {
                path: ['retryCount'],
                gte: maxRetries,
              },
            },
          },
        ],
        // Ensure subscription is active or past_due (if subscription-related)
        subscription: {
          OR: [
            { status: 'ACTIVE' },
            { status: 'PAST_DUE' },
          ],
        },
      },
      include: {
        invoice: true,
        paymentMethod: true,
        subscription: {
          include: {
            plan: true,
            vendorProfile: {
              include: { user: true },
            },
            paymentMethods: {
              where: { isDefault: true },
            },
          },
        },
        user: true,
        vendorProfile: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get the retry count for a payment from its metadata
   */
  getRetryCount(payment: Payment): number {
    const metadata = payment.metadata as Record<string, unknown> | null;
    if (!metadata || typeof metadata.retryCount !== 'number') {
      return 0;
    }
    return metadata.retryCount;
  }

  /**
   * Get the last retry timestamp for a payment from its metadata
   */
  getLastRetryAt(payment: Payment): Date | null {
    const metadata = payment.metadata as Record<string, unknown> | null;
    if (!metadata || !metadata.lastRetryAt) {
      return null;
    }
    return new Date(metadata.lastRetryAt as string);
  }

  /**
   * Increment retry count and update last retry timestamp
   */
  async incrementRetryCount(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    const currentMetadata = (payment.metadata as Record<string, unknown>) || {};
    const currentRetryCount = typeof currentMetadata.retryCount === 'number'
      ? currentMetadata.retryCount
      : 0;

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        metadata: {
          ...currentMetadata,
          retryCount: currentRetryCount + 1,
          lastRetryAt: new Date().toISOString(),
          retryHistory: [
            ...((currentMetadata.retryHistory as string[]) || []),
            new Date().toISOString(),
          ],
        },
      },
    });
  }

  /**
   * Update payment status after a retry attempt
   */
  async updateRetryStatus(
    paymentId: string,
    success: boolean,
    gatewayPaymentId?: string,
    failureCode?: string,
    failureMessage?: string,
  ): Promise<Payment> {
    const payment = await this.findById(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    const currentMetadata = (payment.metadata as Record<string, unknown>) || {};

    if (success) {
      return this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCEEDED',
          gatewayPaymentId,
          processedAt: new Date(),
          failureCode: null,
          failureMessage: null,
          metadata: {
            ...currentMetadata,
            retriedSuccessfullyAt: new Date().toISOString(),
          },
        },
      });
    } else {
      return this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          failureCode,
          failureMessage,
          metadata: {
            ...currentMetadata,
            lastFailureAt: new Date().toISOString(),
            lastFailureCode: failureCode,
            lastFailureMessage: failureMessage,
          },
        },
      });
    }
  }

  /**
   * Find subscriptions with past due status for sending reminders
   */
  async findPastDueSubscriptionsWithFailedPayments(): Promise<
    Array<{
      subscriptionId: string;
      userId: string | null;
      vendorProfileId: string | null;
      email: string | null;
      planName: string | null;
      outstandingAmount: number;
      currency: string;
      currentPeriodEnd: Date;
    }>
  > {
    const pastDueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
      },
      include: {
        vendorProfile: {
          include: { user: true },
        },
        plan: true,
        invoices: {
          where: {
            status: { in: ['OPEN', 'PAST_DUE'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return pastDueSubscriptions.map((sub) => ({
      subscriptionId: sub.id,
      userId: sub.vendorProfile?.user?.id || null,
      vendorProfileId: sub.vendorProfileId,
      email: sub.vendorProfile?.user?.email || null,
      planName: sub.plan?.name || null,
      outstandingAmount: sub.invoices[0]?.totalAmount?.toNumber() || 0,
      currency: sub.invoices[0]?.currency || 'INR',
      currentPeriodEnd: sub.currentPeriodEnd,
    }));
  }
}
