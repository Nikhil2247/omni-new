export type RSVPStatus = 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'

export interface Guest {
  id: string
  guestlistId: string
  firstName: string
  lastName?: string | null
  email?: string | null
  phone?: string | null
  rsvpStatus: RSVPStatus
  plusOne: number
  tableNumber?: number | null
  dietaryReq?: string | null
  notes?: string | null
  createdAt: string
  // RSVP Link Fields
  rsvpToken?: string | null
  rsvpAt?: string | null
  rsvpMessage?: string | null
}

export interface Guestlist {
  id: string
  eventId: string
  createdAt: string
  guests?: Guest[]
}

export interface CreateGuestlistInput {
  eventId: string
}

export interface CreateGuestInput {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  plusOne?: number
  tableNumber?: number
  dietaryReq?: string
  notes?: string
}

export interface UpdateGuestInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  rsvpStatus?: RSVPStatus
  plusOne?: number
  tableNumber?: number
  dietaryReq?: string
  notes?: string
}

export interface UpdateRsvpInput {
  rsvpStatus: RSVPStatus
  plusOne?: number
}
