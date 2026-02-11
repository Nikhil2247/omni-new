// ============================================================================
// NOTIFICATION GATEWAY - Real-time Notification Delivery
// ============================================================================
// WebSocket gateway for pushing notifications to connected clients
// Supports user-specific channels, broadcasts, and event subscriptions
// ============================================================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets'
import { Logger, Injectable } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { OnEvent } from '@nestjs/event-emitter'
import { NotificationType } from '@prisma/client'
import { TokenService } from '../../core/auth/token.service'
import { NotificationService } from '../notifications/notification.service'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AuthenticatedSocket extends Socket {
  userId?: string
  sessionId?: string
  organizationId?: string
  roles?: string[]
}

export interface NotificationPayload {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  createdAt: Date
  read?: boolean
  actionUrl?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}


export interface SubscribeToEventPayload {
  eventId: string
}

export interface MarkReadPayload {
  notificationIds: string[]
}

export interface ConnectionStats {
  totalConnections: number
  authenticatedConnections: number
  anonymousConnections: number
  userConnections: Map<string, number>
}

// ============================================================================
// NOTIFICATION GATEWAY
// ============================================================================

@Injectable()
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, server-to-server, etc.)
      if (!origin) {
        callback(null, true)
        return
      }
      // In development, allow localhost origins
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
      ]
      // Check environment-based allowed origins (set via CORS_ORIGINS env var)
      const corsOrigins = process.env.CORS_ORIGINS?.split(',') || []
      if (corsOrigins.includes(origin) || allowedPatterns.some(pattern => pattern.test(origin))) {
        callback(null, true)
      } else if (process.env.NODE_ENV === 'development') {
        // Allow all in development mode
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server

  private readonly logger = new Logger(NotificationGateway.name)
  private readonly connectedClients = new Map<string, AuthenticatedSocket>()
  private readonly userSockets = new Map<string, Set<string>>() // userId -> socketIds
  private readonly socketUsers = new Map<string, string>() // socketId -> userId

  constructor(
    private readonly tokenService: TokenService,
    private readonly notificationService: NotificationService,
  ) {}

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  afterInit(server: Server): void {
    this.logger.log('Notification Gateway initialized')
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extract token from handshake
      const token = this.extractToken(client)

      if (token) {
        // Validate token and get user info
        const userInfo = await this.validateToken(token)

        if (userInfo) {
          client.userId = userInfo.userId
          client.sessionId = userInfo.sessionId
          client.organizationId = userInfo.organizationId
          client.roles = userInfo.roles

          // Track user connection
          this.addUserConnection(userInfo.userId, client.id)

          // Join user-specific room
          await client.join(`user:${userInfo.userId}`)

          // Join organization room if applicable
          if (userInfo.organizationId) {
            await client.join(`org:${userInfo.organizationId}`)
          }

          this.logger.debug(`User ${userInfo.userId} connected (socket: ${client.id})`)
        }
      }

      this.connectedClients.set(client.id, client)
      this.logger.debug(`Client connected: ${client.id}`)

      // Send connection acknowledgment
      client.emit('connected', {
        socketId: client.id,
        authenticated: !!client.userId,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      this.logger.error(`Connection error: ${error}`)
      client.disconnect()
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    if (client.userId) {
      this.removeUserConnection(client.userId, client.id)
      this.logger.debug(`User ${client.userId} disconnected (socket: ${client.id})`)
    }

    this.connectedClients.delete(client.id)
    this.socketUsers.delete(client.id)
    this.logger.debug(`Client disconnected: ${client.id}`)
  }

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { token: string },
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const userInfo = await this.validateToken(payload.token)

      if (!userInfo) {
        return { success: false, error: 'Invalid token' }
      }

      // Update client info
      client.userId = userInfo.userId
      client.sessionId = userInfo.sessionId
      client.organizationId = userInfo.organizationId
      client.roles = userInfo.roles

      // Track connection
      this.addUserConnection(userInfo.userId, client.id)

      // Join rooms
      await client.join(`user:${userInfo.userId}`)
      if (userInfo.organizationId) {
        await client.join(`org:${userInfo.organizationId}`)
      }

      this.logger.debug(`Client ${client.id} authenticated as user ${userInfo.userId}`)

      return { success: true, userId: userInfo.userId }
    } catch (error) {
      this.logger.error(`Authentication error: ${error}`)
      return { success: false, error: 'Authentication failed' }
    }
  }

  @SubscribeMessage('subscribe:event')
  async handleSubscribeToEvent(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SubscribeToEventPayload,
  ): Promise<{ success: boolean }> {
    if (!payload.eventId) {
      throw new WsException('Event ID is required')
    }

    await client.join(`event:${payload.eventId}`)
    this.logger.debug(`Client ${client.id} subscribed to event ${payload.eventId}`)

    return { success: true }
  }

  @SubscribeMessage('unsubscribe:event')
  async handleUnsubscribeFromEvent(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SubscribeToEventPayload,
  ): Promise<{ success: boolean }> {
    if (!payload.eventId) {
      throw new WsException('Event ID is required')
    }

    await client.leave(`event:${payload.eventId}`)
    this.logger.debug(`Client ${client.id} unsubscribed from event ${payload.eventId}`)

    return { success: true }
  }

  @SubscribeMessage('mark:read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: MarkReadPayload,
  ): Promise<{ success: boolean; updated?: number; unreadCount?: number }> {
    if (!client.userId) {
      throw new WsException('Authentication required')
    }

    const updated = await this.notificationService.markRead(
      client.userId,
      payload.notificationIds || [],
    )

    const unreadCount = await this.notificationService.getUnreadCount(client.userId)

    await this.sendToUser(client.userId, 'notification:read', {
      notificationIds: payload.notificationIds || [],
      unreadCount,
    })

    this.logger.debug(
      `User ${client.userId} marked ${payload.notificationIds.length} notifications as read`,
    )

    return { success: true, updated, unreadCount }
  }

  @SubscribeMessage('mark:all-read')
  async handleMarkAllRead(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ success: boolean; updated?: number; unreadCount?: number }> {
    if (!client.userId) {
      throw new WsException('Authentication required')
    }

    const updated = await this.notificationService.markAllRead(client.userId)
    const unreadCount = await this.notificationService.getUnreadCount(client.userId)

    await this.sendToUser(client.userId, 'notification:read', {
      notificationIds: 'all',
      unreadCount,
    })

    return { success: true, updated, unreadCount }
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): { event: string; timestamp: string } {
    return { event: 'pong', timestamp: new Date().toISOString() }
  }

  // ============================================================================
  // EVENT HANDLERS (from EventEmitter)
  // ============================================================================

  @OnEvent('notification.send')
  async handleNotificationSend(payload: {
    userId: string
    notification: NotificationPayload
  }): Promise<void> {
    await this.sendToUser(payload.userId, 'notification', payload.notification)
  }

  @OnEvent('notification.broadcast')
  async handleNotificationBroadcast(payload: {
    notification: NotificationPayload
    filter?: { organizationId?: string; eventId?: string }
  }): Promise<void> {
    if (payload.filter?.eventId) {
      this.sendToRoom(`event:${payload.filter.eventId}`, 'notification', payload.notification)
    } else if (payload.filter?.organizationId) {
      this.sendToRoom(`org:${payload.filter.organizationId}`, 'notification', payload.notification)
    } else {
      this.broadcast('notification', payload.notification)
    }
  }

  @OnEvent('event.updated')
  async handleEventUpdated(payload: {
    eventId: string
    changes: Record<string, unknown>
  }): Promise<void> {
    this.sendToRoom(`event:${payload.eventId}`, 'event:updated', payload)
  }

  @OnEvent('event.cancelled')
  async handleEventCancelled(payload: { eventId: string; reason?: string }): Promise<void> {
    this.sendToRoom(`event:${payload.eventId}`, 'event:cancelled', payload)
  }

  // ============================================================================
  // PUBLIC METHODS FOR SENDING NOTIFICATIONS
  // ============================================================================

  /**
   * Send notification to a specific user
   */
  async sendToUser(
    userId: string,
    event: string,
    data: unknown,
  ): Promise<boolean> {
    const socketIds = this.userSockets.get(userId)

    if (!socketIds || socketIds.size === 0) {
      this.logger.debug(`User ${userId} is not connected`)
      return false
    }

    socketIds.forEach((socketId) => {
      const socket = this.connectedClients.get(socketId)
      if (socket) {
        socket.emit(event, data)
      }
    })

    return true
  }

  /**
   * Send to multiple users
   */
  async sendToUsers(
    userIds: string[],
    event: string,
    data: unknown,
  ): Promise<{ sent: number; notConnected: number }> {
    let sent = 0
    let notConnected = 0

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, event, data)
      if (result) {
        sent++
      } else {
        notConnected++
      }
    }

    return { sent, notConnected }
  }

  /**
   * Send to a specific room
   */
  sendToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data)
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: unknown): void {
    this.server.emit(event, data)
  }

  /**
   * Broadcast to all authenticated users
   */
  broadcastToAuthenticated(event: string, data: unknown): void {
    this.connectedClients.forEach((socket) => {
      if (socket.userId) {
        socket.emit(event, data)
      }
    })
  }

  /**
   * Send notification with priority handling
   */
  async sendPriorityNotification(
    userId: string,
    notification: NotificationPayload,
  ): Promise<boolean> {
    const sent = await this.sendToUser(userId, 'notification', notification)

    // For high priority, also try to send push notification
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      // Emit event for push notification service
      // This would be handled by a push notification service
      this.logger.debug(`High priority notification for user ${userId}`)
    }

    return sent
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    let authenticatedConnections = 0
    let anonymousConnections = 0

    this.connectedClients.forEach((socket) => {
      if (socket.userId) {
        authenticatedConnections++
      } else {
        anonymousConnections++
      }
    })

    return {
      totalConnections: this.connectedClients.size,
      authenticatedConnections,
      anonymousConnections,
      userConnections: new Map(
        Array.from(this.userSockets.entries()).map(([userId, sockets]) => [
          userId,
          sockets.size,
        ]),
      ),
    }
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId)
    return !!sockets && sockets.size > 0
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys())
  }

  /**
   * Get user's connection count
   */
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private extractToken(client: Socket): string | null {
    // Try to get token from handshake auth
    const authToken = client.handshake.auth?.token

    if (authToken) {
      return authToken
    }

    // Try to get from query params
    const queryToken = client.handshake.query?.token

    if (queryToken && typeof queryToken === 'string') {
      return queryToken
    }

    // Try to get from headers
    const authHeader = client.handshake.headers?.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }

    return null
  }

  private async validateToken(
    token: string,
  ): Promise<{
    userId: string
    sessionId?: string
    organizationId?: string
    roles?: string[]
  } | null> {
    try {
      const payload = await this.tokenService.verifyAccessToken(token)

      return {
        userId: payload.sub,
        sessionId: payload.sessionId,
        organizationId: payload.tenantId,
        roles: payload.roles,
      }
    } catch {
      return null
    }
  }

  private addUserConnection(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set())
    }
    this.userSockets.get(userId)!.add(socketId)
    this.socketUsers.set(socketId, userId)
  }

  private removeUserConnection(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId)

    if (sockets) {
      sockets.delete(socketId)

      if (sockets.size === 0) {
        this.userSockets.delete(userId)
      }
    }
  }
}
