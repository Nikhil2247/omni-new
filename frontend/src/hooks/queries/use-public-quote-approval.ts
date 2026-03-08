// ============================================================================
// PUBLIC QUOTE APPROVAL HOOKS - React Query Hooks
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  publicQuoteApprovalService,
  QuoteRejectInput,
} from '@/lib/api/services/public-quote-approval.service'

/**
 * Hook to fetch quote details by token
 */
export function useQuoteDetails(token: string) {
  return useQuery({
    queryKey: ['public-quote-approval', token],
    queryFn: () => publicQuoteApprovalService.getDetails(token),
    enabled: Boolean(token),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to approve quote
 */
export function useApproveQuote(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => publicQuoteApprovalService.approve(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-quote-approval', token] })
    },
  })
}

/**
 * Hook to reject quote
 */
export function useRejectQuote(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: QuoteRejectInput) => publicQuoteApprovalService.reject(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-quote-approval', token] })
    },
  })
}
