// ============================================================================
// ADMIN CAMPAIGN TYPES
// ============================================================================
// Types for admin campaign management and approval workflow
// ============================================================================

// ============================================================================
// Enums
// ============================================================================

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'

export type CampaignType =
  | 'PROFILE_BOOST'
  | 'ALBUM_PROMOTION'
  | 'BANNER_AD'
  | 'FEATURED_LISTING'

// ============================================================================
// Filter Types
// ============================================================================

export interface AdminCampaignFilterParams {
  status?: CampaignStatus
  vendorId?: string
  type?: CampaignType
  fromDate?: string
  toDate?: string
  search?: string
  page?: number
  limit?: number
}

// ============================================================================
// Request Types
// ============================================================================

export interface RejectCampaignRequest {
  reason: string
  internalNotes?: string
}

// ============================================================================
// Response Types
// ============================================================================

export interface AdminCampaignVendor {
  id: string
  businessName: string
  slug?: string
}

export interface AdminCampaignUser {
  id: string
  firstName?: string | null
  lastName?: string | null
  email: string
}

export interface AdminCampaign {
  id: string
  vendorProfileId: string
  type: CampaignType
  name: string
  description?: string | null
  targetEntityId?: string | null
  targetEntityType?: string | null
  dailyBudget: number
  totalBudget: number
  creditsSpent: number
  startDate: string
  endDate?: string | null
  status: CampaignStatus
  // Approval workflow fields
  submittedAt?: string | null
  approvedAt?: string | null
  approvedBy?: AdminCampaignUser | null
  rejectedAt?: string | null
  rejectedBy?: AdminCampaignUser | null
  rejectionReason?: string | null
  internalNotes?: string | null
  // Performance metrics
  impressions: number
  clicks: number
  conversions: number
  // Timestamps
  createdAt: string
  updatedAt: string
  // Related entities
  vendorProfile?: AdminCampaignVendor
}

export interface AdminCampaignListResponse {
  data: AdminCampaign[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface CampaignStatusCounts {
  DRAFT: number
  PENDING_APPROVAL: number
  APPROVED: number
  REJECTED: number
  SCHEDULED: number
  ACTIVE: number
  PAUSED: number
  COMPLETED: number
  CANCELLED: number
  TOTAL: number
}

export interface CampaignApprovalResult {
  success: boolean
  campaign: AdminCampaign
  message?: string
}

// ============================================================================
// Campaign Stats Types
// ============================================================================

export interface CampaignDailyStat {
  date: string
  impressions: number
  clicks: number
  conversions: number
  creditsSpent: number
}

export interface CampaignStats {
  campaignId: string
  name: string
  type: CampaignType
  status: CampaignStatus
  impressions: number
  clicks: number
  conversions: number
  creditsSpent: number
  totalBudget: number
  dailyBudget: number
  remainingBudget: number
  ctr: number
  conversionRate: number
  costPerClick: number
  costPerConversion: number
  budgetUtilization: number
  startDate: string
  endDate?: string | null
  dailyStats: CampaignDailyStat[]
}

// ============================================================================
// Status Display Helpers
// ============================================================================

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  SCHEDULED: 'default',
  ACTIVE: 'success',
  PAUSED: 'secondary',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  PROFILE_BOOST: 'Profile Boost',
  ALBUM_PROMOTION: 'Album Promotion',
  BANNER_AD: 'Banner Ad',
  FEATURED_LISTING: 'Featured Listing',
}
