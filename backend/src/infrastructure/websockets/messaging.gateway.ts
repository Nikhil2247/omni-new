// ============================================================================
// MESSAGING GATEWAY - Real-time Chat and Messaging
// ============================================================================
// WebSocket gateway for real-time messaging between users
// Supports private chats, event rooms, and group conversations
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
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { TokenService } from '../../core/auth/token.service';
import { PrismaService } from '../../core/database/prisma.service';
import { ConversationService } from '../../domain/messaging/services/conversation.service';
import { MessagingMessageService } from '../../domain/messaging/services/message.service';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  sessionId?: string;
  displayName?: string;
  avatarUrl?: string;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  LOCATION = 'location',
  EVENT_SHARE = 'event_share',
  SYSTEM = 'system',
}

export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
  EVENT_CHAT = 'event_chat',
  VENDOR_SUPPORT = 'vendor_support',
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
  replyTo?: string;
  createdAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

export interface MessageMetadata {
  // For files/images
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  url?: string;
  thumbnailUrl?: string;

  // For location
  latitude?: number;
  longitude?: number;
  address?: string;

  // For event share
  eventId?: string;
  eventName?: string;
  eventDate?: string;

  // For system messages
  action?: string;
  targetUserId?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName?: string;
  isTyping: boolean;
}

export interface ReadReceipt {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface SendMessagePayload {
  conversationId: string;
  type?: MessageType;
  content: string;
  metadata?: MessageMetadata;
  replyTo?: string;
  tempId?: string; // Client-side temporary ID for optimistic updates
}

export interface JoinConversationPayload {
  conversationId: string;
}

export interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface MarkReadPayload {
  conversationId: string;
  messageId: string;
}

export interface EditMessagePayload {
  messageId: string;
  conversationId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  conversationId: string;
}

export interface ReactionPayload {
  messageId: string;
  conversationId: string;
  emoji: string;
}

// ============================================================================
// MESSAGING GATEWAY
// ============================================================================

@Injectable()
@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, server-to-server, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      // In development, allow localhost origins
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
      ];
      // Check environment-based allowed origins (set via CORS_ORIGINS env var)
      const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
      if (
        corsOrigins.includes(origin) ||
        allowedPatterns.some((pattern) => pattern.test(origin))
      ) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'development') {
        // Allow all in development mode
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly socketUsers = new Map<string, string>();
  private readonly userConversations = new Map<string, Set<string>>(); // userId -> conversationIds
  private readonly typingUsers = new Map<string, Map<string, NodeJS.Timeout>>(); // conversationId -> userId -> timeout

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly messagingMessageService: MessagingMessageService,
  ) {}

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  afterInit(server: Server): void {
    this.logger.log('Messaging Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);

      if (token) {
        const userInfo = await this.validateToken(token);

        if (userInfo) {
          client.userId = userInfo.userId;
          client.sessionId = userInfo.sessionId;
          client.displayName = userInfo.displayName;
          client.avatarUrl = userInfo.avatarUrl;

          this.addUserConnection(userInfo.userId, client.id);

          // Join user's personal room for direct notifications
          await client.join(`user:${userInfo.userId}`);

          // Load and join user's existing conversations
          await this.joinUserConversations(client);

          this.logger.debug(`User ${userInfo.userId} connected to messaging`);
        }
      }

      this.connectedClients.set(client.id, client);

      client.emit('connected', {
        socketId: client.id,
        authenticated: !!client.userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    if (client.userId) {
      // Clear typing indicators for this user
      this.clearUserTypingIndicators(client.userId);

      // Emit offline status to conversations
      const conversations = this.userConversations.get(client.userId);
      if (conversations) {
        conversations.forEach((conversationId) => {
          this.server
            .to(`conversation:${conversationId}`)
            .emit('user:offline', {
              userId: client.userId,
              conversationId,
              timestamp: new Date().toISOString(),
            });
        });
      }

      this.removeUserConnection(client.userId, client.id);
      this.logger.debug(`User ${client.userId} disconnected from messaging`);
    }

    this.connectedClients.delete(client.id);
    this.socketUsers.delete(client.id);
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
      const userInfo = await this.validateToken(payload.token);

      if (!userInfo) {
        return { success: false, error: 'Invalid token' };
      }

      client.userId = userInfo.userId;
      client.sessionId = userInfo.sessionId;
      client.displayName = userInfo.displayName;
      client.avatarUrl = userInfo.avatarUrl;

      this.addUserConnection(userInfo.userId, client.id);
      await client.join(`user:${userInfo.userId}`);
      await this.joinUserConversations(client);

      return { success: true, userId: userInfo.userId };
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    if (!payload.conversationId || !payload.content) {
      throw new WsException('Conversation ID and content are required');
    }

    try {
      const message = await this.messagingMessageService.sendMessage(
        client.userId,
        {
          conversationId: payload.conversationId,
          content: payload.content,
        },
      );

      // Clear typing indicator for this user
      this.clearTypingIndicator(payload.conversationId, client.userId);

      return { success: true, message: message as unknown as Message };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);
      return { success: false, error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: EditMessagePayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    // Broadcast edit to conversation
    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('message:edited', {
        messageId: payload.messageId,
        content: payload.content,
        editedAt: new Date().toISOString(),
        editedBy: client.userId,
      });

    return { success: true };
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: DeleteMessagePayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    await this.messagingMessageService.deleteForUser(
      client.userId,
      payload.messageId,
    );

    return { success: true };
  }

  @SubscribeMessage('message:react')
  async handleMessageReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ReactionPayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    await this.messagingMessageService.addReaction(
      client.userId,
      payload.messageId,
      payload.emoji,
    );

    return { success: true };
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinConversationPayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    const roomName = `conversation:${payload.conversationId}`;
    await client.join(roomName);

    this.logger.debug(
      `User ${client.userId} joined room ${roomName} (socket: ${client.id})`,
    );

    // Track user's conversations
    if (!this.userConversations.has(client.userId)) {
      this.userConversations.set(client.userId, new Set());
    }
    this.userConversations.get(client.userId)!.add(payload.conversationId);

    // Notify others that user joined
    this.server.to(roomName).emit('user:joined', {
      userId: client.userId,
      userName: client.displayName,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinConversationPayload,
  ): Promise<{ success: boolean }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    await client.leave(`conversation:${payload.conversationId}`);

    // Remove from tracking
    this.userConversations.get(client.userId)?.delete(payload.conversationId);

    // Clear typing indicator
    this.clearTypingIndicator(payload.conversationId, client.userId);

    // Notify others
    this.server.to(`conversation:${payload.conversationId}`).emit('user:left', {
      userId: client.userId,
      conversationId: payload.conversationId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ): Promise<void> {
    if (!client.userId) return;

    this.setTypingIndicator(
      payload.conversationId,
      client.userId,
      client.displayName,
    );

    // Broadcast typing indicator
    client.to(`conversation:${payload.conversationId}`).emit('typing:update', {
      conversationId: payload.conversationId,
      userId: client.userId,
      userName: client.displayName,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: TypingPayload,
  ): Promise<void> {
    if (!client.userId) return;

    this.clearTypingIndicator(payload.conversationId, client.userId);

    client.to(`conversation:${payload.conversationId}`).emit('typing:update', {
      conversationId: payload.conversationId,
      userId: client.userId,
      userName: client.displayName,
      isTyping: false,
    });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: MarkReadPayload,
  ): Promise<{ success: boolean }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    await this.messagingMessageService.markRead(
      client.userId,
      payload.messageId,
    );

    return { success: true };
  }

  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { status: 'online' | 'away' | 'busy' | 'offline' },
  ): Promise<{ success: boolean }> {
    if (!client.userId) {
      throw new WsException('Authentication required');
    }

    // Broadcast presence to all conversations
    const conversations = this.userConversations.get(client.userId);
    if (conversations) {
      conversations.forEach((conversationId) => {
        this.server
          .to(`conversation:${conversationId}`)
          .emit('presence:update', {
            userId: client.userId,
            status: payload.status,
            timestamp: new Date().toISOString(),
          });
      });
    }

    return { success: true };
  }

  @SubscribeMessage('ping')
  handlePing(): { event: string; timestamp: string } {
    return { event: 'pong', timestamp: new Date().toISOString() };
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  @OnEvent('message.created')
  async handleMessageCreated(payload: { message: any }): Promise<void> {
    const roomName = `conversation:${payload.message.conversationId}`;
    this.logger.debug(
      `Broadcasting message:new to room ${roomName}, message id: ${payload.message.id}`,
    );

    this.server.to(roomName).emit('message:new', { message: payload.message });
  }

  @OnEvent('message.read')
  async handleMessageReadEvent(payload: ReadReceipt): Promise<void> {
    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('message:read', payload);
  }

  @OnEvent('message.reaction')
  async handleMessageReactionEvent(payload: {
    messageId: string;
    conversationId: string;
    userId: string;
    emoji: string;
  }): Promise<void> {
    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('message:reaction', payload);
  }

  @OnEvent('message.deleted')
  async handleMessageDeletedEvent(payload: {
    messageId: string;
    conversationId: string;
    userId: string;
  }): Promise<void> {
    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('message:deleted', {
        messageId: payload.messageId,
        deletedBy: payload.userId,
        deletedAt: new Date().toISOString(),
      });
  }

  @OnEvent('conversation.created')
  async handleConversationCreated(payload: {
    conversation: Conversation;
    participants: string[];
  }): Promise<void> {
    // Notify all participants about new conversation
    for (const userId of payload.participants) {
      await this.sendToUser(userId, 'conversation:new', payload.conversation);
    }
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Send message to a specific user
   */
  async sendToUser(
    userId: string,
    event: string,
    data: unknown,
  ): Promise<boolean> {
    const socketIds = this.userSockets.get(userId);

    if (!socketIds || socketIds.size === 0) {
      return false;
    }

    socketIds.forEach((socketId) => {
      const socket = this.connectedClients.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    });

    return true;
  }

  /**
   * Send to a conversation
   */
  sendToConversation(
    conversationId: string,
    event: string,
    data: unknown,
  ): void {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Get online users in a conversation
   */
  getOnlineUsersInConversation(conversationId: string): string[] {
    const onlineUsers: string[] = [];

    this.userConversations.forEach((conversations, userId) => {
      if (conversations.has(conversationId) && this.isUserOnline(userId)) {
        onlineUsers.push(userId);
      }
    });

    return onlineUsers;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Get typing users in a conversation
   */
  getTypingUsers(conversationId: string): string[] {
    const typingMap = this.typingUsers.get(conversationId);
    return typingMap ? Array.from(typingMap.keys()) : [];
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (authToken) return authToken;

    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') return queryToken;

    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }

  private async validateToken(token: string): Promise<{
    userId: string;
    sessionId?: string;
    displayName?: string;
    avatarUrl?: string;
  } | null> {
    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      });

      const displayName = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.email
        : payload.email;

      return {
        userId: payload.sub,
        sessionId: payload.sessionId,
        displayName,
        avatarUrl: user?.avatarUrl || undefined,
      };
    } catch {
      return null;
    }
  }

  private async joinUserConversations(
    client: AuthenticatedSocket,
  ): Promise<void> {
    if (!client.userId) return;
    const userId = client.userId;

    const conversationIds =
      await this.conversationService.getUserConversationIds(userId);
    for (const conversationId of conversationIds) {
      await client.join(`conversation:${conversationId}`);
    }

    if (!this.userConversations.has(userId)) {
      this.userConversations.set(userId, new Set());
    }

    conversationIds.forEach((conversationId) => {
      this.userConversations.get(userId)!.add(conversationId);
    });
  }

  private addUserConnection(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  private removeUserConnection(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  private setTypingIndicator(
    conversationId: string,
    userId: string,
    userName?: string,
  ): void {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Map());
    }

    const conversationTyping = this.typingUsers.get(conversationId)!;

    // Clear existing timeout
    const existingTimeout = conversationTyping.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to auto-clear after 5 seconds
    const timeout = setTimeout(() => {
      this.clearTypingIndicator(conversationId, userId);
      this.server.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        userName,
        isTyping: false,
      });
    }, 5000);

    conversationTyping.set(userId, timeout);
  }

  private clearTypingIndicator(conversationId: string, userId: string): void {
    const conversationTyping = this.typingUsers.get(conversationId);
    if (conversationTyping) {
      const timeout = conversationTyping.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        conversationTyping.delete(userId);
      }
    }
  }

  private clearUserTypingIndicators(userId: string): void {
    this.typingUsers.forEach((conversationTyping, conversationId) => {
      if (conversationTyping.has(userId)) {
        this.clearTypingIndicator(conversationId, userId);
      }
    });
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
