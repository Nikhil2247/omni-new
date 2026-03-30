import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CreateTimelineInput, Timeline, TimelineItem } from '../types/timeline.types'

function toTimeline(candidate: any): Timeline | null {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null
  }

  const id = candidate.id ?? candidate.timelineId ?? candidate.timeline_id
  if (!id) return null

  return {
    ...(candidate as Timeline),
    id,
  }
}

function findTimelineCandidate(root: any, seen = new Set<any>(), depth = 0): Timeline | null {
  if (!root || typeof root !== 'object' || seen.has(root) || depth > 5) {
    return null
  }

  seen.add(root)

  if (Array.isArray(root)) {
    for (const item of root) {
      const fromArrayItem = findTimelineCandidate(item, seen, depth + 1)
      if (fromArrayItem) return fromArrayItem
    }
    return null
  }

  const direct = toTimeline(root)
  if (direct) return direct

  for (const value of Object.values(root)) {
    const nested = findTimelineCandidate(value, seen, depth + 1)
    if (nested) return nested
  }

  return null
}

function normalizeTimelinePayload(raw: any): Timeline | null {
  if (!raw) return null

  // Common wrappers
  const payload = raw?.data ?? raw

  return findTimelineCandidate(payload)
}

export const timelineService = {
  async getByEvent(eventId: string) {
    try {
      const response = await apiClient.get<any>(
        API_ENDPOINTS.USER.TIMELINE,
        { params: { eventId } },
      )

      return normalizeTimelinePayload(response.data)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async createTimeline(input: CreateTimelineInput) {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.USER.TIMELINE,
      input,
    )

    return normalizeTimelinePayload(response.data)
  },

  async deleteTimeline(id: string) {
    await apiClient.delete(API_ENDPOINTS.USER.TIMELINE_BY_ID(id))
  },

  async updateTimeline(id: string, updates: { name?: string; eventDate?: string }): Promise<Timeline> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.USER.TIMELINE_BY_ID(id),
      updates,
    )

    const normalized = normalizeTimelinePayload(response.data)
    if (!normalized) {
      throw new Error('Timeline update response missing timeline payload')
    }

    return normalized
  },

  async addItem(timelineId: string, item: { title: string; description?: string; scheduledTime: string; duration?: number }): Promise<TimelineItem> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.USER.TIMELINE_ITEMS(timelineId),
      item,
    )
    return response.data?.data || response.data
  },

  async updateItem(timelineId: string, itemId: string, updates: { title?: string; description?: string; scheduledTime?: string; duration?: number; isCompleted?: boolean }): Promise<TimelineItem> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.USER.TIMELINE_ITEM_BY_ID(timelineId, itemId),
      updates,
    )
    return response.data?.data || response.data
  },

  async deleteItem(timelineId: string, itemId: string): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.USER.TIMELINE_ITEM_BY_ID(timelineId, itemId),
    )
  },
}
