import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { NotificationListResponse } from '../types/notification.types'

export interface NotificationListParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
  includeDismissed?: boolean
  types?: string[]
}

export const notificationService = {
  list: async (params: NotificationListParams = {}): Promise<NotificationListResponse> => {
    const queryParams = {
      ...params,
      ...(params.types && { types: params.types.join(',') }),
    }
    const { data } = await apiClient.get(API_ENDPOINTS.USER.NOTIFICATIONS.LIST, { params: queryParams })
    return data?.data || data
  },
  unreadCount: async (): Promise<{ count: number }> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.NOTIFICATIONS.UNREAD_COUNT)
    return data?.data || data
  },
  markRead: async (notificationIds: string[]): Promise<{ updated: number }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.NOTIFICATIONS.MARK_READ, { notificationIds })
    return data?.data || data
  },
  markAllRead: async (): Promise<{ updated: number }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.NOTIFICATIONS.MARK_ALL_READ)
    return data?.data || data
  },
  dismiss: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.NOTIFICATIONS.DISMISS(id))
    return data?.data || data
  },
}
