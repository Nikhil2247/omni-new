import { useQuery } from '@tanstack/react-query'
import { lookupService } from '@/lib/api/services/lookup.service'

export const lookupKeys = {
  all: ['lookups'] as const,
  eventTypes: () => [...lookupKeys.all, 'event-types'] as const,
}

export function useEventTypes() {
  return useQuery({
    queryKey: lookupKeys.eventTypes(),
    queryFn: () => lookupService.getEventTypes(),
  })
}
