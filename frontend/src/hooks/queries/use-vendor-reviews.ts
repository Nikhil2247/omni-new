import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vendorReviewService } from '@/lib/api/services/vendor-review.service'
import type { CreateVendorReviewPayload, UpdateVendorReviewPayload, VendorReview } from '@/lib/api/types/vendor-review.types'

export const reviewKeys = {
  all: ['vendor-reviews'] as const,
  vendor: (vendorProfileId: string) => [...reviewKeys.all, 'vendor', vendorProfileId] as const,
  mine: () => [...reviewKeys.all, 'mine'] as const,
}

export function useVendorReviews(vendorProfileId: string) {
  return useQuery<VendorReview[]>({
    queryKey: reviewKeys.vendor(vendorProfileId),
    queryFn: () => vendorReviewService.listForVendor(vendorProfileId),
    enabled: !!vendorProfileId,
  })
}

export function useMyVendorReviews() {
  return useQuery<VendorReview[]>({
    queryKey: reviewKeys.mine(),
    queryFn: () => vendorReviewService.listMine(),
  })
}

export function useCreateVendorReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateVendorReviewPayload) => vendorReviewService.create(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.vendor(payload.vendorProfileId) })
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine() })
    },
  })
}

export function useUpdateVendorReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVendorReviewPayload }) => vendorReviewService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine() })
    },
  })
}
