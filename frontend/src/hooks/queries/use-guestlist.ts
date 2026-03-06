import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { guestlistService } from '@/lib/api/services/guestlist.service'
import type { CreateGuestInput, CreateGuestlistInput, UpdateGuestInput, UpdateRsvpInput } from '@/lib/api/types/guestlist.types'

export const guestlistKeys = {
  all: ['guestlist'] as const,
  byEvent: (eventId: string) => [...guestlistKeys.all, 'event', eventId] as const,
}

export function useGuestlist(eventId: string) {
  return useQuery({
    queryKey: guestlistKeys.byEvent(eventId),
    queryFn: () => guestlistService.getByEvent(eventId),
    enabled: Boolean(eventId),
  })
}

export function useCreateGuestlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGuestlistInput) => guestlistService.createGuestlist(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: guestlistKeys.byEvent(variables.eventId) })
    },
  })
}

export function useAddGuest(eventId: string, guestlistId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateGuestInput) => {
      if (!guestlistId) {
        return Promise.reject(new Error('Guestlist ID missing'))
      }
      return guestlistService.addGuest(guestlistId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestlistKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateGuest(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guestId, input }: { guestId: string; input: UpdateGuestInput }) =>
      guestlistService.updateGuest(guestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestlistKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateRsvp(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ guestId, input }: { guestId: string; input: UpdateRsvpInput }) =>
      guestlistService.updateRsvp(guestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestlistKeys.byEvent(eventId) })
    },
  })
}

export function useDeleteGuest(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guestId: string) => guestlistService.deleteGuest(guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestlistKeys.byEvent(eventId) })
    },
  })
}

export function useImportGuests(eventId: string, guestlistId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (csvContent: string) => {
      if (!guestlistId) {
        return Promise.reject(new Error('Guestlist ID missing'))
      }
      return guestlistService.importGuests(guestlistId, csvContent)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestlistKeys.byEvent(eventId) })
    },
  })
}

export function useGenerateMissingTokens(eventId: string, guestlistId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      if (!guestlistId) {
        return Promise.reject(new Error('Guestlist ID missing'))
      }
      return guestlistService.generateMissingTokens(guestlistId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestlistKeys.byEvent(eventId) })
    },
  })
}
