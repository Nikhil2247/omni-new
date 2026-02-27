import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CategoryLookup, CityLookup, EventTypeLookup } from '../types/lookup.types'

const normalizeCategories = (categories: CategoryLookup[]) =>
  categories
    .map((category) => ({
      ...category,
      isActive: category.isActive ?? true,
    }))
    .sort((left, right) => {
      const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER
      const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }

      return left.name.localeCompare(right.name)
    })

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
    const endpointCandidates = [
      API_ENDPOINTS.BUSINESS.PROFILE.CATEGORIES,
      '/user/lookups/categories',
      API_ENDPOINTS.PUBLIC.DISCOVERY.CATEGORIES,
    ]

    for (const endpoint of endpointCandidates) {
      try {
        const response = await apiClient.get<CategoryLookup[]>(endpoint)
        const payload = response.data as unknown as { data?: CategoryLookup[] }
        const categories = payload?.data ?? (response.data as CategoryLookup[])

        if (Array.isArray(categories) && categories.length > 0) {
          return normalizeCategories(categories)
        }

        if (Array.isArray(categories)) {
          return normalizeCategories(categories)
        }
      } catch {
        continue
      }
    }

    return []
  },
}
