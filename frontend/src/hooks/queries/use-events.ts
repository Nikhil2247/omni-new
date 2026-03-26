import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventService } from '@/lib/api/services/event.service'
import { subscriptionKeys } from './use-subscription'
import type {
  CreateEventInput,
  SearchEventParams,
  UpdateEventInput,
} from '@/lib/api/types/event.types'

export const eventKeys = {
  all: ['events'] as const,
  list: (params?: SearchEventParams) => [...eventKeys.all, 'list', params] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
}

export function useEvents(params: SearchEventParams = {}) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventService.getEvents(params),
  })
}

export function useEventsEnabled(params: SearchEventParams = {}, enabled = true) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => eventService.getEvents(params),
    enabled,
  })
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => eventService.getEvent(eventId),
    enabled: Boolean(eventId),
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEventInput) => eventService.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
      // Invalidate event credit balance since a credit was used
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.eventCreditBalance() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.eventCreditTransactions() })
    },
  })
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateEventInput) => eventService.updateEvent(eventId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) => eventService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}
