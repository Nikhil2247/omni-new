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
}
