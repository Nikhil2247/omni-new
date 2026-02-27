import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'
import { userMessagingService, businessMessagingService } from '@/lib/api/services/messaging.service'
import type {
  Conversation,
  ConversationListParams,
  Message,
  MessageListParams,
  SendMessagePayload,
  AddReactionPayload,
  CreateDirectConversationPayload,
} from '@/lib/api/types/messaging.types'
import type { PaginatedResponse } from '@/lib/api/types/common.types'
import { MessagingClient } from '@/lib/websocket/messaging-client'

export type MessagingScope = 'user' | 'business'

export const messagingKeys = {
  all: (scope: MessagingScope) => ['messaging', scope] as const,
  conversationsRoot: (scope: MessagingScope) => [...messagingKeys.all(scope), 'conversations'] as const,
  conversations: (scope: MessagingScope, params: ConversationListParams) =>
    [...messagingKeys.conversationsRoot(scope), params] as const,
  conversation: (scope: MessagingScope, id: string) =>
    [...messagingKeys.all(scope), 'conversation', id] as const,
  messages: (scope: MessagingScope, conversationId: string, params: MessageListParams) =>
    [...messagingKeys.all(scope), 'messages', conversationId, params] as const,
}

const normalizePaginated = <T>(
  existing?: PaginatedResponse<T> | T[],
): PaginatedResponse<T> | null => {
  if (!existing) return null
  if (Array.isArray(existing)) {
    const total = existing.length
    return {
      data: existing,
      meta: {
        total,
        page: 1,
        limit: total || 1,
        totalPages: total ? 1 : 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }
  }
  return existing
}

const getService = (scope: MessagingScope) =>
  scope === 'business' ? businessMessagingService : userMessagingService

export function useMessagingClient() {
  const { isAuthenticated, accessToken } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      MessagingClient.disconnect()
      return
    }
    MessagingClient.initialize(accessToken)
  }, [isAuthenticated, accessToken])
}

export function useMessagingConversationsRealtime(scope: MessagingScope) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = MessagingClient.onConversation((conversation) => {
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: messagingKeys.conversationsRoot(scope) },
        (existing) => {
          const normalized = normalizePaginated(existing)
          if (!normalized) return existing
          if (normalized.data.some((item) => item.id === conversation.id)) return normalized
          return { ...normalized, data: [conversation, ...normalized.data] }
        },
      )
      MessagingClient.joinConversation(conversation.id)
    })

    return () => {
      unsubscribe()
    }
  }, [queryClient, scope])
}

export function useUserConversations(params: ConversationListParams = {}) {
  return useQuery<PaginatedResponse<Conversation>>({
    queryKey: messagingKeys.conversations('user', params),
    queryFn: () => userMessagingService.listConversations(params),
    refetchOnMount: 'always',
  })
}

export function useBusinessConversations(params: ConversationListParams = {}) {
  return useQuery<PaginatedResponse<Conversation>>({
    queryKey: messagingKeys.conversations('business', params),
    queryFn: () => businessMessagingService.listConversations(params),
    refetchOnMount: 'always',
  })
}

export function useConversationMessages(
  scope: MessagingScope,
  conversationId: string,
  params: MessageListParams = { page: 1, limit: 50 },
) {
  return useQuery<PaginatedResponse<Message>>({
    queryKey: messagingKeys.messages(scope, conversationId, params),
    queryFn: () => getService(scope).listMessages(conversationId, params),
    enabled: Boolean(conversationId),
    refetchOnMount: 'always',
  })
}

export function useSendMessage(scope: MessagingScope, conversationId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => getService(scope).sendMessage(conversationId, payload),
    onMutate: async (payload) => {
      const params = { page: 1, limit: 50 }
      const key = messagingKeys.messages(scope, conversationId, params)

      await queryClient.cancelQueries({ queryKey: key })

      const tempId = `temp-${Date.now()}`
      const attachments = payload.attachments?.map((attachment, index) => ({
        ...attachment,
        id: `${tempId}-att-${index}`,
        messageId: tempId,
      }))
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: user?.id || 'unknown',
        content: payload.content,
        createdAt: new Date().toISOString(),
        attachments,
        reactions: [],
        status: 'sending',
      }
      queryClient.setQueryData<PaginatedResponse<Message>>(key, (existing) => {
        const normalized = normalizePaginated(existing)
        if (!normalized) {
          return {
            data: [optimistic],
            meta: {
              total: 1,
              page: 1,
              limit: 50,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }
        }
        return { ...normalized, data: [...normalized.data, optimistic] }
      })

      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: messagingKeys.conversationsRoot(scope) },
        (existing) => {
          const normalized = normalizePaginated(existing)
          if (!normalized) return existing
          const index = normalized.data.findIndex((item) => item.id === conversationId)
          if (index === -1) return normalized
          const next = [...normalized.data]
          const current = next.splice(index, 1)[0]
          next.unshift({
            ...current,
            lastMessageAt: optimistic.createdAt,
            messages: [optimistic],
          })
          return { ...normalized, data: next }
        },
      )

      return { tempId, key }
    },
    onSuccess: (message, _payload, context) => {
      const params = { page: 1, limit: 50 }
      const key = context?.key ?? messagingKeys.messages(scope, conversationId, params)
      queryClient.setQueryData<PaginatedResponse<Message>>(key, (existing) => {
        const normalized = normalizePaginated(existing)
        if (!normalized) return existing
        // Replace optimistic temp message with real message, then deduplicate.
        // Race condition: WebSocket may have already appended the real message before
        // onSuccess fires, causing TEMP→realMsg map to produce [M1, M2, realMsg, realMsg].
        const mapped = normalized.data.map((item) =>
          item.id === context?.tempId ? message : item
        )
        const seen = new Set<string>()
        const deduped = mapped.filter((item) => {
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
        if (deduped.some((item) => item.id === message.id)) {
          return { ...normalized, data: deduped }
        }
        return { ...normalized, data: [...deduped, message] }
      })
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: messagingKeys.conversationsRoot(scope) },
        (existing) => {
          const normalized = normalizePaginated(existing)
          if (!normalized) return existing
          const index = normalized.data.findIndex((item) => item.id === message.conversationId)
          if (index === -1) return normalized
          const next = [...normalized.data]
          const current = next.splice(index, 1)[0]
          next.unshift({
            ...current,
            lastMessageAt: message.createdAt,
            messages: [message],
          })
          return { ...normalized, data: next }
        },
      )
    },
    onError: (_error, _payload, context) => {
      if (!context?.key || !context?.tempId) return
      queryClient.setQueryData<PaginatedResponse<Message>>(context.key, (existing) => {
        const normalized = normalizePaginated(existing)
        if (!normalized) return existing
        return {
          ...normalized,
          data: normalized.data.map((item) =>
            item.id === context.tempId ? { ...item, status: 'failed' } : item
          ),
        }
      })
    },
  })
}

export function useCreateUserVendorConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vendorProfileId: string) => userMessagingService.createVendorConversation(vendorProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations('user', {}) })
    },
  })
}

export function useCreateDirectConversation(scope: MessagingScope) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDirectConversationPayload) => getService(scope).createDirectConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations(scope, {}) })
    },
  })
}

export function useMarkMessageRead(scope: MessagingScope) {
  return useMutation({
    mutationFn: (messageId: string) => getService(scope).markRead(messageId),
  })
}

export function useAddReaction(scope: MessagingScope) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, payload }: { messageId: string; payload: AddReactionPayload }) =>
      getService(scope).addReaction(messageId, payload),
    onMutate: async ({ messageId, payload }) => {
      const keys = queryClient.getQueriesData<PaginatedResponse<Message>>({
        queryKey: messagingKeys.all(scope),
      })

      keys.forEach(([key, existing]) => {
        const normalized = normalizePaginated(existing)
        if (!normalized) return
        queryClient.setQueryData<PaginatedResponse<Message>>(key, {
          ...normalized,
          data: normalized.data.map((message) => {
            if (message.id !== messageId) return message
            const reactions = message.reactions ?? []
            const already = reactions.some((reaction) =>
              reaction.emoji === payload.emoji && reaction.userId === user?.id
            )
            if (already) return message
            return {
              ...message,
              reactions: [
                ...reactions,
                {
                  id: `temp-${Date.now()}`,
                  messageId,
                  userId: user?.id || 'unknown',
                  emoji: payload.emoji,
                },
              ],
            }
          }),
        })
      })

      return { keys }
    },
  })
}

export function useDeleteMessage(scope: MessagingScope) {
  return useMutation({
    mutationFn: (messageId: string) => getService(scope).deleteMessage(messageId),
  })
}

export function useMessagingRealtime(
  scope: MessagingScope,
  conversationId: string,
  params: MessageListParams = { page: 1, limit: 50 },
) {
  const queryClient = useQueryClient()

  const messageKey = useMemo(
    () => messagingKeys.messages(scope, conversationId, params),
    [scope, conversationId, params.page, params.limit],
  )

  // Always listen for messages to update conversation list, even when no conversation is selected
  useEffect(() => {
    const unsubscribeMessage = MessagingClient.onMessage(({ message }) => {
      console.log('[useMessagingRealtime] Received message:new', message.id, 'for conversation', message.conversationId)

      // Always update the conversation list
      queryClient.setQueriesData<PaginatedResponse<Conversation>>(
        { queryKey: messagingKeys.conversationsRoot(scope) },
        (existing) => {
          const normalized = normalizePaginated(existing)
          if (!normalized) return existing
          const index = normalized.data.findIndex((item) => item.id === message.conversationId)
          if (index === -1) return normalized

          const next = [...normalized.data]
          const current = next.splice(index, 1)[0]
          next.unshift({
            ...current,
            lastMessageAt: message.createdAt,
            messages: [message],
          })
          return { ...normalized, data: next }
        },
      )

      // Update the message list if this is the active conversation
      if (conversationId && message.conversationId === conversationId) {
        queryClient.setQueryData<PaginatedResponse<Message>>(messageKey, (existing) => {
          const normalized = normalizePaginated(existing)
          if (!normalized) return existing
          if (normalized.data.some((item) => item.id === message.id)) return normalized
          return { ...normalized, data: [...normalized.data, message] }
        })
      }
    })

    const unsubscribeDeleted = MessagingClient.onDeleted((payload) => {
      if (!conversationId) return
      queryClient.setQueryData<PaginatedResponse<Message>>(messageKey, (existing) => {
        const normalized = normalizePaginated(existing)
        if (!normalized) return existing
        return { ...normalized, data: normalized.data.filter((item) => item.id !== payload.messageId) }
      })
    })

    const unsubscribeReaction = MessagingClient.onReaction((payload) => {
      if (!conversationId) return
      queryClient.setQueryData<PaginatedResponse<Message>>(messageKey, (existing) => {
        const normalized = normalizePaginated(existing)
        if (!normalized) return existing
        return {
          ...normalized,
          data: normalized.data.map((message) => {
            if (message.id !== payload.messageId) return message
            const reactions = message.reactions ?? []
            const already = reactions.some((reaction) =>
              reaction.emoji === payload.emoji && reaction.userId === payload.userId
            )
            if (already) return message
            return {
              ...message,
              reactions: [
                ...reactions,
                {
                  id: `evt-${payload.messageId}-${payload.userId}-${payload.emoji}`,
                  messageId: payload.messageId,
                  userId: payload.userId,
                  emoji: payload.emoji,
                },
              ],
            }
          }),
        }
      })
    })

    return () => {
      unsubscribeMessage()
      unsubscribeDeleted()
      unsubscribeReaction()
    }
  }, [conversationId, messageKey, queryClient, scope])

  // Join the active conversation room
  useEffect(() => {
    if (!conversationId) return
    MessagingClient.joinConversation(conversationId)
    return () => MessagingClient.leaveConversation(conversationId)
  }, [conversationId])
}
