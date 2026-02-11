import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetService } from '@/lib/api/services/budget.service'
import type { CreateBudgetInput, CreateBudgetItemInput, UpdateBudgetInput, UpdateBudgetItemInput } from '@/lib/api/types/budget.types'

export const budgetKeys = {
  all: ['budgets'] as const,
  byEvent: (eventId: string) => [...budgetKeys.all, 'event', eventId] as const,
}

export function useBudget(eventId: string) {
  return useQuery({
    queryKey: budgetKeys.byEvent(eventId),
    queryFn: () => budgetService.getByEvent(eventId),
    enabled: Boolean(eventId),
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => budgetService.createBudget(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byEvent(variables.eventId) })
    },
  })
}

export function useUpdateBudget(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ budgetId, input }: { budgetId: string; input: UpdateBudgetInput }) =>
      budgetService.updateBudget(budgetId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byEvent(eventId) })
    },
  })
}

export function useAddBudgetItem(eventId: string, budgetId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBudgetItemInput) => {
      if (!budgetId) {
        return Promise.reject(new Error('Budget ID missing'))
      }
      return budgetService.addItem(budgetId, input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateBudgetItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateBudgetItemInput }) =>
      budgetService.updateItem(itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byEvent(eventId) })
    },
  })
}

export function useDeleteBudgetItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => budgetService.deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byEvent(eventId) })
    },
  })
}
