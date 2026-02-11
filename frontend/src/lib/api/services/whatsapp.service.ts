import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  WhatsAppMessage,
  WhatsAppTemplate,
  SendWhatsAppInviteInput,
  SendWhatsAppBulkInput,
  WhatsAppInviteResponse,
  WhatsAppSummary,
} from '../types/whatsapp.types'

export const whatsappService = {
  // Send invite to specific guests
  sendInvite: async (input: SendWhatsAppInviteInput): Promise<WhatsAppInviteResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.WHATSAPP.SEND_INVITE, input)
    return data
  },

  // Send bulk invites to all guests matching filter
  sendBulkInvites: async (input: SendWhatsAppBulkInput): Promise<WhatsAppInviteResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.WHATSAPP.SEND_BULK, input)
    return data
  },

  // Get available WhatsApp message templates
  getTemplates: async (): Promise<WhatsAppTemplate[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.WHATSAPP.TEMPLATES)
    return data
  },

  // Get message history for a guestlist
  getHistory: async (guestlistId: string): Promise<WhatsAppMessage[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.WHATSAPP.HISTORY(guestlistId))
    return data
  },

  // Get WhatsApp summary for a guestlist
  getSummary: async (guestlistId: string): Promise<WhatsAppSummary> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.WHATSAPP.SUMMARY(guestlistId))
    return data
  },
}
