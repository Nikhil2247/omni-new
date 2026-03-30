import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { timelineService } from '@/lib/api/services/timeline.service'
import type { CreateTimelineInput } from '@/lib/api/types/timeline.types'

export const timelineKeys = {
  all: ['timeline'] as const,
  byEvent: (eventId: string) => [...timelineKeys.all, 'event', eventId] as const,
}

export function useTimeline(eventId: string) {
  return useQuery({
    queryKey: timelineKeys.byEvent(eventId),
    queryFn: () => timelineService.getByEvent(eventId),
    enabled: Boolean(eventId),
  })
}

export function useCreateTimeline() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTimelineInput) => timelineService.createTimeline(input),
    onSuccess: (data, variables) => {
      // Immediately set the cache with the new timeline data
      queryClient.setQueryData(timelineKeys.byEvent(variables.eventId), data)
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: timelineKeys.byEvent(variables.eventId) })
    },
  })
}

export function useDeleteTimeline(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (timelineId: string) => timelineService.deleteTimeline(timelineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateTimeline(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; eventDate?: string } }) => 
      timelineService.updateTimeline(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.byEvent(eventId) })
    },
  })
}

export function useAddTimelineItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ timelineId, item }: { timelineId: string; item: { title: string; description?: string; scheduledTime: string; duration?: number } }) =>
      timelineService.addItem(timelineId, item),
    onSuccess: () => {
      // Invalidate to refetch the full timeline with all items
      queryClient.invalidateQueries({ queryKey: timelineKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateTimelineItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ timelineId, itemId, updates }: { timelineId: string; itemId: string; updates: { title?: string; description?: string; scheduledTime?: string; duration?: number; isCompleted?: boolean } }) => 
      timelineService.updateItem(timelineId, itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.byEvent(eventId) })
    },
  })
}

export function useDeleteTimelineItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ timelineId, itemId }: { timelineId: string; itemId: string }) => 
      timelineService.deleteItem(timelineId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.byEvent(eventId) })
    },
  })
}
