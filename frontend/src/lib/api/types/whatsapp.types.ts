// WhatsApp Integration Types

export interface WhatsAppMessage {
  id: string
  guestId: string
  guestName: string
  guestPhone: string
  messageType: 'INVITE' | 'REMINDER' | 'RSVP_REQUEST' | 'THANK_YOU'
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  errorMessage?: string
}

export interface WhatsAppTemplate {
  id: string
  name: string
  type: 'INVITE' | 'REMINDER' | 'RSVP_REQUEST' | 'THANK_YOU'
  content: string
  variables: string[] // e.g., ['guestName', 'eventName', 'eventDate']
}

export interface SendWhatsAppInviteInput {
  guestIds: string[]
  templateId?: string
  customMessage?: string
}

export interface SendWhatsAppBulkInput {
  guestlistId: string
  filter?: {
    rsvpStatus?: ('PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE')[]
    hasPhone?: boolean
  }
  templateId?: string
  customMessage?: string
}

export interface WhatsAppInviteResponse {
  success: boolean
  sent: number
  failed: number
  errors?: { guestId: string; error: string }[]
}

export interface WhatsAppSummary {
  totalSent: number
  delivered: number
  read: number
  pending: number
  failed: number
}
