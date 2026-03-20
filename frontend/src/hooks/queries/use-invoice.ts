import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService, businessInvoiceService } from '@/lib/api/services/invoice.service';
import { toast } from 'sonner';

// Query keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (limit?: number, offset?: number) => [...invoiceKeys.all, 'list', limit, offset] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
  businessList: (limit?: number, offset?: number) => [...invoiceKeys.all, 'business', 'list', limit, offset] as const,
  businessDetail: (id: string) => [...invoiceKeys.all, 'business', 'detail', id] as const,
};

// User invoice hooks
export function useUserInvoices(limit?: number, offset?: number) {
  return useQuery({
    queryKey: invoiceKeys.list(limit, offset),
    queryFn: () => invoiceService.getUserInvoices(limit, offset),
    staleTime: 30 * 1000,
  });
}

export function useInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceId),
    queryFn: () => invoiceService.getInvoiceById(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async ({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber?: string }) => {
      const blob = await invoiceService.downloadInvoicePdf(invoiceId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Invoice downloaded successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice', {
        description: 'Please try again later or contact support.',
      });
    },
  });
}

// Business invoice hooks
export function useBusinessInvoices(limit?: number, offset?: number) {
  return useQuery({
    queryKey: invoiceKeys.businessList(limit, offset),
    queryFn: () => businessInvoiceService.getBusinessInvoices(limit, offset),
    staleTime: 30 * 1000,
  });
}

export function useBusinessInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: invoiceKeys.businessDetail(invoiceId),
    queryFn: () => businessInvoiceService.getInvoiceById(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useDownloadBusinessInvoice() {
  return useMutation({
    mutationFn: async ({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber?: string }) => {
      const blob = await businessInvoiceService.downloadInvoicePdf(invoiceId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Invoice downloaded successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice', {
        description: 'Please try again later or contact support.',
      });
    },
  });
}
