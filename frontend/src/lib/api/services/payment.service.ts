import { apiClient } from '../client';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentRecord,
} from '../types/payment.types';

// Helper to extract data from wrapped API response
const extractData = <T>(response: any): T => {
  // Handle wrapped response format: { success: true, data: {...} }
  if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data;
  }
  return response?.data;
};

export const paymentService = {
  // User payment endpoints
  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await apiClient.post('/user/payments/create-order', data);
    return extractData<CreateOrderResponse>(response);
  },

  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post('/user/payments/verify', data);
    return extractData<VerifyPaymentResponse>(response);
  },

  getPaymentHistory: async (limit?: number, offset?: number): Promise<PaymentRecord[]> => {
    const response = await apiClient.get('/user/payments/history', {
      params: { limit, offset },
    });
    return extractData<PaymentRecord[]>(response);
  },

  getPaymentById: async (paymentId: string): Promise<PaymentRecord> => {
    const response = await apiClient.get(`/user/payments/${paymentId}`);
    return extractData<PaymentRecord>(response);
  },
};

export const businessPaymentService = {
  // Business/Vendor payment endpoints
  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await apiClient.post('/business/payments/create-order', data);
    return extractData<CreateOrderResponse>(response);
  },

  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post('/business/payments/verify', data);
    return extractData<VerifyPaymentResponse>(response);
  },

  getPaymentHistory: async (limit?: number, offset?: number): Promise<PaymentRecord[]> => {
    const response = await apiClient.get('/business/payments/history', {
      params: { limit, offset },
    });
    return extractData<PaymentRecord[]>(response);
  },

  getPaymentById: async (paymentId: string): Promise<PaymentRecord> => {
    const response = await apiClient.get(`/business/payments/${paymentId}`);
    return extractData<PaymentRecord>(response);
  },
};
