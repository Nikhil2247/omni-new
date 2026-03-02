'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth-store'
import { notificationService, type NotificationListParams } from '@/lib/api/services/notification.service'
import type { NotificationItem } from '@/lib/api/types/notification.types'

interface NotificationReadEvent {
  notificationIds: string[] | 'all'
  unreadCount: number
}

const getWsBaseUrl = () => {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL
  if (wsUrl) return wsUrl

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  return apiUrl.replace(/\/api\/?$/, '')
}

const getSocketPath = () => process.env.NEXT_PUBLIC_SOCKET_PATH || '/api/socket.io'

export const useNotifications = (params: NotificationListParams = {}) => {
  const { isAuthenticated, accessToken } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  const wsBaseUrl = useMemo(() => getWsBaseUrl(), [])
  const socketPath = useMemo(() => getSocketPath(), [])
  const typesKey = useMemo(() => params.types?.join('|') ?? '', [params.types])

  useEffect(() => {
    if (!isAuthenticated) return

    setLoading(true)
    Promise.all([
      notificationService.list(params),
      notificationService.unreadCount(),
    ])
      .then(([listResponse, unreadResponse]) => {
        setNotifications(listResponse?.items ?? [])
        setUnreadCount(unreadResponse?.count ?? 0)
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, params.page, params.limit, params.unreadOnly, params.includeDismissed, typesKey])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const socket = io(`${wsBaseUrl}/notifications`, {
      auth: { token: accessToken },
      path: socketPath,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('notification', (payload: NotificationItem) => {
      setNotifications((prev) => [payload, ...prev])
      setUnreadCount((prev) => prev + 1)
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

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, accessToken, wsBaseUrl, socketPath])

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
    markRead,
    markAllRead,
    dismiss,
    dismissAll,
  }
}
