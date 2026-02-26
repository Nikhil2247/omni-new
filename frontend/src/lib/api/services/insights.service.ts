import { apiClient } from '../client';
import { API_ENDPOINTS } from '../endpoints';
import type { PlatformCounts, FunnelConversionRates } from '@/hooks/queries/use-platform-counts';

/**
 * Admin Insights Service
 * Handles all insights and analytics API calls
 */
export const insightsService = {
  /**
   * Get all platform counts
   */
  getCounts: async (): Promise<PlatformCounts> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.COUNTS);
    return data;
  },

  /**
   * Get funnel conversion rates
   */
  getFunnelConversionRates: async (): Promise<FunnelConversionRates> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.COUNTS_FUNNELS);
    return data;
  },

  /**
   * Get count for a specific entity
   */
  getEntityCount: async (
    entity:
      | 'users'
      | 'vendors'
      | 'leads'
      | 'events'
      | 'categories'
      | 'services'
      | 'portfolios'
      | 'reviews',
  ): Promise<{ entity: string; count: number }> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.COUNTS_ENTITY(entity));
    return data;
  },

  /**
   * Force refresh all counts
   */
  refreshCounts: async (): Promise<{ success: boolean; message: string; counts: PlatformCounts }> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.COUNTS_REFRESH);
    return data;
  },

  /**
   * Get executive summary
   */
  getExecutiveSummary: async (period?: 'day' | 'week' | 'month') => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.EXECUTIVE_SUMMARY, {
      params: { period },
    });
    return data;
  },

  /**
   * Get real-time statistics
   */
  getRealTimeStats: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.REAL_TIME);
    return data;
  },

  /**
   * Get platform growth metrics
   */
  getPlatformGrowth: async (period?: 'day' | 'week' | 'month') => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.PLATFORM_GROWTH, {
      params: { period },
    });
    return data;
  },

  /**
   * Get daily platform metrics
   */
  getPlatformDaily: async (params?: { startDate?: string; endDate?: string; days?: number }) => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.PLATFORM_DAILY, {
      params,
    });
    return data;
  },

  /**
   * Get active users (DAU/WAU/MAU)
   */
  getActiveUsers: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.ACTIVE_USERS);
    return data;
  },

  /**
   * Get engagement trends
   */
  getEngagementTrends: async (params?: { startDate?: string; endDate?: string; days?: number }) => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.ENGAGEMENT_TRENDS, {
      params,
    });
    return data;
  },

  /**
   * Get top vendors
   */
  getTopVendors: async (params?: { limit?: number; days?: number }) => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.TOP_VENDORS, {
      params,
    });
    return data;
  },

  /**
   * Get vendor rankings
   */
  getVendorRankings: async (params?: { limit?: number; days?: number }) => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.VENDOR_RANKINGS, {
      params,
    });
    return data;
  },

  /**
   * Get available funnels
   */
  getFunnels: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.FUNNELS);
    return data;
  },

  /**
   * Get funnel analysis
   */
  getFunnelAnalysis: async (funnelName: string, params: { startDate: string; endDate: string }) => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.FUNNEL_ANALYSIS(funnelName), {
      params,
    });
    return data;
  },

  /**
   * Get top drop-off points
   */
  getTopDropoffs: async (params: { startDate: string; endDate: string; limit?: number }) => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.ADMIN.INSIGHTS.FUNNELS}/dropoffs`, {
      params,
    });
    return data;
  },
};
