// ============================================================================
// WEBSOCKET PROVIDER - React Context for WebSocket
// ============================================================================
// Provides WebSocket connection management across the app
// ============================================================================

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { NotificationClient, Notification, KycEvent, KycEventCallback } from '@/lib/websocket/notification-client'
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

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Disconnect if not authenticated
      NotificationClient.disconnect()
      setIsConnected(false)
      return
    }

    // Initialize notification client
    NotificationClient.initialize(accessToken)

    // Subscribe to notifications
    const unsubscribe = NotificationClient.onNotification((notification) => {
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
    const checkConnection = setInterval(() => {
      setIsConnected(NotificationClient.isConnected())
    }, 1000)

    return () => {
      unsubscribe()
      clearInterval(checkConnection)
      NotificationClient.disconnect()
    }
  }, [isAuthenticated, accessToken])

  const markAsRead = (notificationIds: string[]) => {
    NotificationClient.markAsRead(notificationIds)
    setNotifications((prev) =>
      prev.map((n) =>
        notificationIds.includes(n.id) ? { ...n, read: true } : n
      )
    )
  }

  const subscribeToEvent = (eventId: string) => {
    NotificationClient.subscribeToEvent(eventId)
  }

  const unsubscribeFromEvent = (eventId: string) => {
    NotificationClient.unsubscribeFromEvent(eventId)
  }

  const subscribeToOpsKyc = () => {
    NotificationClient.subscribeToOpsKyc()
  }

  const unsubscribeFromOpsKyc = () => {
    NotificationClient.unsubscribeFromOpsKyc()
  }

  const onKycEvent = (callback: KycEventCallback) => {
    return NotificationClient.onKycEvent(callback)
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
