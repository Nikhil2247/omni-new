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

const normalizeEventSummary = (event: EventSummary): EventSummary => {
  const normalizedDate = (event.eventDate ?? event.date ?? null) as string | null

  return {
    ...event,
    date: normalizedDate,
    eventDate: normalizedDate,
    guestCount: event.guestCount ?? 0,
    confirmedGuests: event.confirmedGuests ?? 0,
    declinedGuests: event.declinedGuests ?? 0,
    checklistProgress: event.checklistProgress ?? 0,
  }
}

const normalizeEventDetail = (event: EventDetail): EventDetail => {
  const base = normalizeEventSummary(event)
  return {
    ...event,
    ...base,
  }
}

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
      const normalizedData = payload.data.map((event) => normalizeEventSummary(event))
      return {
        data: normalizedData,
        meta: {
          total: meta?.total ?? normalizedData.length,
          page: meta?.page ?? 1,
          limit: meta?.limit ?? normalizedData.length,
          totalPages: meta?.totalPages ?? 1,
          hasNextPage: meta?.hasNextPage ?? false,
          hasPreviousPage: meta?.hasPreviousPage ?? false,
        },
      }
    }

    const wrapped = response.data as unknown as { data?: PaginatedResponse<EventSummary> }
    const raw = wrapped?.data ?? (response.data as PaginatedResponse<EventSummary>)

    return {
      ...raw,
      data: (raw.data || []).map((event) => normalizeEventSummary(event)),
    }
  },

  async getEvent(id: string) {
    const response = await apiClient.get<EventDetail>(
      API_ENDPOINTS.USER.EVENT_BY_ID(id),
    )
    const payload = response.data as unknown as { data?: EventDetail }
    const raw = payload?.data ?? (response.data as EventDetail)
    return normalizeEventDetail(raw)
  },

  async createEvent(input: CreateEventInput) {
    const response = await apiClient.post<EventDetail>(
      API_ENDPOINTS.USER.EVENTS,
      input,
    )
    const payload = response.data as unknown as { data?: EventDetail }
    const raw = payload?.data ?? (response.data as EventDetail)
    return normalizeEventDetail(raw)
  },

  async updateEvent(id: string, input: UpdateEventInput) {
    const response = await apiClient.put<EventDetail>(
      API_ENDPOINTS.USER.EVENT_BY_ID(id),
      input,
    )
    const payload = response.data as unknown as { data?: EventDetail }
    const raw = payload?.data ?? (response.data as EventDetail)
    return normalizeEventDetail(raw)
  },

  async deleteEvent(id: string) {
    await apiClient.delete(API_ENDPOINTS.USER.EVENT_BY_ID(id))
  },
}
