import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  ChatbotHistoryResponse,
  ChatbotMessageRequest,
  ChatbotResponse,
  ConversationListItem,
  ConversationDetail,
} from '../types/chatbot.types'

export const chatbotService = {
  // Legacy: Get most recent conversation history
  getHistory: async (userId: string): Promise<ChatbotHistoryResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.CHATBOT.HISTORY(userId))
    return data.data || data
  },

  // Send a message to the chatbot
  sendMessage: async (payload: ChatbotMessageRequest): Promise<ChatbotResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.CHATBOT.MESSAGE, payload)
    const raw = data.data || data

    return {
      ...raw,
      language: raw.language || 'en',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.7,
      actions: Array.isArray(raw.actions) ? raw.actions : [],
      cards: Array.isArray(raw.cards) ? raw.cards : [],
      session: raw.session || { turns: 0 },
    }
  },

  // Get all conversations for a user
  getConversations: async (userId: string): Promise<ConversationListItem[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.CHATBOT.CONVERSATIONS(userId))
    return data.data || []
  },

  // Get a specific conversation with messages
  getConversation: async (
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetail | null> => {
    try {
      const { data } = await apiClient.get(
        API_ENDPOINTS.PUBLIC.CHATBOT.CONVERSATION(userId, conversationId),
      )
      return data.data || null
    } catch {
      return null
    }
  },

  // Create a new conversation
  createConversation: async (
    userId: string,
    title?: string,
  ): Promise<{ id: string; title: string } | null> => {
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.PUBLIC.CHATBOT.CONVERSATIONS(userId),
        { title },
      )
      return data.data || null
    } catch {
      return null
    }
  },

  // Update conversation title
  updateConversationTitle: async (
    userId: string,
    conversationId: string,
    title: string,
  ): Promise<boolean> => {
    try {
      await apiClient.patch(
        API_ENDPOINTS.PUBLIC.CHATBOT.CONVERSATION(userId, conversationId),
        { title },
      )
      return true
    } catch {
      return false
    }
  },

  // Delete a conversation
  deleteConversation: async (userId: string, conversationId: string): Promise<boolean> => {
    try {
      await apiClient.delete(
        API_ENDPOINTS.PUBLIC.CHATBOT.CONVERSATION(userId, conversationId),
      )
      return true
    } catch {
      return false
    }
  },

  // Clear all messages in a conversation
  clearConversation: async (userId: string, conversationId: string): Promise<boolean> => {
    try {
      await apiClient.post(
        API_ENDPOINTS.PUBLIC.CHATBOT.CLEAR_CONVERSATION(userId, conversationId),
      )
      return true
    } catch {
      return false
    }
  },
}
