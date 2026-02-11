// ============================================================================
// NOTIFICATION CLIENT - Real-time Notifications
// ============================================================================
// Manages notification WebSocket connection and events
// ============================================================================

import { SocketClient } from './socket-client'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  createdAt: Date
  read?: boolean
  actionUrl?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface NotificationCallback {
  (notification: Notification): void
}

class NotificationClientClass {
  private client: SocketClient | null = null
  private callbacks: NotificationCallback[] = []

  /**
   * Initialize notification client
   */
  initialize(token: string): void {
    if (this.client?.isConnected()) {
      console.log('[NotificationClient] Already initialized')
      return
    }

    this.client = new SocketClient({
      namespace: '/notifications',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    this.setupEventListeners()
    this.client.connect(token)
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return

    // Listen for new notifications
    this.client.on('notification', (notification: Notification) => {
      console.log('[NotificationClient] Received notification:', notification)
      this.notifyCallbacks(notification)
    })

    // Listen for connection events
    this.client.on('connected', () => {
      console.log('[NotificationClient] Connected to notification server')
    })

    this.client.on('disconnected', ({ reason }: any) => {
      console.log('[NotificationClient] Disconnected:', reason)
    })

    this.client.on('error', ({ error }: any) => {
      console.error('[NotificationClient] Error:', error)
    })
  }

  /**
   * Subscribe to notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    this.callbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(notification: Notification): void {
    this.callbacks.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('[NotificationClient] Error in callback:', error)
      }
    })
  }

  /**
   * Mark notifications as read
   */
  markAsRead(notificationIds: string[]): void {
    if (!this.client?.isConnected()) {
      console.warn('[NotificationClient] Cannot mark as read: not connected')
      return
    }
    this.client.emit('mark:read', { notificationIds })
  }

  /**
   * Subscribe to specific event notifications
   */
  subscribeToEvent(eventId: string): void {
    if (!this.client?.isConnected()) {
      console.warn('[NotificationClient] Cannot subscribe: not connected')
      return
    }
    this.client.emit('subscribe:event', { eventId })
  }

  /**
   * Unsubscribe from event notifications
   */
  unsubscribeFromEvent(eventId: string): void {
    if (!this.client?.isConnected()) {
      console.warn('[NotificationClient] Cannot unsubscribe: not connected')
      return
    }
    this.client.emit('unsubscribe:event', { eventId })
  }

  /**
   * Disconnect from notification server
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect()
      this.client = null
      this.callbacks = []
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.isConnected() || false
  }
}

export const NotificationClient = new NotificationClientClass()
