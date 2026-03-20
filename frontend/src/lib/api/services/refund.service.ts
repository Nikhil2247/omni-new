import { apiClient } from '../client';
import {
  RefundRequest,
  CreateRefundRequestDto,
  RefundRequestListResponse,
} from '../types/refund.types';

export const refundService = {
  // User refund endpoints
  requestRefund: async (data: CreateRefundRequestDto): Promise<RefundRequest> => {
    const response = await apiClient.post<RefundRequest>(
      `/payments/${data.paymentId}/refund-request`,
      {
        amount: data.amount,
        reason: data.reason,
      }
    );
    return response.data;
  },

  getRefundRequests: async (
    limit?: number,
    offset?: number
  ): Promise<RefundRequestListResponse> => {
    const response = await apiClient.get<RefundRequestListResponse>(
      '/payments/refund-requests',
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  getRefundRequestById: async (id: string): Promise<RefundRequest> => {
    const response = await apiClient.get<RefundRequest>(
      `/payments/refund-requests/${id}`
    );
    return response.data;
  },
};

export const businessRefundService = {
  // Business/Vendor refund endpoints
  requestRefund: async (data: CreateRefundRequestDto): Promise<RefundRequest> => {
    const response = await apiClient.post<RefundRequest>(
      `/business/payments/${data.paymentId}/refund-request`,
      {
        amount: data.amount,
        reason: data.reason,
      }
    );
    return response.data;
  },

  getRefundRequests: async (
    limit?: number,
    offset?: number
  ): Promise<RefundRequestListResponse> => {
    const response = await apiClient.get<RefundRequestListResponse>(
      '/business/payments/refund-requests',
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  getRefundRequestById: async (id: string): Promise<RefundRequest> => {
    const response = await apiClient.get<RefundRequest>(
      `/business/payments/refund-requests/${id}`
    );
    return response.data;
  },
};
