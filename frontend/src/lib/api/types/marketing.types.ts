export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type MarketingCampaignStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'

export type MarketingCampaignType =
  | 'PROFILE_BOOST'
  | 'ALBUM_PROMOTION'
  | 'BANNER_AD'
  | 'FEATURED_LISTING'

export interface MarketingCampaign {
  id: string
  vendorProfileId?: string
  type: MarketingCampaignType
  name: string
  description?: string | null
  targetEntityId?: string | null
  targetEntityType?: string | null
  dailyBudget: number
  totalBudget: number
  creditsSpent: number
  impressions: number
  clicks: number
  conversions: number
  status: MarketingCampaignStatus
  startDate: string
  endDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface MarketingCampaignSearchParams {
  status?: MarketingCampaignStatus
  type?: MarketingCampaignType
  search?: string
  page?: number
  limit?: number
}

export interface MarketingCampaignUpdatePayload {
  name?: string
  description?: string
  targetEntityId?: string
  targetEntityType?: string
  dailyBudget?: number
  totalBudget?: number
  startDate?: string
  endDate?: string
}

export interface MarketingCampaignDailyStat {
  date: string
  impressions: number
  clicks: number
  conversions: number
  creditsSpent: number
}

export interface MarketingCampaignStats {
  campaignId: string
  name: string
  type: MarketingCampaignType
  status: MarketingCampaignStatus
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
  dailyStats: MarketingCampaignDailyStat[]
}

export interface MarketingCategory {
  id: string
  name: string
  slug?: string
  isActive?: boolean
}

export interface MarketingMediaItem {
  id: string
  name?: string
  url?: string
  type?: string
  size?: number
  createdAt?: string
}

export interface MarketingPromotion {
  id: string
  name: string
  status?: string
  startsAt?: string | null
  endsAt?: string | null
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  keywords: string[]
  ogImage?: string | null
  featuredImage?: string | null
  featuredImageAlt?: string | null
  status: BlogStatus
  publishedAt?: string | null
  authorId: string
  categoryId?: string | null
  viewCount: number
  readingTime: number
  vendorId?: string | null
  createdAt: string
  updatedAt: string
  category?: BlogCategory | null
  tags?: BlogPostTag[]
  author?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  color?: string | null
  isActive: boolean
}

export interface BlogTag {
  id: string
  name: string
  slug: string
}

export interface BlogPostTag {
  tagId: string
  tag: BlogTag
}

export interface BlogPostCreatePayload {
  title: string
  content: string
  slug?: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  keywords?: string[]
  ogImage?: string
  featuredImage?: string
  featuredImageAlt?: string
  categoryId?: string
  tagIds?: string[]
  vendorId?: string
  readingTime?: number
}

export interface BlogPostUpdatePayload extends Partial<BlogPostCreatePayload> {
  status?: BlogStatus
}

export interface BlogPostSearchParams {
  status?: BlogStatus
  categoryId?: string
  tagId?: string
  keyword?: string
  sortBy?: 'latest' | 'mostViewed'
  page?: number
  limit?: number
}
