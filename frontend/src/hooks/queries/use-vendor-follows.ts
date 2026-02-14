import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorFollowService } from '@/lib/api/services/vendor-follow.service'
import type { VendorFollowStatus } from '@/lib/api/types/vendor-follow.types'
import { publicVendorKeys } from './use-public-vendors'

function updateFollowStateInCache(data: any, vendorProfileId: string, following: boolean) {
  const patchVendor = (vendor: any) => {
    if (!vendor || vendor.id !== vendorProfileId) return vendor
    const followersCount =
      typeof vendor.followersCount === 'number'
        ? Math.max(0, vendor.followersCount + (following ? 1 : -1))
        : vendor.followersCount

    return {
      ...vendor,
      isFollowing: following,
      followersCount,
    }
  }

  if (!data) return data
  if (Array.isArray(data)) {
    return data.map(patchVendor)
  }
  if (Array.isArray(data.data)) {
    return {
      ...data,
      data: data.data.map(patchVendor),
    }
  }
  return patchVendor(data)
}

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
    onMutate: async (vendorProfileId) => {
      await queryClient.cancelQueries({ queryKey: publicVendorKeys.all })

      const previousPublicQueries = queryClient.getQueriesData({ queryKey: publicVendorKeys.all })
      const previousStatus = queryClient.getQueryData<VendorFollowStatus>(followKeys.status(vendorProfileId))
      const optimisticFollowing = typeof previousStatus?.following === 'boolean' ? !previousStatus.following : true

      queryClient.setQueryData(followKeys.status(vendorProfileId), { following: optimisticFollowing })
      queryClient.setQueriesData({ queryKey: publicVendorKeys.all }, (oldData) =>
        updateFollowStateInCache(oldData, vendorProfileId, optimisticFollowing),
      )

      return { previousPublicQueries, previousStatus }
    },
    onError: (_error, vendorProfileId, context) => {
      if (context?.previousPublicQueries) {
        for (const [queryKey, queryData] of context.previousPublicQueries) {
          queryClient.setQueryData(queryKey, queryData)
        }
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(followKeys.status(vendorProfileId), context.previousStatus)
      }
    },
    onSuccess: (data, vendorProfileId) => {
      const following = Boolean(data?.following)
      queryClient.setQueryData(followKeys.status(vendorProfileId), { following })
      queryClient.setQueriesData({ queryKey: publicVendorKeys.all }, (oldData) =>
        updateFollowStateInCache(oldData, vendorProfileId, following),
      )
    },
  })
}
