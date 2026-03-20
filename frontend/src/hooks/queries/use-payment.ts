import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, businessPaymentService } from '@/lib/api/services/payment.service';
import { CreateOrderRequest } from '@/lib/api/types/payment.types';

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  history: (limit?: number) => [...paymentKeys.all, 'history', limit] as const,
  detail: (id: string) => [...paymentKeys.all, 'detail', id] as const,
  businessHistory: (limit?: number) => [...paymentKeys.all, 'business', 'history', limit] as const,
  businessDetail: (id: string) => [...paymentKeys.all, 'business', 'detail', id] as const,
};

// User payment hooks
export function usePaymentHistory(limit?: number, offset?: number) {
  return useQuery({
    queryKey: paymentKeys.history(limit),
    queryFn: () => paymentService.getPaymentHistory(limit, offset),
    staleTime: 30 * 1000,
  });
}

export function usePaymentDetail(paymentId: string) {
  return useQuery({
    queryKey: paymentKeys.detail(paymentId),
    queryFn: () => paymentService.getPaymentById(paymentId),
    enabled: !!paymentId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => paymentService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

// Business payment hooks
export function useBusinessPaymentHistory(limit?: number, offset?: number) {
  return useQuery({
    queryKey: paymentKeys.businessHistory(limit),
    queryFn: () => businessPaymentService.getPaymentHistory(limit, offset),
    staleTime: 30 * 1000,
  });
}

export function useBusinessPaymentDetail(paymentId: string) {
  return useQuery({
    queryKey: paymentKeys.businessDetail(paymentId),
    queryFn: () => businessPaymentService.getPaymentById(paymentId),
    enabled: !!paymentId,
  });
}

export function useBusinessCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => businessPaymentService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
