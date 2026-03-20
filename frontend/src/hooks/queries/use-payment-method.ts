import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  paymentMethodService,
  businessPaymentMethodService,
} from '@/lib/api/services/payment-method.service';
import { AddPaymentMethodDto } from '@/lib/api/types/payment-method.types';

// Query keys for payment methods
export const paymentMethodKeys = {
  all: ['paymentMethods'] as const,
  user: () => [...paymentMethodKeys.all, 'user'] as const,
  business: () => [...paymentMethodKeys.all, 'business'] as const,
};

// ============================================
// User Payment Method Hooks
// ============================================

/**
 * Hook to fetch all payment methods for the current user
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentMethodKeys.user(),
    queryFn: () => paymentMethodService.getPaymentMethods(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add a new payment method
 */
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPaymentMethodDto) =>
      paymentMethodService.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.user() });
      toast.success('Payment method added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add payment method', {
        description: error.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to set a payment method as default
 */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentMethodService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.user() });
      toast.success('Default payment method updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to set default payment method', {
        description: error.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to remove a payment method
 */
export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      paymentMethodService.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.user() });
      toast.success('Payment method removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove payment method', {
        description: error.message || 'Please try again later',
      });
    },
  });
}

// ============================================
// Business Payment Method Hooks
// ============================================

/**
 * Hook to fetch all payment methods for the business
 */
export function useBusinessPaymentMethods() {
  return useQuery({
    queryKey: paymentMethodKeys.business(),
    queryFn: () => businessPaymentMethodService.getPaymentMethods(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add a new payment method for business
 */
export function useAddBusinessPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPaymentMethodDto) =>
      businessPaymentMethodService.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.business() });
      toast.success('Payment method added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add payment method', {
        description: error.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to set a payment method as default for business
 */
export function useSetDefaultBusinessPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      businessPaymentMethodService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.business() });
      toast.success('Default payment method updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to set default payment method', {
        description: error.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to remove a payment method for business
 */
export function useRemoveBusinessPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      businessPaymentMethodService.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.business() });
      toast.success('Payment method removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove payment method', {
        description: error.message || 'Please try again later',
      });
    },
  });
}
