import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundService, businessRefundService } from '@/lib/api/services/refund.service';
import { CreateRefundRequestDto } from '@/lib/api/types/refund.types';
import { paymentKeys } from './use-payment';

// Query keys
export const refundKeys = {
  all: ['refunds'] as const,
  list: (limit?: number) => [...refundKeys.all, 'list', limit] as const,
  detail: (id: string) => [...refundKeys.all, 'detail', id] as const,
  businessList: (limit?: number) => [...refundKeys.all, 'business', 'list', limit] as const,
  businessDetail: (id: string) => [...refundKeys.all, 'business', 'detail', id] as const,
};

// User refund hooks
export function useRefundRequests(limit?: number, offset?: number) {
  return useQuery({
    queryKey: refundKeys.list(limit),
    queryFn: () => refundService.getRefundRequests(limit, offset),
    staleTime: 30 * 1000,
  });
}

export function useRefundRequestDetail(id: string) {
  return useQuery({
    queryKey: refundKeys.detail(id),
    queryFn: () => refundService.getRefundRequestById(id),
    enabled: !!id,
  });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRefundRequestDto) => refundService.requestRefund(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

// Business refund hooks
export function useBusinessRefundRequests(limit?: number, offset?: number) {
  return useQuery({
    queryKey: refundKeys.businessList(limit),
    queryFn: () => businessRefundService.getRefundRequests(limit, offset),
    staleTime: 30 * 1000,
  });
}

export function useBusinessRefundRequestDetail(id: string) {
  return useQuery({
    queryKey: refundKeys.businessDetail(id),
    queryFn: () => businessRefundService.getRefundRequestById(id),
    enabled: !!id,
  });
}

export function useBusinessRequestRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRefundRequestDto) => businessRefundService.requestRefund(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
