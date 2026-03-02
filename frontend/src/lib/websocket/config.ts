// ============================================================================
// WEBSOCKET CONFIGURATION - Environment-aware WebSocket setup
// ============================================================================
// Handles WebSocket URL construction for both local and production environments
// ============================================================================

import { ManagerOptions, SocketOptions } from 'socket.io-client'

export interface WebSocketConfig {
  url: string
  path: string
  options: Partial<ManagerOptions & SocketOptions>
}

/**
 * Get WebSocket base URL based on environment
 *
 * IMPORTANT: Socket.IO expects HTTP/HTTPS URLs, NOT ws/wss URLs.
 * Socket.IO automatically handles the WebSocket upgrade protocol internally.
 */
export const getWebSocketUrl = (): string => {
  // 1. Check for explicit WebSocket URL from environment
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL
  }

  // 2. Derive from API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl) {
    // Remove /api suffix if present and return as-is
    // Socket.IO expects http/https, NOT ws/wss
    return apiUrl.replace(/\/api\/?$/, '')
  }

  // 3. Fallback to localhost for development
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = window.location.hostname

    // In development, use port 3001 for backend
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${protocol}//${host}:3001`
    }

    // In production, use same host
    return `${protocol}//${host}`
  }

  // 4. Default fallback
  return 'http://localhost:3001'
}

/**
 * Get Socket.IO path (the path where Socket.IO server is mounted)
 */
export const getSocketPath = (): string => {
  return process.env.NEXT_PUBLIC_SOCKET_PATH || '/api/socket.io'
}

/**
 * Get allowed CORS origins for production
 */
export const getAllowedOrigins = (): string[] => {
  const origins = process.env.NEXT_PUBLIC_CORS_ORIGINS

  if (origins) {
    return origins.split(',').map((origin) => origin.trim()).filter(Boolean)
  }

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://omnicassion.com',
    'https://www.omnicassion.com',
    'https://backend.omnicassion.com',
  ]
}

/**
 * Get complete WebSocket configuration for Socket.IO client
 */
export const getWebSocketConfig = (
  namespace: string,
  token?: string,
): WebSocketConfig => {
  const url = getWebSocketUrl()
  const path = getSocketPath()

  const config: WebSocketConfig = {
    url: `${url}${namespace}`,
    path,
    options: {
      // Authentication
      auth: token ? { token } : undefined,

      // Transport configuration
      transports: ['websocket', 'polling'],

      // Reconnection strategy
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,

      // Connection settings
      autoConnect: true,
      timeout: 20000,

      // CORS settings
      withCredentials: true,

      // Extra headers for development
      extraHeaders: process.env.NODE_ENV === 'development'
        ? { 'X-Development': 'true' }
        : undefined,
    },
  }

  return config
}

/**
 * Check if WebSocket connection should be enabled
 * Useful for conditionally enabling WebSocket features
 */
export const isWebSocketEnabled = (): boolean => {
  // Disable WebSocket in test environment
  if (process.env.NODE_ENV === 'test') {
    return false
  }

  // Check if explicitly disabled
  if (process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true') {
    return false
  }

  return true
}

/**
 * Get reconnection configuration based on environment
 */
export const getReconnectionConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    reconnection: true,
    reconnectionAttempts: isDevelopment ? 10 : 5,
    reconnectionDelay: isDevelopment ? 2000 : 1000,
    reconnectionDelayMax: isDevelopment ? 10000 : 5000,
    randomizationFactor: 0.5,
  }
}
