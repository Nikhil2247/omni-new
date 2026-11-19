// ============================================================================
// WEBSOCKET PROVIDER - React Context for WebSocket
// ============================================================================
// Provides WebSocket connection management across the app
// ============================================================================

'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import type { Notification, KycEvent, KycEventCallback } from '@/lib/websocket/notification-client'

// socket.io is only needed for signed-in users, so the client is loaded on demand and never ships to logged-out visitors.
type NotificationClientType = typeof import('@/lib/websocket/notification-client').NotificationClient
const loadClient = () => import('@/lib/websocket/notification-client').then((m) => m.NotificationClient)
import { toast } from 'sonner'

interface WebSocketContextValue {
  isConnected: boolean
  notifications: Notification[]
  markAsRead: (notificationIds: string[]) => void
  subscribeToEvent: (eventId: string) => void
  unsubscribeFromEvent: (eventId: string) => void
  // Ops KYC real-time
  subscribeToOpsKyc: () => void
  unsubscribeFromOpsKyc: () => void
  onKycEvent: (callback: KycEventCallback) => () => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { accessToken, isAuthenticated } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const clientRef = useRef<NotificationClientType | null>(null)

  // Run fn once the client is available (immediately if already loaded).
  const withClient = (fn: (c: NotificationClientType) => void) => {
    if (clientRef.current) fn(clientRef.current)
    else loadClient().then((c) => { clientRef.current = c; fn(c) })
  }

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Disconnect if a client was ever loaded; otherwise there is nothing to do.
      clientRef.current?.disconnect()
      setIsConnected(false)
      return
    }

    let cancelled = false
    let unsubscribe = () => {}
    let checkConnection: ReturnType<typeof setInterval> | undefined

    loadClient().then((NotificationClient) => {
      if (cancelled) return
      clientRef.current = NotificationClient

      // Initialize notification client
      NotificationClient.initialize(accessToken)

      // Subscribe to notifications
      unsubscribe = NotificationClient.onNotification((notification) => {
        setNotifications((prev) => [notification, ...prev])

        // Show toast notification
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          toast.error(notification.title, {
            description: notification.message,
            action: notification.actionUrl ? {
              label: 'View',
              onClick: () => window.location.href = notification.actionUrl!,
            } : undefined,
          })
        } else {
          toast.info(notification.title, {
            description: notification.message,
          })
        }
      })

      // Update connection status
      checkConnection = setInterval(() => {
        setIsConnected(NotificationClient.isConnected())
      }, 1000)
    })

    return () => {
      cancelled = true
      unsubscribe()
      if (checkConnection) clearInterval(checkConnection)
      clientRef.current?.disconnect()
    }
  }, [isAuthenticated, accessToken])

  const markAsRead = (notificationIds: string[]) => {
    withClient((c) => c.markAsRead(notificationIds))
    setNotifications((prev) =>
      prev.map((n) =>
        notificationIds.includes(n.id) ? { ...n, read: true } : n
      )
    )
  }

  const subscribeToEvent = (eventId: string) => {
    withClient((c) => c.subscribeToEvent(eventId))
  }

  const unsubscribeFromEvent = (eventId: string) => {
    withClient((c) => c.unsubscribeFromEvent(eventId))
  }

  const subscribeToOpsKyc = () => {
    withClient((c) => c.subscribeToOpsKyc())
  }

  const unsubscribeFromOpsKyc = () => {
    withClient((c) => c.unsubscribeFromOpsKyc())
  }

  const onKycEvent = (callback: KycEventCallback) => {
    let unsub = () => {}
    let cancelled = false
    withClient((c) => {
      if (!cancelled) unsub = c.onKycEvent(callback)
    })
    return () => {
      cancelled = true
      unsub()
    }
  }

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        notifications,
        markAsRead,
        subscribeToEvent,
        unsubscribeFromEvent,
        subscribeToOpsKyc,
        unsubscribeFromOpsKyc,
        onKycEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
