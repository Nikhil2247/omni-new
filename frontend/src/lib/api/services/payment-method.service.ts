import { apiClient } from '../client';
import {
  PaymentMethod,
  AddPaymentMethodDto,
  PaymentMethodsResponse,
  AddPaymentMethodResponse,
  SetDefaultPaymentMethodResponse,
  RemovePaymentMethodResponse,
} from '../types/payment-method.types';

/**
 * User Payment Method Service
 * Handles payment method management for regular users
 */
export const paymentMethodService = {
  /**
   * Get all saved payment methods for the current user
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get<PaymentMethodsResponse>(
      '/payments/methods'
    );
    return response.data.paymentMethods;
  },

  /**
   * Add a new payment method
   */
  addPaymentMethod: async (data: AddPaymentMethodDto): Promise<PaymentMethod> => {
    const response = await apiClient.post<AddPaymentMethodResponse>(
      '/payments/methods',
      data
    );
    return response.data.paymentMethod;
  },

  /**
   * Set a payment method as default
   */
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<SetDefaultPaymentMethodResponse> => {
    const response = await apiClient.post<SetDefaultPaymentMethodResponse>(
      `/payments/methods/${paymentMethodId}/default`
    );
    return response.data;
  },

  /**
   * Remove a payment method
   */
  removePaymentMethod: async (paymentMethodId: string): Promise<RemovePaymentMethodResponse> => {
    const response = await apiClient.delete<RemovePaymentMethodResponse>(
      `/payments/methods/${paymentMethodId}`
    );
    return response.data;
  },
};

/**
 * Business Payment Method Service
 * Handles payment method management for business/vendor accounts
 */
export const businessPaymentMethodService = {
  /**
   * Get all saved payment methods for the business
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get<PaymentMethodsResponse>(
      '/business/payments/methods'
    );
    return response.data.paymentMethods;
  },

  /**
   * Add a new payment method for business
   */
  addPaymentMethod: async (data: AddPaymentMethodDto): Promise<PaymentMethod> => {
    const response = await apiClient.post<AddPaymentMethodResponse>(
      '/business/payments/methods',
      data
    );
    return response.data.paymentMethod;
  },

  /**
   * Set a payment method as default for business
   */
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<SetDefaultPaymentMethodResponse> => {
    const response = await apiClient.post<SetDefaultPaymentMethodResponse>(
      `/business/payments/methods/${paymentMethodId}/default`
    );
    return response.data;
  },

  /**
   * Remove a payment method from business
   */
  removePaymentMethod: async (paymentMethodId: string): Promise<RemovePaymentMethodResponse> => {
    const response = await apiClient.delete<RemovePaymentMethodResponse>(
      `/business/payments/methods/${paymentMethodId}`
    );
    return response.data;
  },
};
