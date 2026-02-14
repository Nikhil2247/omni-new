import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export interface SearchParams {
  q: string;
  type?: 'all' | 'vendors' | 'events' | 'content';
  page?: number;
  limit?: number;
  city?: string;
  state?: string;
  country?: string;
  categoryId?: string;
  categorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  isVerified?: boolean;
  sortBy?: 'relevance' | 'recent' | 'popular' | 'price_low' | 'price_high';
}

export interface QuickSearchParams {
  q: string;
  limit?: number;
}

export interface SearchSuggestionParams {
  q: string;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  type: 'vendor' | 'event' | 'content';
  title: string;
  description?: string;
  slug?: string;
  imageUrl?: string;
  category?: string;
  location?: string;
  price?: number;
  rating?: number;
  isVerified?: boolean;
  _matchScore?: number;
}

export interface GlobalSearchResponse {
  results: SearchResultItem[];
  meta: {
    query: string;
    totalResults: number;
    page: number;
    limit: number;
    totalPages: number;
    processingTimeMs: number;
    type: string;
  };
  facets?: {
    categories?: Record<string, number>;
    locations?: Record<string, number>;
    priceRanges?: Record<string, number>;
  };
}

export const searchApi = {
  /**
   * Global search
   */
  search: async (params: SearchParams): Promise<GlobalSearchResponse> => {
    const response = await apiClient.get<{ success: boolean; data: GlobalSearchResponse }>(
      API_ENDPOINTS.PUBLIC.SEARCH.GLOBAL,
      { params }
    );
    return response.data.data;
  },

  /**
   * Quick search for autocomplete
   */
  quickSearch: async (params: QuickSearchParams): Promise<SearchResultItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: SearchResultItem[] }>(
      API_ENDPOINTS.PUBLIC.SEARCH.QUICK,
      { params }
    );
    return response.data.data;
  },

  /**
   * Get search suggestions
   */
  getSuggestions: async (params: SearchSuggestionParams): Promise<string[]> => {
    const response = await apiClient.get<{ success: boolean; data: string[] }>(
      API_ENDPOINTS.PUBLIC.SEARCH.SUGGESTIONS,
      { params }
    );
    return response.data.data;
  },
};
