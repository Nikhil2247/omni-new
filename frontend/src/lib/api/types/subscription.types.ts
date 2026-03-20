// ============================================
// Subscription System Types
// ============================================

// Enums
export type PlanTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type UserPlanTier = 'FREE' | 'BASIC' | 'PREMIUM'
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME'
export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'PAUSED'
  | 'EXPIRED'
export type FeatureLimitType =
  | 'BOOLEAN'
  | 'COUNT'
  | 'COUNT_PER_MONTH'
  | 'COUNT_PER_YEAR'
  | 'UNLIMITED'
export type CampaignType =
  | 'PROFILE_BOOST'
  | 'ALBUM_PROMOTION'
  | 'BANNER_AD'
  | 'FEATURED_LISTING'
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
export type CreditTransactionType =
  | 'SUBSCRIPTION_GRANT'
  | 'PURCHASE'
  | 'CAMPAIGN_SPEND'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'EXPIRY'

// ============================================
// Vendor Plans
// ============================================

export interface PlanFeature {
  id: string
  featureKey: string
  featureName: string
  description?: string
  limitType: FeatureLimitType
  limitValue?: number
  isHighlighted: boolean
  sortOrder: number
}

export interface PlanPrice {
  id: string
  billingCycle: BillingCycle
  amount: number
  currency: string
  stripePriceId?: string
  razorpayPlanId?: string
  savingsPercent?: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  tier: PlanTier
  description?: string
  displayOrder: number
  isPopular: boolean
  trialDays: number
  isActive: boolean
  isPublic: boolean
  features: PlanFeature[]
  prices: PlanPrice[]
}

export interface Subscription {
  id: string
  vendorProfileId: string
  planId: string
  priceId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  trialStart?: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  plan?: SubscriptionPlan
  price?: PlanPrice
}

// ============================================
// User Plans
// ============================================

export interface UserPlanFeature {
  id: string
  featureKey: string
  featureName: string
  description?: string
  limitType: FeatureLimitType
  limitValue?: number
  isHighlighted: boolean
  sortOrder: number
}

export interface UserPlanPrice {
  id: string
  billingCycle: BillingCycle
  amount: number
  currency: string
  stripePriceId?: string
  razorpayPlanId?: string
  savingsPercent?: number
}

export interface UserSubscriptionPlan {
  id: string
  name: string
  slug: string
  tier: UserPlanTier
  description?: string
  displayOrder: number
  isPopular: boolean
  trialDays: number
  isActive: boolean
  isPublic: boolean
  features: UserPlanFeature[]
  prices: UserPlanPrice[]
}

export interface UserSubscription {
  id: string
  userId: string
  planId: string
  priceId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  trialStart?: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  autoRenew: boolean
  plan?: UserSubscriptionPlan
  price?: UserPlanPrice
}

// ============================================
// Usage Tracking
// ============================================

export interface FeatureLimitStatus {
  featureKey: string
  limit: number
  used: number
  remaining: number
  isUnlimited: boolean
}

export interface EventUsage {
  eventId: string
  eventName?: string
  features: FeatureLimitStatus[]
}

// ============================================
// Campaigns
// ============================================

export interface Campaign {
  id: string
  vendorProfileId: string
  type: CampaignType
  name: string
  description?: string
  targetEntityId?: string
  targetEntityType?: string
  dailyBudget: number
  totalBudget: number
  creditsSpent: number
  startDate: string
  endDate?: string
  status: CampaignStatus
  // Approval workflow fields
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  // Performance metrics
  impressions: number
  clicks: number
  conversions: number
  createdAt?: string
  updatedAt?: string
}

export interface DailyStat {
  date: string
  impressions: number
  clicks: number
  conversions: number
  creditsSpent: number
}

export interface CampaignStats {
  campaign: Campaign
  ctr: number
  conversionRate: number
  costPerClick: number
  costPerConversion: number
  dailyStats: DailyStat[]
}

// ============================================
// Ad Credits
// ============================================

export interface AdCreditBalance {
  vendorProfileId: string
  balance: number
  lastUpdated: string
}

export interface AdCreditTransaction {
  id: string
  vendorProfileId: string
  type: CreditTransactionType
  amount: number
  balance: number
  referenceType?: string
  referenceId?: string
  description?: string
  createdAt: string
}

// ============================================
// Display DTOs for Pricing Page
// ============================================

export interface FeatureDisplay {
  key: string
  name: string
  description?: string
  limitType: FeatureLimitType
  limitValue?: number
  isHighlighted: boolean
  displayValue: string
  sortOrder: number
}

export interface PriceDisplay {
  id: string
  billingCycle: BillingCycle
  amount: number
  currency: string
  savingsPercent?: number
  formattedPrice: string
}

export interface PlanDisplay {
  id: string
  name: string
  slug: string
  tier: PlanTier | UserPlanTier
  description?: string
  displayOrder: number
  isPopular: boolean
  trialDays: number
  monthlyPrice?: number
  features: FeatureDisplay[]
  allPrices: PriceDisplay[]
}

// ============================================
// Request DTOs
// ============================================

export interface SubscribeRequest {
  planId: string
  priceId: string
  paymentMethodId?: string
}

export interface UpgradeRequest {
  newPlanId: string
  newPriceId: string
  immediateUpgrade?: boolean
}

export interface CreateCampaignRequest {
  type: CampaignType
  name: string
  description?: string
  targetEntityId?: string
  targetEntityType?: string
  dailyBudget: number
  totalBudget: number
  startDate: string
  endDate?: string
}

export interface UpdateCampaignRequest {
  name?: string
  description?: string
  dailyBudget?: number
  totalBudget?: number
  endDate?: string
}

export interface PurchaseCreditsRequest {
  amount: number
  paymentMethodId?: string
}

export interface CancelSubscriptionRequest {
  reason?: string
  feedback?: string
  cancelImmediately?: boolean
}

// ============================================
// Response DTOs
// ============================================

export interface SpendingSummary {
  totalSpent: number
  periodStart: string
  periodEnd: string
  byCampaignType: Record<CampaignType, number>
}

export interface PlansComparison {
  plans: PlanDisplay[]
  featureCategories: {
    name: string
    features: {
      key: string
      name: string
      description?: string
      values: Record<string, string | boolean | number>
    }[]
  }[]
}

export interface UserSubscriptionStatusResponse {
  hasSubscription: false
  tier: 'FREE'
  message?: string
}
