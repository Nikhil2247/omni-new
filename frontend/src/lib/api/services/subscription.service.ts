// ============================================================================
// SUBSCRIPTION SERVICE - API Services
// ============================================================================
// Service layer for subscription, campaigns, and ad credits management
// ============================================================================

import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  PlanDisplay,
  PlansComparison,
  UserSubscription,
  Subscription,
  FeatureLimitStatus,
  EventUsage,
  Campaign,
  CampaignStats,
  CampaignStatus,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  AdCreditBalance,
  AdCreditTransaction,
  SpendingSummary,
  SubscribeRequest,
  UpgradeRequest,
  CancelSubscriptionRequest,
  PurchaseCreditsRequest,
  UserSubscriptionStatusResponse,
} from '../types/subscription.types'

// ============================================================================
// Public Plans Service (for pricing page)
// ============================================================================

export const subscriptionService = {
  /**
   * Get all vendor plans (public)
   */
  getVendorPlans: async (): Promise<PlanDisplay[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.PLANS.VENDOR)
    return data?.data || data || []
  },

  /**
   * Get all user plans (public)
   */
  getUserPlans: async (): Promise<PlanDisplay[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.PLANS.USER)
    return data?.data || data || []
  },

  /**
   * Compare vendor plans (public)
   */
  compareVendorPlans: async (): Promise<PlansComparison> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.PLANS.VENDOR_COMPARE)
    return data?.data || data
  },

  /**
   * Compare user plans (public)
   */
  compareUserPlans: async (): Promise<PlansComparison> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC.PLANS.USER_COMPARE)
    return data?.data || data
  },
}

// ============================================================================
// User Subscription Service
// ============================================================================

export const userSubscriptionService = {
  /**
   * Get current user subscription
   */
  getCurrentSubscription: async (): Promise<UserSubscription | UserSubscriptionStatusResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.SUBSCRIPTION.CURRENT)
    return data?.data || data
  },

  /**
   * Subscribe to a plan
   */
  subscribe: async (payload: SubscribeRequest): Promise<UserSubscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.SUBSCRIPTION.SUBSCRIBE, payload)
    return data?.data || data
  },

  /**
   * Upgrade plan
   */
  upgrade: async (payload: UpgradeRequest): Promise<UserSubscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.SUBSCRIPTION.UPGRADE, payload)
    return data?.data || data
  },

  /**
   * Cancel subscription
   */
  cancel: async (payload: CancelSubscriptionRequest): Promise<UserSubscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.SUBSCRIPTION.CANCEL, payload)
    return data?.data || data
  },

  /**
   * Reactivate subscription
   */
  reactivate: async (): Promise<UserSubscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.SUBSCRIPTION.REACTIVATE)
    return data?.data || data
  },

  /**
   * Downgrade plan
   */
  downgrade: async (payload: UpgradeRequest & { reason?: string }): Promise<UserSubscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.SUBSCRIPTION.DOWNGRADE, payload)
    return data?.data || data
  },

  /**
   * Pause subscription
   */
  pause: async (durationMonths: number): Promise<UserSubscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.SUBSCRIPTION.PAUSE, { durationMonths })
    return data?.data || data
  },

  /**
   * Resume subscription
   */
  resume: async (): Promise<UserSubscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.SUBSCRIPTION.RESUME)
    return data?.data || data
  },

  /**
   * Get usage summary
   */
  getUsage: async (): Promise<FeatureLimitStatus[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.SUBSCRIPTION.USAGE)
    return data?.data || data || []
  },

  /**
   * Get event usage
   */
  getEventUsage: async (eventId: string): Promise<EventUsage> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.SUBSCRIPTION.EVENT_USAGE(eventId))
    return data?.data || data
  },
}

// ============================================================================
// Vendor Subscription Service
// ============================================================================

export const vendorSubscriptionService = {
  /**
   * Get current vendor subscription
   */
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.CURRENT)
    // Response format: { success, data: { hasActiveSubscription, subscription } }
    const responseData = data?.data || data
    // Return the subscription object or null if not active
    if (responseData?.hasActiveSubscription && responseData?.subscription) {
      return responseData.subscription
    }
    return responseData?.subscription || null
  },

  /**
   * Subscribe to a plan
   */
  subscribe: async (payload: SubscribeRequest): Promise<Subscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.SUBSCRIBE, payload)
    return data?.data || data
  },

  /**
   * Upgrade plan
   */
  upgrade: async (payload: UpgradeRequest): Promise<Subscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.UPGRADE, payload)
    return data?.data || data
  },

  /**
   * Cancel subscription
   */
  cancel: async (payload: CancelSubscriptionRequest): Promise<Subscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.CANCEL, payload)
    return data?.data || data
  },

  /**
   * Reactivate subscription
   */
  reactivate: async (): Promise<Subscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.REACTIVATE)
    return data?.data || data
  },

  /**
   * Downgrade plan
   */
  downgrade: async (payload: UpgradeRequest & { reason?: string }): Promise<Subscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.DOWNGRADE, payload)
    return data?.data || data
  },

  /**
   * Pause subscription
   */
  pause: async (durationMonths: number): Promise<Subscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.PAUSE, { durationMonths })
    return data?.data || data
  },

  /**
   * Resume subscription
   */
  resume: async (): Promise<Subscription> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.RESUME)
    return data?.data || data
  },

  /**
   * Get usage summary
   */
  getUsage: async (): Promise<FeatureLimitStatus[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.SUBSCRIPTION.USAGE)
    // Backend returns { subscriptionId, planId, usage: [...] } wrapped in { success, data }
    const responseData = data?.data || data
    // Extract the usage array from the response
    if (Array.isArray(responseData)) {
      return responseData
    }
    return responseData?.usage || []
  },
}

// ============================================================================
// Campaign Service (for vendors)
// ============================================================================

export const campaignService = {
  /**
   * Get campaigns with optional status filter
   */
  getCampaigns: async (status?: CampaignStatus): Promise<Campaign[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.CAMPAIGNS.LIST, {
      params: status ? { status } : undefined,
    })
    return data?.data || data || []
  },

  /**
   * Get campaign by ID
   */
  getCampaign: async (campaignId: string): Promise<Campaign> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.CAMPAIGNS.BY_ID(campaignId))
    return data?.data || data
  },

  /**
   * Get campaign stats
   */
  getCampaignStats: async (campaignId: string): Promise<CampaignStats> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.CAMPAIGNS.STATS(campaignId))
    return data?.data || data
  },

  /**
   * Create campaign
   */
  createCampaign: async (payload: CreateCampaignRequest): Promise<Campaign> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.CAMPAIGNS.CREATE, payload)
    return data?.data || data
  },

  /**
   * Update campaign
   */
  updateCampaign: async (campaignId: string, payload: UpdateCampaignRequest): Promise<Campaign> => {
    const { data } = await apiClient.patch(
      API_ENDPOINTS.BUSINESS.CAMPAIGNS.BY_ID(campaignId),
      payload
    )
    return data?.data || data
  },

  /**
   * Submit campaign for approval
   */
  submitForApproval: async (campaignId: string): Promise<Campaign> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.CAMPAIGNS.SUBMIT(campaignId))
    return data?.data || data
  },

  /**
   * Resubmit rejected campaign for approval
   */
  resubmitForApproval: async (campaignId: string): Promise<Campaign> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.CAMPAIGNS.RESUBMIT(campaignId))
    return data?.data || data
  },

  /**
   * Start campaign (only APPROVED campaigns)
   */
  startCampaign: async (campaignId: string): Promise<Campaign> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.CAMPAIGNS.START(campaignId))
    return data?.data || data
  },

  /**
   * Pause campaign
   */
  pauseCampaign: async (campaignId: string): Promise<Campaign> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.CAMPAIGNS.PAUSE(campaignId))
    return data?.data || data
  },

  /**
   * Resume campaign
   */
  resumeCampaign: async (campaignId: string): Promise<Campaign> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.CAMPAIGNS.RESUME(campaignId))
    return data?.data || data
  },

  /**
   * Stop campaign
   */
  stopCampaign: async (campaignId: string): Promise<Campaign> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.CAMPAIGNS.STOP(campaignId))
    return data?.data || data
  },

  /**
   * Cancel/delete campaign
   */
  cancelCampaign: async (campaignId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.BUSINESS.CAMPAIGNS.BY_ID(campaignId))
  },
}

// ============================================================================
// Ad Credits Service (for vendors)
// ============================================================================

export const adCreditsService = {
  /**
   * Get current credit balance
   */
  getBalance: async (): Promise<AdCreditBalance> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.AD_CREDITS.BALANCE)
    return data?.data || data
  },

  /**
   * Get credit transaction history
   */
  getHistory: async (limit?: number): Promise<AdCreditTransaction[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.AD_CREDITS.HISTORY, {
      params: limit ? { limit } : undefined,
    })
    return data?.data || data || []
  },

  /**
   * Get spending summary for date range
   */
  getSpendingSummary: async (startDate: string, endDate: string): Promise<SpendingSummary> => {
    const { data } = await apiClient.get(API_ENDPOINTS.BUSINESS.AD_CREDITS.SPENDING_SUMMARY, {
      params: { startDate, endDate },
    })
    return data?.data || data
  },

  /**
   * Purchase additional credits
   */
  purchaseCredits: async (payload: PurchaseCreditsRequest): Promise<AdCreditTransaction> => {
    const { data } = await apiClient.post(API_ENDPOINTS.BUSINESS.AD_CREDITS.PURCHASE, payload)
    return data?.data || data
  },
}
