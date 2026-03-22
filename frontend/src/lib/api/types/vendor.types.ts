export type VendorStatus =
  | 'DRAFT'
  | 'UNCLAIMED'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
}

export interface VendorAddress {
  id: string
  addressLine1?: string
  addressLine2?: string
  postalCode?: string
  city?: {
    id: string
    name: string
    state?: {
      id: string
      name: string
      country?: {
        id: string
        name: string
      }
    }
  }
}

export interface VendorProfile {
  id: string
  userId: string
  businessName: string
  slug: string
  categoryId: string
  category?: Category
  tagline?: string
  description?: string
  profilePhotoUrl?: string
  bannerImageUrl?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  addressId?: string
  address?: VendorAddress
  serviceRadius?: number
  status: VendorStatus
  leadCount: number
  viewCount: number
  followersCount?: number
  reviewsCount?: number
  averageRating?: number | null
  verifiedAt?: string
  featuredUntil?: string
  isFollowing?: boolean
  createdAt: string
  updatedAt: string
  badges?: VendorBadge[]
  eventHistory?: VendorEventHistory[]
}

export type EventVendorStatus = 'SHORTLISTED' | 'CONTACTED' | 'BOOKED' | 'CONFIRMED' | 'CANCELLED'
export type EventStatus = 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface VendorEventHistory {
  id: string
  status: EventVendorStatus
  notes?: string | null
  contractAmount?: number | null
  depositPaid?: number | null
  createdAt: string
  event: {
    id: string
    name: string
    date?: string | null
    endDate?: string | null
    venueName?: string | null
    guestCount?: number | null
    description?: string | null
    status: EventStatus
    eventType?: {
      id: string
      name: string
      slug: string
    } | null
  }
}

export type VendorBadgeMetric = 'FOLLOWERS' | 'REVIEWS' | 'LEADS' | 'VIEWS'

export interface VendorBadgeDefinition {
  id: string
  key: string
  name: string
  description?: string | null
  metric: VendorBadgeMetric
  threshold: number
  icon?: string | null
  color?: string | null
}

export interface VendorBadge {
  id: string
  vendorProfileId: string
  badgeDefinitionId: string
  achievedAt: string
  definition?: VendorBadgeDefinition
}

export interface VendorSearchParams {
  query?: string
  categoryId?: string
  cityId?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'leadCount' | 'viewCount'
  sortOrder?: 'asc' | 'desc'
}
