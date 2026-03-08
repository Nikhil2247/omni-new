'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth-store'
import { notificationService, type NotificationListParams } from '@/lib/api/services/notification.service'
import type { NotificationItem } from '@/lib/api/types/notification.types'
import { getWebSocketConfig, isWebSocketEnabled } from '@/lib/websocket/config'

interface NotificationReadEvent {
  notificationIds: string[] | 'all'
  unreadCount: number
}

const dedupeNotifications = (items: NotificationItem[]): NotificationItem[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export const useNotifications = (params: NotificationListParams = {}) => {
  const { isAuthenticated, accessToken } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const typesKey = useMemo(() => params.types?.join('|') ?? '', [params.types])

  useEffect(() => {
    if (!isAuthenticated) return

    setLoading(true)
    Promise.all([
      notificationService.list(params),
      notificationService.unreadCount(),
    ])
      .then(([listResponse, unreadResponse]) => {
        setNotifications(dedupeNotifications(listResponse?.items ?? []))
        setUnreadCount(unreadResponse?.count ?? 0)
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, params.page, params.limit, params.unreadOnly, params.includeDismissed, typesKey])

  useEffect(() => {
    // Skip WebSocket connection if disabled or not authenticated
    if (!isWebSocketEnabled() || !isAuthenticated || !accessToken) {
      return
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Get WebSocket configuration
    const config = getWebSocketConfig('/notifications', accessToken)

    // Create socket connection
    const socket = io(config.url, {
      ...config.options,
      path: config.path,
    })

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Notifications] WebSocket connected')
      setConnected(true)
      setConnectionError(null)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Notifications] WebSocket disconnected:', reason)
      setConnected(false)

      // Don't show error for intentional disconnects
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        setConnectionError('Connection lost. Attempting to reconnect...')
      }
    })

    socket.on('connect_error', (error) => {
      console.error('[Notifications] WebSocket connection error:', error)
      setConnected(false)

      // Set user-friendly error message
      const errorMessage = error.message || 'Failed to connect to notification service'
      setConnectionError(errorMessage)

      // In development, provide more detailed error info
      if (process.env.NODE_ENV === 'development') {
        console.error('[Notifications] Connection details:', {
          url: config.url,
          path: config.path,
          error: errorMessage,
        })
      }
    })

    socket.on('error', (error) => {
      console.error('[Notifications] WebSocket error:', error)
      setConnectionError('An error occurred with the notification service')
    })

    // Notification event handlers
    socket.on('notification', (payload: NotificationItem) => {
      let inserted = false
      setNotifications((prev) => {
        if (prev.some((item) => item.id === payload.id)) {
          return prev
        }
        inserted = true
        return [payload, ...prev]
      })
      if (inserted && !payload.isRead) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    socket.on('notification:read', (payload: NotificationReadEvent) => {
      setUnreadCount(payload.unreadCount)
      if (payload.notificationIds === 'all') {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
      } else {
        const ids = new Set(payload.notificationIds)
        setNotifications((prev) => prev.map((item) => (ids.has(item.id) ? { ...item, isRead: true } : item)))
      }
    })

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, accessToken])

  const markRead = async (notificationIds: string[]) => {
    if (!notificationIds.length) return
    await notificationService.markRead(notificationIds)
    setNotifications((prev) => prev.map((item) => (notificationIds.includes(item.id) ? { ...item, isRead: true } : item)))
    setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
  }

  const markAllRead = async () => {
    await notificationService.markAllRead()
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
    setUnreadCount(0)
  }

  const dismiss = async (id: string) => {
    await notificationService.dismiss(id)
    setNotifications((prev) => prev.filter((item) => item.id !== id))
  }

  const dismissAll = async () => {
    if (!notifications.length) return
    await Promise.all(notifications.map((item) => notificationService.dismiss(item.id)))
    setNotifications([])
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    loading,
    connected,
    connectionError,
    markRead,
    markAllRead,
    dismiss,
    dismissAll,
  }
}
