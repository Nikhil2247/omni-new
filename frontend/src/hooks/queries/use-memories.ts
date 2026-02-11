import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memoryService } from '@/lib/api/services/memory.service'
import type { CreateMemoryInput } from '@/lib/api/types/memory.types'

export const memoryKeys = {
  all: ['memories'] as const,
  byEvent: (eventId: string) => [...memoryKeys.all, 'event', eventId] as const,
}

export function useMemories(eventId: string) {
  return useQuery({
    queryKey: memoryKeys.byEvent(eventId),
    queryFn: () => memoryService.getByEvent(eventId),
    enabled: Boolean(eventId),
    staleTime: 0, // Always refetch to avoid stale cache issues
  })
}

export function useCreateMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMemoryInput) => memoryService.createMemory(input),
    onSuccess: (data, variables) => {
      // Set the query data directly with the created memory
      queryClient.setQueryData(memoryKeys.byEvent(variables.eventId), data)
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: memoryKeys.byEvent(variables.eventId) })
    },
  })
}

export function useDeleteMemory(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memoryId: string) => memoryService.deleteMemory(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.byEvent(eventId) })
    },
  })
}
