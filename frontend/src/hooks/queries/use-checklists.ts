import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checklistService } from '@/lib/api/services/checklist.service'
import type { CreateChecklistInput, CreateChecklistItemInput, UpdateChecklistItemInput } from '@/lib/api/types/checklist.types'

export const checklistKeys = {
  all: ['checklists'] as const,
  byEvent: (eventId: string) => [...checklistKeys.all, 'event', eventId] as const,
}

export function useChecklist(eventId: string) {
  return useQuery({
    queryKey: checklistKeys.byEvent(eventId),
    queryFn: () => checklistService.getByEvent(eventId),
    enabled: Boolean(eventId),
  })
}

export function useCreateChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateChecklistInput) => checklistService.createChecklist(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byEvent(variables.eventId) })
    },
  })
}

export function useAddChecklistItem(eventId: string, checklistId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateChecklistItemInput) => {
      if (!checklistId) {
        return Promise.reject(new Error('Checklist ID missing'))
      }
      return checklistService.addItem(checklistId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateChecklistItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateChecklistItemInput }) =>
      checklistService.updateItem(itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byEvent(eventId) })
    },
  })
}

export function useDeleteChecklistItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => checklistService.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byEvent(eventId) })
    },
  })
}
