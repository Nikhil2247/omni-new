/**
 * Invoice status enum
 */
export type InvoiceStatus = 'OPEN' | 'PAID' | 'VOIDED';

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Invoice interface
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  paymentId?: string;
  lineItems?: InvoiceLineItem[];
  billingDetails?: {
    name?: string;
    email?: string;
    address?: string;
    taxId?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice list response with pagination
 */
export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Invoice download request params
 */
export interface InvoiceDownloadParams {
  invoiceId: string;
}
