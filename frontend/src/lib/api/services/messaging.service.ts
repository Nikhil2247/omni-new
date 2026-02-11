import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type {
  AddReactionPayload,
  Conversation,
  ConversationListParams,
  CreateDirectConversationPayload,
  Message,
  MessageListParams,
  SendMessagePayload,
} from '../types/messaging.types'

const unwrapItem = <T>(response: any): T => {
  const payload = response?.data ?? response
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const inner = (payload as { data: any }).data
    if (inner && typeof inner === 'object' && 'data' in inner && 'meta' in inner) {
      return inner.data as T
    }
    return inner as T
  }
  return payload as T
}

const unwrapPaginated = <T>(response: any): PaginatedResponse<T> => {
  const payload = response?.data ?? response
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const inner = (payload as { data: any }).data
    if (inner && typeof inner === 'object' && 'data' in inner && 'meta' in inner) {
      return inner as PaginatedResponse<T>
    }
    return {
      data: inner as T[],
      meta: (payload as { meta: PaginatedResponse<T>['meta'] }).meta,
    }
  }
  return payload as PaginatedResponse<T>
}

export const userMessagingService = {
  createVendorConversation: async (vendorProfileId: string): Promise<Conversation> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.MESSAGING.VENDOR(vendorProfileId))
    return unwrapItem<Conversation>(data)
  },
  createDirectConversation: async (payload: CreateDirectConversationPayload): Promise<Conversation> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.MESSAGING.DIRECT, payload)
    return unwrapItem<Conversation>(data)
  },
  listConversations: async (params: ConversationListParams = {}): Promise<PaginatedResponse<Conversation>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.MESSAGING.CONVERSATIONS, { params })
    return unwrapPaginated<Conversation>(data)
  },
  getConversation: async (conversationId: string): Promise<Conversation> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.MESSAGING.CONVERSATION(conversationId))
    return unwrapItem<Conversation>(data)
  },
  listMessages: async (
    conversationId: string,
    params: MessageListParams = {},
  ): Promise<PaginatedResponse<Message>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.MESSAGING.MESSAGES(conversationId), { params })
    return unwrapPaginated<Message>(data)
  },
  sendMessage: async (conversationId: string, payload: SendMessagePayload): Promise<Message> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.MESSAGING.MESSAGES(conversationId), payload)
    return unwrapItem<Message>(data)
  },
  markRead: async (messageId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USER.MESSAGING.MESSAGE_READ(messageId))
  },
  addReaction: async (messageId: string, payload: AddReactionPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USER.MESSAGING.MESSAGE_REACTIONS(messageId), payload)
  },
  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.USER.MESSAGING.MESSAGE_DELETE(messageId))
  },
}

export const businessMessagingService = {
  createDirectConversation: async (payload: CreateDirectConversationPayload): Promise<Conversation> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.MESSAGING.DIRECT, payload)
    return unwrapItem<Conversation>(data)
  },
  listConversations: async (params: ConversationListParams = {}): Promise<PaginatedResponse<Conversation>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.MESSAGING.CONVERSATIONS, { params })
    return unwrapPaginated<Conversation>(data)
  },
  getConversation: async (conversationId: string): Promise<Conversation> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.MESSAGING.CONVERSATION(conversationId))
    return unwrapItem<Conversation>(data)
  },
  listMessages: async (
    conversationId: string,
    params: MessageListParams = {},
  ): Promise<PaginatedResponse<Message>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.MESSAGING.MESSAGES(conversationId), { params })
    return unwrapPaginated<Message>(data)
  },
  sendMessage: async (conversationId: string, payload: SendMessagePayload): Promise<Message> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.MESSAGING.MESSAGES(conversationId), payload)
    return unwrapItem<Message>(data)
  },
  markRead: async (messageId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.BUSINESS.MESSAGING.MESSAGE_READ(messageId))
  },
  addReaction: async (messageId: string, payload: AddReactionPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.BUSINESS.MESSAGING.MESSAGE_REACTIONS(messageId), payload)
  },
  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BUSINESS.MESSAGING.MESSAGE_DELETE(messageId))
  },
}
