// ============================================================================
// EXPORT SERVICE - PDF/CSV Generation
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';

// Type imports for data structures
interface ChecklistItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  isCompleted: boolean;
  completedAt?: Date | null;
  sortOrder: number;
}

interface Checklist {
  id: string;
  name: string;
  items?: ChecklistItem[];
}

interface Guest {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  rsvpStatus: string;
  plusOne: number;
  tableNumber?: number | null;
  dietaryReq?: string | null;
  notes?: string | null;
}

interface Guestlist {
  id: string;
  guests?: Guest[];
}

interface BudgetItem {
  id: string;
  category: string;
  name: string;
  estimatedCost?: number | null;
  actualCost?: number | null;
  isPaid: boolean;
  notes?: string | null;
}

interface Budget {
  id: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  items?: BudgetItem[];
}

// Quotation/Invoice interfaces
interface QuotationLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface QuotationData {
  quotationNumber: string;
  currency: string;
  items: QuotationLineItem[];
  subtotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  discount?: number | null;
  discountType?: string | null;
  totalAmount: number;
  notes?: string | null;
  termsAndConditions?: string | null;
  validUntil?: Date | null;
  createdAt: Date;
  vendorInfo: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  clientInfo: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  eventInfo?: {
    name?: string;
    date?: Date;
    venue?: string;
  };
}

interface InvoiceData extends QuotationData {
  invoiceNumber: string;
  dueDate?: Date | null;
  paidAt?: Date | null;
  status: string;
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  // ==================== CHECKLIST EXPORTS ====================

  async generateChecklistPdf(
    checklist: Checklist,
    eventName: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(eventName, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(16)
        .font('Helvetica')
        .text(`Checklist: ${checklist.name}`, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Generated on ${new Date().toLocaleDateString()}`, {
          align: 'center',
        });
      doc.moveDown(1.5);

      // Items
      const items = checklist.items || [];
      const completed = items.filter((i) => i.isCompleted).length;
      const total = items.length;

      doc.fillColor('#000');
      doc.fontSize(12).text(`Progress: ${completed}/${total} items completed`, {
        align: 'left',
      });
      doc.moveDown(1);

      // Draw items
      items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach((item) => {
          const checkbox = item.isCompleted ? '[✓]' : '[ ]';
          const status = item.isCompleted
            ? '(Completed)'
            : item.dueDate
              ? `(Due: ${new Date(item.dueDate).toLocaleDateString()})`
              : '';

          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(`${checkbox} ${item.title}`, {
              continued: status ? true : false,
            });
          if (status) {
            doc.font('Helvetica').fillColor('#666').text(` ${status}`);
          }

          if (item.description) {
            doc.fillColor('#444').fontSize(10).text(`   ${item.description}`);
          }

          doc.fillColor('#000').moveDown(0.5);
        });

      doc.end();
    });
  }

  generateChecklistCsv(checklist: Checklist): string {
    const items = checklist.items || [];
    const data = items.map((item) => ({
      Title: item.title,
      Description: item.description || '',
      'Due Date': item.dueDate
        ? new Date(item.dueDate).toLocaleDateString()
        : '',
      Completed: item.isCompleted ? 'Yes' : 'No',
      'Completed At': item.completedAt
        ? new Date(item.completedAt).toLocaleDateString()
        : '',
    }));

    return stringify(data, { header: true });
  }

  // ==================== GUESTLIST EXPORTS ====================

  async generateGuestlistPdf(
    guestlist: Guestlist,
    eventName: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        layout: 'landscape',
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(eventName, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(16)
        .font('Helvetica')
        .text('Guest List', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Generated on ${new Date().toLocaleDateString()}`, {
          align: 'center',
        });
      doc.moveDown(1.5);

      const guests = guestlist.guests || [];
      const attending = guests.filter(
        (g) => g.rsvpStatus === 'ATTENDING',
      ).length;
      const totalGuests = guests.reduce((sum, g) => sum + 1 + g.plusOne, 0);

      doc.fillColor('#000');
      doc
        .fontSize(12)
        .text(
          `Total Guests: ${guests.length} | Attending: ${attending} | Total Headcount: ${totalGuests}`,
        );
      doc.moveDown(1);

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 180;
      const col3 = 280;
      const col4 = 380;
      const col5 = 450;
      const col6 = 520;
      const col7 = 590;

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Name', col1, tableTop);
      doc.text('Email', col2, tableTop);
      doc.text('Phone', col3, tableTop);
      doc.text('RSVP', col4, tableTop);
      doc.text('+1', col5, tableTop);
      doc.text('Table', col6, tableTop);
      doc.text('Dietary', col7, tableTop);

      doc
        .moveTo(col1, tableTop + 15)
        .lineTo(750, tableTop + 15)
        .stroke();

      // Table rows
      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);

      guests.forEach((guest) => {
        if (y > 500) {
          doc.addPage();
          y = 50;
        }

        const name = `${guest.firstName} ${guest.lastName || ''}`.trim();
        doc.text(name.substring(0, 20), col1, y);
        doc.text((guest.email || '').substring(0, 20), col2, y);
        doc.text(guest.phone || '', col3, y);
        doc.text(guest.rsvpStatus, col4, y);
        doc.text(guest.plusOne.toString(), col5, y);
        doc.text(guest.tableNumber?.toString() || '', col6, y);
        doc.text((guest.dietaryReq || '').substring(0, 15), col7, y);

        y += 18;
      });

      doc.end();
    });
  }

  generateGuestlistCsv(guestlist: Guestlist): string {
    const guests = guestlist.guests || [];
    const data = guests.map((guest) => ({
      'First Name': guest.firstName,
      'Last Name': guest.lastName || '',
      Email: guest.email || '',
      Phone: guest.phone || '',
      'RSVP Status': guest.rsvpStatus,
      'Plus One': guest.plusOne,
      'Table Number': guest.tableNumber || '',
      'Dietary Requirements': guest.dietaryReq || '',
      Notes: guest.notes || '',
    }));

    return stringify(data, { header: true });
  }

  // ==================== BUDGET EXPORTS ====================

  async generateBudgetPdf(budget: Budget, eventName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(eventName, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(16)
        .font('Helvetica')
        .text('Budget Summary', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`Generated on ${new Date().toLocaleDateString()}`, {
          align: 'center',
        });
      doc.moveDown(1.5);

      // Summary box
      doc.fillColor('#000');
      doc.rect(50, doc.y, 500, 80).stroke();
      const summaryY = doc.y + 15;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(
        `Total Budget: $${budget.totalBudget.toLocaleString()}`,
        70,
        summaryY,
      );
      doc.text(
        `Total Spent: $${budget.totalSpent.toLocaleString()}`,
        70,
        summaryY + 20,
      );

      const remaining = budget.remaining;
      const remainingColor = remaining >= 0 ? '#008000' : '#FF0000';
      doc.fillColor(remainingColor);
      doc.text(`Remaining: $${remaining.toLocaleString()}`, 70, summaryY + 40);

      doc.fillColor('#000');
      doc.moveDown(5);

      // Items by category
      const items = budget.items || [];
      const categories = [...new Set(items.map((i) => i.category))];

      categories.forEach((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        const categoryTotal = categoryItems.reduce(
          (sum, i) => sum + (i.actualCost || i.estimatedCost || 0),
          0,
        );

        doc.fontSize(14).font('Helvetica-Bold').text(category);
        doc
          .fontSize(10)
          .fillColor('#666')
          .text(`Subtotal: $${categoryTotal.toLocaleString()}`);
        doc.moveDown(0.5);

        categoryItems.forEach((item) => {
          const estimated = item.estimatedCost
            ? `Est: $${item.estimatedCost.toLocaleString()}`
            : '';
          const actual = item.actualCost
            ? `Actual: $${item.actualCost.toLocaleString()}`
            : '';
          const paid = item.isPaid ? '(Paid)' : '';

          doc.fillColor('#000').fontSize(11).font('Helvetica');
          doc.text(`  • ${item.name}`);
          doc.fillColor('#444').fontSize(9);
          doc.text(
            `    ${[estimated, actual, paid].filter(Boolean).join(' | ')}`,
          );
        });

        doc.moveDown(1);
      });

      doc.end();
    });
  }

  generateBudgetCsv(budget: Budget): string {
    const items = budget.items || [];
    const data = items.map((item) => ({
      Category: item.category,
      Name: item.name,
      'Estimated Cost': item.estimatedCost || '',
      'Actual Cost': item.actualCost || '',
      Paid: item.isPaid ? 'Yes' : 'No',
      Notes: item.notes || '',
    }));

    // Add summary row
    data.push({
      Category: 'TOTAL',
      Name: '',
      'Estimated Cost': items.reduce(
        (sum, i) => sum + (i.estimatedCost || 0),
        0,
      ),
      'Actual Cost': items.reduce((sum, i) => sum + (i.actualCost || 0), 0),
      Paid: '',
      Notes: '',
    } as any);

    return stringify(data, { header: true });
  }

  // ==================== QUOTATION EXPORTS ====================

  async generateQuotationPdf(data: QuotationData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const currencySymbol = this.getCurrencySymbol(data.currency);

      // Header - Quotation title
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('QUOTATION', { align: 'center' });
      doc.moveDown(0.5);

      // Quotation number and date
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      doc.text(`Quotation #: ${data.quotationNumber}`, { align: 'center' });
      doc.text(
        `Date: ${new Date(data.createdAt).toLocaleDateString()}`,
        { align: 'center' },
      );
      if (data.validUntil) {
        doc.text(
          `Valid Until: ${new Date(data.validUntil).toLocaleDateString()}`,
          { align: 'center' },
        );
      }
      doc.moveDown(1.5);

      // Two column layout for vendor and client info
      const startY = doc.y;

      // From (Vendor Info) - Left side
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('From:', 50, startY);
      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.text(data.vendorInfo.businessName, 50);
      if (data.vendorInfo.address) doc.text(data.vendorInfo.address, 50);
      if (data.vendorInfo.phone) doc.text(`Phone: ${data.vendorInfo.phone}`, 50);
      if (data.vendorInfo.email) doc.text(`Email: ${data.vendorInfo.email}`, 50);
      if (data.vendorInfo.gstin) doc.text(`GSTIN: ${data.vendorInfo.gstin}`, 50);

      // To (Client Info) - Right side
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('To:', 300, startY);
      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.text(data.clientInfo.name, 300, startY + 15);
      let clientY = startY + 30;
      if (data.clientInfo.address) {
        doc.text(data.clientInfo.address, 300, clientY);
        clientY += 15;
      }
      if (data.clientInfo.phone) {
        doc.text(`Phone: ${data.clientInfo.phone}`, 300, clientY);
        clientY += 15;
      }
      if (data.clientInfo.email) {
        doc.text(`Email: ${data.clientInfo.email}`, 300, clientY);
      }

      doc.moveDown(5);

      // Event Info (if available)
      if (data.eventInfo) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Event Details:');
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        if (data.eventInfo.name) doc.text(`Event: ${data.eventInfo.name}`);
        if (data.eventInfo.date) {
          doc.text(`Date: ${new Date(data.eventInfo.date).toLocaleDateString()}`);
        }
        if (data.eventInfo.venue) doc.text(`Venue: ${data.eventInfo.venue}`);
        doc.moveDown(1);
      }

      // Line Items Table
      this.drawLineItemsTable(doc, data.items, currencySymbol);

      // Summary
      doc.moveDown(1);
      const summaryX = 350;

      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.text(`Subtotal:`, summaryX, doc.y, { continued: true, width: 100 });
      doc.text(`${currencySymbol}${data.subtotal.toLocaleString()}`, { align: 'right', width: 100 });

      if (data.discount && data.discount > 0) {
        const discountLabel = data.discountType === 'PERCENTAGE'
          ? `Discount:`
          : `Discount:`;
        doc.text(discountLabel, summaryX, doc.y, { continued: true, width: 100 });
        doc.text(`-${currencySymbol}${data.discount.toLocaleString()}`, { align: 'right', width: 100 });
      }

      if (data.taxRate && data.taxAmount) {
        doc.text(`Tax (${data.taxRate}%):`, summaryX, doc.y, { continued: true, width: 100 });
        doc.text(`${currencySymbol}${data.taxAmount.toLocaleString()}`, { align: 'right', width: 100 });
      }

      doc.moveDown(0.5);
      doc.moveTo(summaryX, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text(`Total:`, summaryX, doc.y, { continued: true, width: 100 });
      doc.text(`${currencySymbol}${data.totalAmount.toLocaleString()}`, { align: 'right', width: 100 });

      // Notes
      if (data.notes) {
        doc.moveDown(2);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Notes:');
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        doc.text(data.notes);
      }

      // Terms and Conditions
      if (data.termsAndConditions) {
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Terms & Conditions:');
        doc.fontSize(9).font('Helvetica').fillColor('#666');
        doc.text(data.termsAndConditions);
      }

      doc.end();
    });
  }

  async generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const currencySymbol = this.getCurrencySymbol(data.currency);

      // Header - Invoice title with status
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('INVOICE', { align: 'center' });
      doc.moveDown(0.3);

      // Status badge
      const statusColor = this.getStatusColor(data.status);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor);
      doc.text(data.status.toUpperCase(), { align: 'center' });
      doc.moveDown(0.5);

      // Invoice details
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      doc.text(`Invoice #: ${data.invoiceNumber}`, { align: 'center' });
      doc.text(
        `Issue Date: ${new Date(data.createdAt).toLocaleDateString()}`,
        { align: 'center' },
      );
      if (data.dueDate) {
        doc.text(
          `Due Date: ${new Date(data.dueDate).toLocaleDateString()}`,
          { align: 'center' },
        );
      }
      if (data.paidAt) {
        doc.fillColor('#008000');
        doc.text(
          `Paid On: ${new Date(data.paidAt).toLocaleDateString()}`,
          { align: 'center' },
        );
      }
      doc.moveDown(1.5);

      // Two column layout for vendor and client info
      const startY = doc.y;

      // From (Vendor Info) - Left side
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('From:', 50, startY);
      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.text(data.vendorInfo.businessName, 50);
      if (data.vendorInfo.address) doc.text(data.vendorInfo.address, 50);
      if (data.vendorInfo.phone) doc.text(`Phone: ${data.vendorInfo.phone}`, 50);
      if (data.vendorInfo.email) doc.text(`Email: ${data.vendorInfo.email}`, 50);
      if (data.vendorInfo.gstin) doc.text(`GSTIN: ${data.vendorInfo.gstin}`, 50);

      // Bill To (Client Info) - Right side
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('Bill To:', 300, startY);
      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.text(data.clientInfo.name, 300, startY + 15);
      let clientY = startY + 30;
      if (data.clientInfo.address) {
        doc.text(data.clientInfo.address, 300, clientY);
        clientY += 15;
      }
      if (data.clientInfo.phone) {
        doc.text(`Phone: ${data.clientInfo.phone}`, 300, clientY);
        clientY += 15;
      }
      if (data.clientInfo.email) {
        doc.text(`Email: ${data.clientInfo.email}`, 300, clientY);
      }

      doc.moveDown(5);

      // Event Info (if available)
      if (data.eventInfo) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Event Details:');
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        if (data.eventInfo.name) doc.text(`Event: ${data.eventInfo.name}`);
        if (data.eventInfo.date) {
          doc.text(`Date: ${new Date(data.eventInfo.date).toLocaleDateString()}`);
        }
        if (data.eventInfo.venue) doc.text(`Venue: ${data.eventInfo.venue}`);
        doc.moveDown(1);
      }

      // Line Items Table
      this.drawLineItemsTable(doc, data.items, currencySymbol);

      // Summary
      doc.moveDown(1);
      const summaryX = 350;

      doc.fontSize(10).font('Helvetica').fillColor('#333');
      doc.text(`Subtotal:`, summaryX, doc.y, { continued: true, width: 100 });
      doc.text(`${currencySymbol}${data.subtotal.toLocaleString()}`, { align: 'right', width: 100 });

      if (data.discount && data.discount > 0) {
        doc.text(`Discount:`, summaryX, doc.y, { continued: true, width: 100 });
        doc.text(`-${currencySymbol}${data.discount.toLocaleString()}`, { align: 'right', width: 100 });
      }

      if (data.taxRate && data.taxAmount) {
        doc.text(`Tax (${data.taxRate}%):`, summaryX, doc.y, { continued: true, width: 100 });
        doc.text(`${currencySymbol}${data.taxAmount.toLocaleString()}`, { align: 'right', width: 100 });
      }

      doc.moveDown(0.5);
      doc.moveTo(summaryX, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text(`Total Due:`, summaryX, doc.y, { continued: true, width: 100 });
      doc.text(`${currencySymbol}${data.totalAmount.toLocaleString()}`, { align: 'right', width: 100 });

      // Bank Details
      if (data.bankDetails && data.status !== 'PAID') {
        doc.moveDown(2);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Payment Details:');
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        if (data.bankDetails.accountName) {
          doc.text(`Account Name: ${data.bankDetails.accountName}`);
        }
        if (data.bankDetails.accountNumber) {
          doc.text(`Account Number: ${data.bankDetails.accountNumber}`);
        }
        if (data.bankDetails.ifscCode) {
          doc.text(`IFSC Code: ${data.bankDetails.ifscCode}`);
        }
        if (data.bankDetails.upiId) {
          doc.text(`UPI ID: ${data.bankDetails.upiId}`);
        }
      }

      // Notes
      if (data.notes) {
        doc.moveDown(1.5);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Notes:');
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        doc.text(data.notes);
      }

      // Terms
      if (data.termsAndConditions) {
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Terms & Conditions:');
        doc.fontSize(9).font('Helvetica').fillColor('#666');
        doc.text(data.termsAndConditions);
      }

      doc.end();
    });
  }

  // Helper method to draw line items table
  private drawLineItemsTable(
    doc: PDFKit.PDFDocument,
    items: QuotationLineItem[],
    currencySymbol: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;  // #
    const col2 = 70;  // Description
    const col3 = 320; // Qty
    const col4 = 380; // Rate
    const col5 = 460; // Amount

    // Table header
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
    doc.text('#', col1, tableTop);
    doc.text('Description', col2, tableTop);
    doc.text('Qty', col3, tableTop);
    doc.text('Rate', col4, tableTop);
    doc.text('Amount', col5, tableTop);

    // Header line
    doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table rows
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(10).fillColor('#333');

    items.forEach((item, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.text(`${index + 1}`, col1, y);
      doc.text(item.description.substring(0, 40), col2, y);
      doc.text(item.quantity.toString(), col3, y);
      doc.text(`${currencySymbol}${item.rate.toLocaleString()}`, col4, y);
      doc.text(`${currencySymbol}${item.amount.toLocaleString()}`, col5, y);

      y += 20;
    });

    // Bottom line
    doc.moveTo(col1, y).lineTo(550, y).stroke();
    doc.y = y + 10;
  }

  // Helper to get currency symbol
  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return symbols[currency] || currency + ' ';
  }

  // Helper to get status color
  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: '#FFA500',
      PARTIALLY_PAID: '#4169E1',
      PAID: '#008000',
      OVERDUE: '#FF0000',
      CANCELLED: '#808080',
    };
    return colors[status] || '#333';
  }
}
