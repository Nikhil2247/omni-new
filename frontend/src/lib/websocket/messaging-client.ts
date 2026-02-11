// ============================================================================
// MESSAGING CLIENT - Real-time Messaging Events
// ============================================================================

import { SocketClient } from './socket-client'
import type { Message, Conversation } from '@/lib/api/types/messaging.types'

export interface MessageEventPayload {
  message: Message
}

export interface MessageReadPayload {
  conversationId: string
  messageId: string
  userId: string
  readAt: string
}

export interface MessageReactionPayload {
  conversationId: string
  messageId: string
  userId: string
  emoji: string
}

export interface MessageDeletedPayload {
  messageId: string
  deletedBy: string
  deletedAt: string
}

export interface TypingPayload {
  conversationId: string
  userId: string
  userName?: string
  isTyping: boolean
}

type MessageCallback = (payload: MessageEventPayload) => void

type ConversationCallback = (conversation: Conversation) => void

class MessagingClientClass {
  private client: SocketClient | null = null
  private authToken: string | null = null
  private messageCallbacks: MessageCallback[] = []
  private conversationCallbacks: ConversationCallback[] = []
  private readCallbacks: Array<(payload: MessageReadPayload) => void> = []
  private reactionCallbacks: Array<(payload: MessageReactionPayload) => void> = []
  private deletedCallbacks: Array<(payload: MessageDeletedPayload) => void> = []
  private typingCallbacks: Array<(payload: TypingPayload) => void> = []
  private joinedConversations: Set<string> = new Set()

  initialize(token: string): void {
    this.authToken = token
    if (this.client?.isConnected()) {
      return
    }

    this.client = new SocketClient({
      namespace: '/messaging',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    this.setupEventListeners()
    this.client.connect(token)
  }

  private setupEventListeners(): void {
    if (!this.client) return

    this.client.on('connected', () => {
      console.log('[MessagingClient] Connected, authenticating...')
      if (!this.authToken) return
      this.client?.emit('authenticate', { token: this.authToken })

      // Rejoin all previously joined conversations on reconnect
      this.joinedConversations.forEach((conversationId) => {
        console.log(`[MessagingClient] Rejoining conversation: ${conversationId}`)
        this.client?.emit('conversation:join', { conversationId })
      })
    })

    this.client.on('message:new', (payload: MessageEventPayload) => {
      console.log('[MessagingClient] Received message:new', payload.message?.id)
      this.messageCallbacks.forEach((callback) => callback(payload))
    })

    this.client.on('conversation:new', (conversation: Conversation) => {
      console.log('[MessagingClient] Received conversation:new', conversation.id)
      this.conversationCallbacks.forEach((callback) => callback(conversation))
    })

    this.client.on('message:read', (payload: MessageReadPayload) => {
      this.readCallbacks.forEach((callback) => callback(payload))
    })

    this.client.on('message:reaction', (payload: MessageReactionPayload) => {
      this.reactionCallbacks.forEach((callback) => callback(payload))
    })

    this.client.on('message:deleted', (payload: MessageDeletedPayload) => {
      this.deletedCallbacks.forEach((callback) => callback(payload))
    })

    this.client.on('typing:update', (payload: TypingPayload) => {
      this.typingCallbacks.forEach((callback) => callback(payload))
    })
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback)
    return () => {
      const index = this.messageCallbacks.indexOf(callback)
      if (index > -1) this.messageCallbacks.splice(index, 1)
    }
  }

  onConversation(callback: ConversationCallback): () => void {
    this.conversationCallbacks.push(callback)
    return () => {
      const index = this.conversationCallbacks.indexOf(callback)
      if (index > -1) this.conversationCallbacks.splice(index, 1)
    }
  }

  onRead(callback: (payload: MessageReadPayload) => void): () => void {
    this.readCallbacks.push(callback)
    return () => {
      const index = this.readCallbacks.indexOf(callback)
      if (index > -1) this.readCallbacks.splice(index, 1)
    }
  }

  onReaction(callback: (payload: MessageReactionPayload) => void): () => void {
    this.reactionCallbacks.push(callback)
    return () => {
      const index = this.reactionCallbacks.indexOf(callback)
      if (index > -1) this.reactionCallbacks.splice(index, 1)
    }
  }

  onDeleted(callback: (payload: MessageDeletedPayload) => void): () => void {
    this.deletedCallbacks.push(callback)
    return () => {
      const index = this.deletedCallbacks.indexOf(callback)
      if (index > -1) this.deletedCallbacks.splice(index, 1)
    }
  }

  onTyping(callback: (payload: TypingPayload) => void): () => void {
    this.typingCallbacks.push(callback)
    return () => {
      const index = this.typingCallbacks.indexOf(callback)
      if (index > -1) this.typingCallbacks.splice(index, 1)
    }
  }

  startTyping(conversationId: string): void {
    if (!this.client) return
    this.client.emit('typing:start', { conversationId, isTyping: true })
  }

  stopTyping(conversationId: string): void {
    if (!this.client) return
    this.client.emit('typing:stop', { conversationId, isTyping: false })
  }

  joinConversation(conversationId: string): void {
    if (!conversationId) return
    this.joinedConversations.add(conversationId)
    if (!this.client) return
    console.log(`[MessagingClient] Joining conversation: ${conversationId}`)
    this.client.emit('conversation:join', { conversationId })
  }

  leaveConversation(conversationId: string): void {
    if (!conversationId) return
    this.joinedConversations.delete(conversationId)
    if (!this.client) return
    this.client.emit('conversation:leave', { conversationId })
  }

  isConnected(): boolean {
    return this.client?.isConnected() || false
  }

  disconnect(): void {
    if (this.client) {
      this.client.disconnect()
      this.client = null
      this.authToken = null
      this.messageCallbacks = []
      this.conversationCallbacks = []
      this.readCallbacks = []
      this.reactionCallbacks = []
      this.deletedCallbacks = []
      this.typingCallbacks = []
      this.joinedConversations.clear()
    }
  }
}

export const MessagingClient = new MessagingClientClass()
