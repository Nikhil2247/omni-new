import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CategoryLookup, CityLookup, EventTypeLookup } from '../types/lookup.types'

const extractArray = <T>(payload: unknown, nestedKey?: string): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const record = payload as Record<string, unknown>
  const directData = record.data

  if (Array.isArray(directData)) {
    return directData as T[]
  }

  if (nestedKey && directData && typeof directData === 'object') {
    const nested = (directData as Record<string, unknown>)[nestedKey]
    if (Array.isArray(nested)) {
      return nested as T[]
    }
  }

  if (nestedKey) {
    const nested = record[nestedKey]
    if (Array.isArray(nested)) {
      return nested as T[]
    }
  }

  return []
}

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
    return extractArray<EventTypeLookup>(response.data, 'eventTypes')
  },

  async getCities() {
    const response = await apiClient.get<CityLookup[]>(
      API_ENDPOINTS.USER.LOOKUPS.CITIES,
    )
    return extractArray<CityLookup>(response.data, 'cities')
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
        const categories = extractArray<CategoryLookup>(response.data, 'categories')

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
