import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { OpsDashboardResponse } from '../types/ops.types'

export const opsDashboardService = {
  getMetrics: async (): Promise<OpsDashboardResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.DASHBOARD.METRICS)
    return data
  },
}
