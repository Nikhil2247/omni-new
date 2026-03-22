import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnabledFeaturesResponse {
  features: string[];
  timestamp: string;
}

export interface AllFeaturesResponse {
  flags: FeatureFlag[];
  timestamp: string;
}

export const featuresService = {
  /**
   * Get all enabled feature flags (public endpoint)
   */
  getEnabledFeatures: async (): Promise<EnabledFeaturesResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.FEATURES.ENABLED)
    return data?.data || data
  },

  /**
   * Get all feature flags with details (public endpoint)
   */
  getAllFeatures: async (): Promise<AllFeaturesResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.FEATURES.ALL)
    return data?.data || data
  },
}
