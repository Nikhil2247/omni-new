import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { ChatbotMessageRequest, ChatbotResponse } from '../types/chatbot.types'

export const chatbotService = {
  sendMessage: async (payload: ChatbotMessageRequest): Promise<ChatbotResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PUBLIC.CHATBOT.MESSAGE, payload)
    // Backend wraps response in { success: true, data: { ... } }
    return data.data || data
  },
}
