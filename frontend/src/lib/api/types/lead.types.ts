export type LeadSource = 'INQUIRY' | 'DIRECT_MESSAGE' | 'PHONE' | 'EXTERNAL' | 'REFERRAL'

export interface LeadVendorSummary {
  id: string
  businessName: string
  slug: string
}

export interface LeadPlannerSummary {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
}

export interface LeadMessage {
  id: string
  leadId: string
  senderId: string
  content: string
  readAt: string | null
  createdAt: string
}

export interface CreateLeadPayload {
  vendorProfileId: string
  plannerId: string
  eventId?: string
  source: LeadSource
  eventDate?: string
  eventType?: string
  guestCount?: number
  budget?: number
  initialMessage?: string
}

export interface LeadResponse {
  id: string
  vendorProfileId: string
  plannerId: string
  eventId: string | null
  status: string
  source: LeadSource
  eventDate: string | null
  eventType: string | null
  guestCount: number | null
  budget: number | null
  initialMessage: string | null
  createdAt: string
  updatedAt: string
  respondedAt: string | null
  convertedAt: string | null
  vendorProfile?: LeadVendorSummary
  planner?: LeadPlannerSummary
  messages?: LeadMessage[]
}

export interface LeadSearchParams {
  vendorProfileId?: string
  plannerId?: string
  status?: string
  source?: LeadSource
  page?: number
  limit?: number
}

export interface CreateLeadMessagePayload {
  leadId: string
  senderId: string
  content: string
}

export interface UpdateLeadPayload {
  status?: string
  eventDate?: string
  eventType?: string
  guestCount?: number
  budget?: number
}
