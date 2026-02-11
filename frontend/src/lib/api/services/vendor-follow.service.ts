import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { VendorFollowStatus, ToggleVendorFollowPayload } from '../types/vendor-follow.types'

export const vendorFollowService = {
  toggle: async (payload: ToggleVendorFollowPayload): Promise<VendorFollowStatus> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.VENDOR_FOLLOWS.TOGGLE, payload)
    return data?.data || data
  },
  status: async (vendorProfileId: string): Promise<VendorFollowStatus> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.VENDOR_FOLLOWS.STATUS(vendorProfileId))
    return data?.data || data
  },
}
