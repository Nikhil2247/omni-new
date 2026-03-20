// ============================================================================
// INVOICE GENERATOR SERVICE - Subscription Domain
// ============================================================================
// Generates PDF invoices for payments and subscriptions
// ============================================================================

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service';
import * as PDFDocument from 'pdfkit';

// Helper function to format dates
function formatDate(date: Date, pattern: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const d = new Date(date);
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const yearMonth = `${year}${String(d.getMonth() + 1).padStart(2, '0')}`;

  if (pattern === 'MMM dd, yyyy') {
    return `${month} ${day}, ${year}`;
  }
  if (pattern === 'yyyyMM') {
    return yearMonth;
  }
  return d.toLocaleDateString();
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;

  // Company details
  companyName: string;
  companyAddress: string;
  companyGST?: string;

  // Customer details
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerGST?: string;

  // Line items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;

  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  // Payment info
  paymentMethod?: string;
  paymentStatus: string;
  paidAt?: Date;
}

@Injectable()
export class InvoiceGeneratorService {
  private readonly logger = new Logger(InvoiceGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: true,
        subscription: {
          include: {
            vendorProfile: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Get customer name from vendor profile
    const vendorProfile = invoice.subscription?.vendorProfile;
    const user = vendorProfile?.user;
    const customerName = vendorProfile?.businessName ||
      (user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || 'Customer');

    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issuedAt ?? invoice.createdAt,
      dueDate: invoice.dueDate ?? invoice.createdAt,

      companyName: this.configService.get<string>(
        'COMPANY_NAME',
        'Omnicassion Pvt Ltd',
      ),
      companyAddress: this.configService.get<string>(
        'COMPANY_ADDRESS',
        '123 Business Park, Bangalore, Karnataka 560001',
      ),
      companyGST: this.configService.get<string>('COMPANY_GST'),

      customerName,
      customerEmail: user?.email || '',

      items: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
      })),

      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate ?? 18),
      taxAmount: Number(invoice.taxAmount ?? 0),
      total: Number(invoice.totalAmount ?? invoice.subtotal),

      paymentStatus: invoice.status,
      paidAt: invoice.paidAt ?? undefined,
    };

    return this.createPDF(invoiceData);
  }

  private createPDF(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('INVOICE', { align: 'right' });
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Invoice #: ${data.invoiceNumber}`, { align: 'right' });
        doc.text(`Date: ${formatDate(data.invoiceDate, 'MMM dd, yyyy')}`, {
          align: 'right',
        });
        doc.text(`Due Date: ${formatDate(data.dueDate, 'MMM dd, yyyy')}`, {
          align: 'right',
        });

        doc.moveDown(2);

        // Company Info
        doc.fontSize(12).font('Helvetica-Bold').text(data.companyName);
        doc.fontSize(10).font('Helvetica').text(data.companyAddress);
        if (data.companyGST) {
          doc.text(`GSTIN: ${data.companyGST}`);
        }

        doc.moveDown();

        // Bill To
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
        doc.fontSize(10).font('Helvetica').text(data.customerName);
        doc.text(data.customerEmail);
        if (data.customerAddress) {
          doc.text(data.customerAddress);
        }
        if (data.customerGST) {
          doc.text(`GSTIN: ${data.customerGST}`);
        }

        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [250, 60, 80, 100];

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', tableLeft, tableTop);
        doc.text('Qty', tableLeft + colWidths[0], tableTop);
        doc.text('Unit Price', tableLeft + colWidths[0] + colWidths[1], tableTop);
        doc.text(
          'Amount',
          tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
          tableTop,
        );

        doc
          .moveTo(tableLeft, tableTop + 15)
          .lineTo(
            tableLeft + colWidths.reduce((a, b) => a + b, 0),
            tableTop + 15,
          )
          .stroke();

        // Table Body
        let y = tableTop + 25;
        doc.font('Helvetica');

        for (const item of data.items) {
          doc.text(item.description, tableLeft, y, { width: colWidths[0] - 10 });
          doc.text(item.quantity.toString(), tableLeft + colWidths[0], y);
          doc.text(
            `₹${item.unitPrice.toFixed(2)}`,
            tableLeft + colWidths[0] + colWidths[1],
            y,
          );
          doc.text(
            `₹${item.amount.toFixed(2)}`,
            tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
            y,
          );
          y += 20;
        }

        doc
          .moveTo(tableLeft, y)
          .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), y)
          .stroke();

        // Totals
        y += 15;
        const totalsX = tableLeft + colWidths[0] + colWidths[1];

        doc.text('Subtotal:', totalsX, y);
        doc.text(`₹${data.subtotal.toFixed(2)}`, totalsX + colWidths[2], y);

        y += 15;
        doc.text(`GST (${data.taxRate}%):`, totalsX, y);
        doc.text(`₹${data.taxAmount.toFixed(2)}`, totalsX + colWidths[2], y);

        y += 20;
        doc.font('Helvetica-Bold');
        doc.text('Total:', totalsX, y);
        doc.text(`₹${data.total.toFixed(2)}`, totalsX + colWidths[2], y);

        // Payment Status
        doc.moveDown(3);
        const statusColor =
          data.paymentStatus === 'PAID'
            ? '#22c55e'
            : data.paymentStatus === 'PAST_DUE'
              ? '#ef4444'
              : '#f59e0b';
        doc
          .fillColor(statusColor)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`Payment Status: ${data.paymentStatus}`, { align: 'center' });

        if (data.paidAt) {
          doc
            .fillColor('#666666')
            .fontSize(10)
            .font('Helvetica')
            .text(`Paid on: ${formatDate(data.paidAt, 'MMM dd, yyyy')}`, {
              align: 'center',
            });
        }

        // Footer
        doc
          .fillColor('#666666')
          .fontSize(8)
          .text('Thank you for your business!', 50, doc.page.height - 50, {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateInvoiceForSubscription(subscriptionId: string): Promise<string> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        price: true,
        vendorProfile: {
          include: { user: true },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Generate invoice number
    const invoiceCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${formatDate(new Date(), 'yyyyMM')}-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Calculate amounts
    const taxRate = 18;
    const subtotal = subscription.price ? Number(subscription.price.amount) : 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Create invoice
    const now = new Date();
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId,
        issuedAt: now,
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount: total,
        currency: 'INR',
        status: 'OPEN',
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        lineItems: {
          create: [
            {
              description: `${subscription.plan?.name || 'Subscription'} - ${subscription.price?.billingCycle || 'Monthly'}`,
              quantity: 1,
              unitPrice: subtotal,
              amount: subtotal,
            },
          ],
        },
      },
    });

    this.logger.log(`Generated invoice ${invoiceNumber} for subscription ${subscriptionId}`);

    return invoice.id;
  }

  /**
   * Generate invoice for a user subscription payment
   */
  async generateUserInvoice(
    userId: string,
    paymentDetails: {
      amount: number;
      currency: string;
      description: string;
      paymentId?: string;
      subscriptionId?: string;
    },
  ): Promise<string> {
    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate invoice number
    const invoiceCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${formatDate(new Date(), 'yyyyMM')}-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Calculate tax (18% GST for India)
    const taxRate = 18;
    const subtotal = paymentDetails.amount;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const now = new Date();

    // Create invoice
    const invoiceData: any = {
      invoiceNumber,
      issuedAt: now,
      dueDate: now,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount: total,
      currency: paymentDetails.currency,
      status: 'PAID',
      paidAt: now,
      periodStart: now,
      periodEnd: now,
      lineItems: {
        create: [
          {
            description: paymentDetails.description,
            quantity: 1,
            unitPrice: subtotal,
            amount: subtotal,
          },
        ],
      },
    };

    // Connect subscription if provided
    if (paymentDetails.subscriptionId) {
      invoiceData.subscriptionId = paymentDetails.subscriptionId;
    }

    const invoice = await this.prisma.invoice.create({
      data: invoiceData,
    });

    this.logger.log(`Generated user invoice ${invoiceNumber} for user ${userId}`);

    return invoice.id;
  }
}
