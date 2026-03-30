import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetService } from '@/lib/api/services/budget.service'
import type { Budget } from '@/lib/api/types/budget.types'
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
    onSuccess: (data, variables) => {
      // Immediately set the cache with the new budget data
      queryClient.setQueryData(budgetKeys.byEvent(variables.eventId), data)
      // Also invalidate to ensure fresh data
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
    mutationFn: ({ budgetId: overrideBudgetId, ...input }: CreateBudgetItemInput & { budgetId?: string }) => {
      const targetBudgetId = overrideBudgetId || budgetId
      if (!targetBudgetId) {
        return Promise.reject(new Error('Budget ID missing'))
      }
      return budgetService.addItem(targetBudgetId, input)
    },
    onSuccess: () => {
      // Invalidate to refetch the full budget with all items
      queryClient.invalidateQueries({ queryKey: budgetKeys.byEvent(eventId) })
    },
  })
}

export function useUpdateBudgetItem(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateBudgetItemInput }) =>
      budgetService.updateItem(itemId, input),
    onMutate: async ({ itemId, input }) => {
      await queryClient.cancelQueries({ queryKey: budgetKeys.byEvent(eventId) })
      const previousBudget = queryClient.getQueryData<Budget | null>(budgetKeys.byEvent(eventId))

      if (previousBudget?.items?.length) {
        const updatedItems = previousBudget.items.map((item) =>
          item.id === itemId ? { ...item, ...input } : item,
        )
        queryClient.setQueryData<Budget | null>(budgetKeys.byEvent(eventId), {
          ...previousBudget,
          items: updatedItems,
        })
      }

      return { previousBudget }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBudget) {
        queryClient.setQueryData(budgetKeys.byEvent(eventId), context.previousBudget)
      }
    },
    onSettled: () => {
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
