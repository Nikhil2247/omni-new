export type EventStatus =
  | 'PLANNING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type EventTier = 'BASIC' | 'PREMIUM'

export interface EventSummary {
  id: string
  userId: string
  name: string
  eventTypeId: string
  date: string | null
  eventDate?: string | null
  description?: string | null
  venueName?: string | null
  guestCount?: number | null
  confirmedGuests?: number
  declinedGuests?: number
  checklistProgress?: number
  totalBudget?: number
  totalSpent?: number
  status: EventStatus
  tier?: EventTier
  createdAt: string
  updatedAt: string
}

export interface EventDetail extends EventSummary {
  eventType?: unknown
  address?: unknown
  checklist?: unknown
  budget?: unknown
  guestList?: unknown
  timeline?: unknown
  vendors?: unknown[]
}

export interface CreateEventInput {
  name: string
  eventTypeId: string
  eventDate: string
  description?: string
  venue?: string
  expectedGuests?: number
  addressId?: string
  tier?: EventTier
}

export interface UpdateEventInput {
  name?: string
  eventTypeId?: string
  eventDate?: string
  description?: string
  venue?: string
  expectedGuests?: number
  addressId?: string
  status?: EventStatus
}

export interface SearchEventParams {
  status?: EventStatus
  eventTypeId?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}
