import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventVendorService } from '@/lib/api/services/event-vendor.service'
import type { AddEventVendorInput, EventVendorStatus, UpdateEventVendorInput } from '@/lib/api/types/event-vendor.types'

export const eventVendorKeys = {
  all: ['event-vendors'] as const,
  byEvent: (eventId: string, status?: EventVendorStatus) =>
    [...eventVendorKeys.all, 'event', eventId, status] as const,
}

export function useEventVendors(eventId: string, status?: EventVendorStatus) {
  return useQuery({
    queryKey: eventVendorKeys.byEvent(eventId, status),
    queryFn: () => eventVendorService.getByEvent(eventId, status),
    enabled: Boolean(eventId),
  })
}

export function useAddEventVendor(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddEventVendorInput) => eventVendorService.addVendor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventVendorKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateEventVendor(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEventVendorInput }) =>
      eventVendorService.updateVendor(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventVendorKeys.byEvent(eventId) })
    },
  })
}

export function useDeleteEventVendor(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eventVendorService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventVendorKeys.byEvent(eventId) })
    },
  })
}
