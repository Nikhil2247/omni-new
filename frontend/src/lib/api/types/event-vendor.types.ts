export type EventVendorStatus =
  | 'SHORTLISTED'
  | 'CONTACTED'
  | 'BOOKED'
  | 'CONFIRMED'
  | 'CANCELLED'

export interface EventVendor {
  id: string
  eventId: string
  vendorProfileId: string
  status: EventVendorStatus
  notes?: string | null
  contractAmount?: number | string | null
  depositPaid?: number | string | null
  createdAt: string
  updatedAt: string
}

export interface AddEventVendorInput {
  eventId: string
  vendorProfileId: string
  contractAmount?: number
  depositPaid?: number
  notes?: string
  status?: EventVendorStatus
}

export interface UpdateEventVendorInput {
  contractAmount?: number
  depositPaid?: number
  notes?: string
  status?: EventVendorStatus
}
