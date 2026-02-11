import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { VendorReview, CreateVendorReviewPayload, UpdateVendorReviewPayload } from '../types/vendor-review.types'

const unwrap = <T>(response: any): T => response?.data || response

export const vendorReviewService = {
  listForVendor: async (vendorProfileId: string): Promise<VendorReview[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.VENDOR_REVIEWS(vendorProfileId))
    return unwrap<VendorReview[]>(data)
  },
  listMine: async (): Promise<VendorReview[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.REVIEWS)
    return unwrap<VendorReview[]>(data)
  },
  create: async (payload: CreateVendorReviewPayload): Promise<VendorReview> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.REVIEWS, payload)
    return unwrap<VendorReview>(data)
  },
  update: async (id: string, payload: UpdateVendorReviewPayload): Promise<VendorReview> => {
    const { data } = await apiClient.patch(API_ENDPOINTS.USER.REVIEW_BY_ID(id), payload)
    return unwrap<VendorReview>(data)
  },
}
