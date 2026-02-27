import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CategoryLookup, CityLookup, EventTypeLookup } from '../types/lookup.types'

export const lookupService = {
  async getEventTypes() {
    const response = await apiClient.get<EventTypeLookup[]>(
      API_ENDPOINTS.USER.LOOKUPS.EVENT_TYPES,
    )
    const payload = response.data as unknown as { data?: EventTypeLookup[] }
    return payload?.data ?? (response.data as EventTypeLookup[])
  },

  async getCities() {
    const response = await apiClient.get<CityLookup[]>(
      API_ENDPOINTS.USER.LOOKUPS.CITIES,
    )
    const payload = response.data as unknown as { data?: CityLookup[] }
    return payload?.data ?? (response.data as CityLookup[])
  },

  async getCategories() {
    const response = await apiClient.get<CategoryLookup[]>(
      API_ENDPOINTS.USER.LOOKUPS.CATEGORIES,
    )
    const payload = response.data as unknown as { data?: CategoryLookup[] }
    return payload?.data ?? (response.data as CategoryLookup[])
  },
}
