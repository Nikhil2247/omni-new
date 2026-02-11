export type VendorStatus =
  | 'DRAFT'
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
  contactEmail?: string
  contactPhone?: string
  website?: string
  addressId?: string
  serviceRadius?: number
  status: VendorStatus
  leadCount: number
  viewCount: number
  followersCount?: number
  reviewsCount?: number
  verifiedAt?: string
  featuredUntil?: string
  isFollowing?: boolean
  createdAt: string
  updatedAt: string
  badges?: VendorBadge[]
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
