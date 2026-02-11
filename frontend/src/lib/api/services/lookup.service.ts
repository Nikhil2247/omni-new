import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { EventTypeLookup } from '../types/lookup.types'

export const lookupService = {
  async getEventTypes() {
    const response = await apiClient.get<EventTypeLookup[]>(
      API_ENDPOINTS.USER.LOOKUPS.EVENT_TYPES,
    )
    const payload = response.data as unknown as { data?: EventTypeLookup[] }
    return payload?.data ?? (response.data as EventTypeLookup[])
  },
}
