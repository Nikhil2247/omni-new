import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorFollowService } from '@/lib/api/services/vendor-follow.service'
import type { VendorFollowStatus } from '@/lib/api/types/vendor-follow.types'

export const followKeys = {
  all: ['vendor-follows'] as const,
  status: (vendorProfileId: string) => [...followKeys.all, 'status', vendorProfileId] as const,
}

export function useVendorFollowStatus(vendorProfileId: string, enabled = true) {
  return useQuery<VendorFollowStatus>({
    queryKey: followKeys.status(vendorProfileId),
    queryFn: () => vendorFollowService.status(vendorProfileId),
    enabled: enabled && !!vendorProfileId,
  })
}

export function useToggleVendorFollow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vendorProfileId: string) => vendorFollowService.toggle({ vendorProfileId }),
    onSuccess: (_data, vendorProfileId) => {
      queryClient.invalidateQueries({ queryKey: followKeys.status(vendorProfileId) })
    },
  })
}
