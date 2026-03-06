// ============================================================================
// PUBLIC RSVP HOOKS - React Query Hooks
// ============================================================================

import { useMutation, useQuery } from '@tanstack/react-query'
import { publicRsvpService, RsvpSubmitInput } from '@/lib/api/services/public-rsvp.service'

/**
 * Hook to fetch RSVP details by token
 */
export function useRsvpDetails(token: string) {
  return useQuery({
    queryKey: ['public-rsvp', token],
    queryFn: () => publicRsvpService.getDetails(token),
    enabled: Boolean(token),
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to submit RSVP response
 */
export function useSubmitRsvp(token: string) {
  return useMutation({
    mutationFn: (data: RsvpSubmitInput) => publicRsvpService.submit(token, data),
  })
}
