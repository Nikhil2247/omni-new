import { useQuery } from '@tanstack/react-query'
import { opsDashboardService } from '@/lib/api/services/ops-dashboard.service'
import type { OpsDashboardMetrics } from '@/lib/api/types/ops.types'

export const opsDashboardKeys = {
  all: ['ops-dashboard'] as const,
  metrics: () => [...opsDashboardKeys.all, 'metrics'] as const,
}

export function useOpsDashboardMetrics() {
  return useQuery<OpsDashboardMetrics>({
    queryKey: opsDashboardKeys.metrics(),
    queryFn: async () => {
      const response = await opsDashboardService.getMetrics()
      return response.data
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
