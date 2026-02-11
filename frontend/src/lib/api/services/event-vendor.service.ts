import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { AddEventVendorInput, EventVendor, EventVendorStatus, UpdateEventVendorInput } from '../types/event-vendor.types'

export const eventVendorService = {
  async getByEvent(eventId: string, status?: EventVendorStatus) {
    const response = await apiClient.get<EventVendor[]>(
      API_ENDPOINTS.USER.EVENT_VENDORS,
      { params: { eventId, status } },
    )
    return response.data
  },

  async addVendor(input: AddEventVendorInput) {
    const response = await apiClient.post<EventVendor>(
      API_ENDPOINTS.USER.EVENT_VENDORS,
      input,
    )
    return response.data
  },

  async updateVendor(id: string, input: UpdateEventVendorInput) {
    const response = await apiClient.put<EventVendor>(
      API_ENDPOINTS.USER.EVENT_VENDOR_BY_ID(id),
      input,
    )
    return response.data
  },

  async deleteVendor(id: string) {
    await apiClient.delete(API_ENDPOINTS.USER.EVENT_VENDOR_BY_ID(id))
  },
}
