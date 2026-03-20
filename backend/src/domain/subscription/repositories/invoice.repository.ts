// ============================================================================
// INVOICE REPOSITORY - Subscription Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, Invoice } from '@prisma/client';

@Injectable()
export class InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({
      data,
      include: { lineItems: true },
    });
  }

  async findById(
    id: string,
    include?: Prisma.InvoiceInclude,
  ): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include,
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        subscription: true,
        lineItems: true,
        payments: true,
      },
    });
  }

  async findBySubscription(subscriptionId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { subscriptionId },
      include: { lineItems: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVendorProfile(vendorProfileId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        subscription: { vendorProfileId },
      },
      include: {
        subscription: { include: { plan: true } },
        lineItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: { lineItems: true },
    });
  }

  async getUnpaidInvoices(subscriptionId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        subscriptionId,
        status: { in: ['OPEN', 'DRAFT'] },
      },
      include: { lineItems: true },
    });
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    const now = new Date();

    return this.prisma.invoice.findMany({
      where: {
        status: 'OPEN',
        dueDate: { lt: now },
      },
      include: {
        subscription: {
          include: { vendorProfile: true },
        },
      },
    });
  }

  /**
   * Find invoices by user ID (through subscription -> vendorProfile -> user)
   */
  async findByUserId(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: {
        subscription: {
          vendorProfile: {
            userId,
          },
        },
      },
      include: {
        subscription: {
          include: { plan: true },
        },
        lineItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
