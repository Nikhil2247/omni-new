import { apiClient } from '../client';
import { Invoice, InvoiceListResponse } from '../types/invoice.types';

export const invoiceService = {
  /**
   * Get user invoices with optional pagination
   */
  getUserInvoices: async (limit?: number, offset?: number): Promise<InvoiceListResponse> => {
    const response = await apiClient.get<InvoiceListResponse>('/invoices', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get a specific invoice by ID
   */
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Download invoice PDF as blob
   */
  downloadInvoicePdf: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const businessInvoiceService = {
  /**
   * Get business invoices with optional pagination
   */
  getBusinessInvoices: async (limit?: number, offset?: number): Promise<InvoiceListResponse> => {
    const response = await apiClient.get<InvoiceListResponse>('/business/invoices', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get a specific business invoice by ID
   */
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/business/invoices/${id}`);
    return response.data;
  },

  /**
   * Download business invoice PDF as blob
   */
  downloadInvoicePdf: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/business/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
