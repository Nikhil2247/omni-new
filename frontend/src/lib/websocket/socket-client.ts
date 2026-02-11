// ============================================================================
// WEBSOCKET CLIENT - Real-time Communication
// ============================================================================
// Socket.IO client for real-time notifications and messaging
// ============================================================================

import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'

export interface SocketConfig {
  namespace: string
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

export class SocketClient {
  private socket: Socket | null = null
  private config: SocketConfig
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private listeners: Map<string, Function[]> = new Map()

  constructor(config: SocketConfig) {
    this.config = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config,
    }
  }

  /**
   * Connect to WebSocket server with authentication
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log(`[SocketClient] Already connected to ${this.config.namespace}`)
      return
    }

    console.log(`[SocketClient] Connecting to ${SOCKET_URL}${this.config.namespace}`)

    this.socket = io(`${SOCKET_URL}${this.config.namespace}`, {
      auth: {
        token,
      },
      query: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      autoConnect: this.config.autoConnect,
    })

    this.setupEventHandlers()
    this.registerStoredListeners()
  }

  /**
   * Register all stored listeners with the socket
   * This is needed because listeners may be added before the socket connects
   */
  private registerStoredListeners(): void {
    if (!this.socket) return

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket!.on(event, callback as any)
      })
    })
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log(`[SocketClient] Connected to ${this.config.namespace}`)
      this.reconnectAttempts = 0
      this.emitToListeners('connected', {})
    })

    this.socket.on('disconnect', (reason) => {
      console.log(`[SocketClient] Disconnected from ${this.config.namespace}:`, reason)
      this.emitToListeners('disconnected', { reason })
    })

    this.socket.on('connect_error', (error) => {
      console.error(`[SocketClient] Connection error on ${this.config.namespace}:`, error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[SocketClient] Max reconnection attempts reached')
        this.emitToListeners('connection_failed', { error })
      }
    })

    this.socket.on('error', (error) => {
      console.error(`[SocketClient] Socket error on ${this.config.namespace}:`, error)
      this.emitToListeners('error', { error })
    })
  }

  /**
   * Subscribe to a specific event
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)

    // Also register with socket if connected
    if (this.socket) {
      this.socket.on(event, callback as any)
    }
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      const listeners = this.listeners.get(event) || []
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
      if (this.socket) {
        this.socket.off(event, callback as any)
      }
    } else {
      this.listeners.delete(event)
      if (this.socket) {
        this.socket.off(event)
      }
    }
  }

  /**
   * Emit event to server
   */
  emit(event: string, data: any): void {
    if (!this.socket) {
      console.warn(`[SocketClient] Cannot emit ${event}: socket not initialized`)
      return
    }
    // Socket.IO will queue emits until the connection is established.
    this.socket.emit(event, data)
  }

  /**
   * Emit to local listeners
   */
  private emitToListeners(event: string, data: any): void {
    const listeners = this.listeners.get(event) || []
    listeners.forEach(callback => callback(data))
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      console.log(`[SocketClient] Disconnected from ${this.config.namespace}`)
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }
}
