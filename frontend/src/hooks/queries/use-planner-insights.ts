import { useQuery } from '@tanstack/react-query'
import { plannerInsightsService } from '@/lib/api/services/planner-insights.service'

export const plannerInsightsKeys = {
  all: ['planner-insights'] as const,
  byEvent: (eventId: string) => [...plannerInsightsKeys.all, eventId] as const,
}

export function usePlannerInsights(eventId: string) {
  return useQuery({
    queryKey: plannerInsightsKeys.byEvent(eventId),
    queryFn: () => plannerInsightsService.getByEvent(eventId),
    enabled: Boolean(eventId),
  })
}
