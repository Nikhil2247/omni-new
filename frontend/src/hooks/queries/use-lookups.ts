import { useQuery } from '@tanstack/react-query'
import { lookupService } from '@/lib/api/services/lookup.service'

export const lookupKeys = {
  all: ['lookups'] as const,
  eventTypes: () => [...lookupKeys.all, 'event-types'] as const,
  cities: () => [...lookupKeys.all, 'cities'] as const,
  categories: () => [...lookupKeys.all, 'categories'] as const,
}

export function useEventTypes() {
  return useQuery({
    queryKey: lookupKeys.eventTypes(),
    queryFn: () => lookupService.getEventTypes(),
  })
}

export function useCities() {
  return useQuery({
    queryKey: lookupKeys.cities(),
    queryFn: () => lookupService.getCities(),
    staleTime: 5 * 60_000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: lookupKeys.categories(),
    queryFn: () => lookupService.getCategories(),
    staleTime: 5 * 60_000,
  })
}
