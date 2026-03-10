import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface AdminChatbotDailyMetrics {
  date: string
  totals: {
    totalInteractions: number
    vendorResultInteractions: number
    totalVendorsFound: number
    avgResponseTimeMs: number
    avgConfidence: number
  }
  breakdown: {
    intents: Record<string, number>
    languages: Record<string, number>
  }
}

export interface AdminChatbotSessionMetrics {
  sessionId: string
  turns: number
  lastIntent: string | null
  lastLanguage: string | null
  lastConfidence: number
  lastVendorsFound: number
  lastResponseTimeMs: number
  hasData: boolean
}

export const adminChatbotService = {
  async getDailyMetrics(date?: string): Promise<AdminChatbotDailyMetrics> {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CHATBOT.METRICS, {
      params: date ? { date } : undefined,
    })
    return data.data || data
  },

  async getSessionMetrics(sessionId: string): Promise<AdminChatbotSessionMetrics> {
    const { data } = await apiClient.get(
      API_ENDPOINTS.ADMIN.CHATBOT.SESSION_METRICS(sessionId),
    )
    return data.data || data
  },
}
