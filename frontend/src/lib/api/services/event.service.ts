import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type {
  CreateEventInput,
  EventDetail,
  EventSummary,
  SearchEventParams,
  UpdateEventInput,
} from '../types/event.types'

export const eventService = {
  async getEvents(params: SearchEventParams = {}) {
    const response = await apiClient.get<PaginatedResponse<EventSummary>>(
      API_ENDPOINTS.USER.EVENTS,
      { params },
    )
    const payload = response.data as unknown as {
      data?: EventSummary[]
      meta?: PaginatedResponse<EventSummary>['meta']
    }

    if (payload?.data && Array.isArray(payload.data)) {
      const meta = payload.meta
      return {
        data: payload.data,
        meta: {
          total: meta?.total ?? payload.data.length,
          page: meta?.page ?? 1,
          limit: meta?.limit ?? payload.data.length,
          totalPages: meta?.totalPages ?? 1,
          hasNextPage: meta?.hasNextPage ?? false,
          hasPreviousPage: meta?.hasPreviousPage ?? false,
        },
      }
    }

    const wrapped = response.data as unknown as { data?: PaginatedResponse<EventSummary> }
    return wrapped?.data ?? (response.data as PaginatedResponse<EventSummary>)
  },

  async getEvent(id: string) {
    const response = await apiClient.get<EventDetail>(
      API_ENDPOINTS.USER.EVENT_BY_ID(id),
    )
    const payload = response.data as unknown as { data?: EventDetail }
    return payload?.data ?? (response.data as EventDetail)
  },

  async createEvent(input: CreateEventInput) {
    const response = await apiClient.post<EventDetail>(
      API_ENDPOINTS.USER.EVENTS,
      input,
    )
    const payload = response.data as unknown as { data?: EventDetail }
    return payload?.data ?? (response.data as EventDetail)
  },

  async updateEvent(id: string, input: UpdateEventInput) {
    const response = await apiClient.put<EventDetail>(
      API_ENDPOINTS.USER.EVENT_BY_ID(id),
      input,
    )
    const payload = response.data as unknown as { data?: EventDetail }
    return payload?.data ?? (response.data as EventDetail)
  },

  async deleteEvent(id: string) {
    await apiClient.delete(API_ENDPOINTS.USER.EVENT_BY_ID(id))
  },
}
