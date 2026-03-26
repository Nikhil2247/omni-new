// ============================================================================
// SUBSCRIPTION HOOKS - React Query Hooks
// ============================================================================
// React Query hooks for subscription, campaigns, and ad credits management
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  subscriptionService,
  userSubscriptionService,
  vendorSubscriptionService,
  campaignService,
  adCreditsService,
  eventCreditsService,
} from '@/lib/api/services/subscription.service'
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
  EventCreditProduct,
  EventCreditBalance,
  EventCreditTransaction,
  EventTierFeature,
  CanCreateEventResponse,
  EventCreditPricingSummary,
  PurchaseEventCreditsRequest,
  EventTier,
} from '@/lib/api/types/subscription.types'

// ============================================================================
// Query Keys
// ============================================================================

export const subscriptionKeys = {
  all: ['subscription'] as const,
  vendorPlans: () => [...subscriptionKeys.all, 'vendor-plans'] as const,
  userPlans: () => [...subscriptionKeys.all, 'user-plans'] as const,
  vendorPlansComparison: () => [...subscriptionKeys.all, 'vendor-plans-comparison'] as const,
  userPlansComparison: () => [...subscriptionKeys.all, 'user-plans-comparison'] as const,
  userSubscription: () => [...subscriptionKeys.all, 'user-subscription'] as const,
  vendorSubscription: () => [...subscriptionKeys.all, 'vendor-subscription'] as const,
  userUsage: () => [...subscriptionKeys.all, 'user-usage'] as const,
  vendorUsage: () => [...subscriptionKeys.all, 'vendor-usage'] as const,
  eventUsage: (eventId: string) => [...subscriptionKeys.all, 'event-usage', eventId] as const,
  campaigns: (status?: CampaignStatus) => [...subscriptionKeys.all, 'campaigns', status] as const,
  campaign: (id: string) => [...subscriptionKeys.all, 'campaign', id] as const,
  campaignStats: (id: string) => [...subscriptionKeys.all, 'campaign-stats', id] as const,
  adCreditBalance: () => [...subscriptionKeys.all, 'ad-credit-balance'] as const,
  adCreditHistory: (limit?: number) => [...subscriptionKeys.all, 'ad-credit-history', limit] as const,
  spendingSummary: (startDate: string, endDate: string) =>
    [...subscriptionKeys.all, 'spending-summary', startDate, endDate] as const,
  // Event Credits
  eventCreditProducts: () => [...subscriptionKeys.all, 'event-credit-products'] as const,
  eventCreditPricing: () => [...subscriptionKeys.all, 'event-credit-pricing'] as const,
  eventCreditBalance: () => [...subscriptionKeys.all, 'event-credit-balance'] as const,
  eventCreditTransactions: (limit?: number) => [...subscriptionKeys.all, 'event-credit-transactions', limit] as const,
  eventCreditCanCreate: (tier: EventTier) => [...subscriptionKeys.all, 'event-credit-can-create', tier] as const,
  eventTierFeatures: (tier: EventTier) => [...subscriptionKeys.all, 'event-tier-features', tier] as const,
}

// ============================================================================
// Plans Queries (Public)
// ============================================================================

/**
 * Get all vendor plans for pricing page
 */
export function useVendorPlans(options?: { enabled?: boolean }) {
  return useQuery<PlanDisplay[]>({
    queryKey: subscriptionKeys.vendorPlans(),
    queryFn: () => subscriptionService.getVendorPlans(),
    staleTime: 5 * 60 * 1000, // Plans don't change often
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get all user plans for pricing page
 */
export function useUserPlans(options?: { enabled?: boolean }) {
  return useQuery<PlanDisplay[]>({
    queryKey: subscriptionKeys.userPlans(),
    queryFn: () => subscriptionService.getUserPlans(),
    staleTime: 5 * 60 * 1000, // Plans don't change often
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get vendor plans comparison for pricing page
 */
export function useVendorPlansComparison(options?: { enabled?: boolean }) {
  return useQuery<PlansComparison>({
    queryKey: subscriptionKeys.vendorPlansComparison(),
    queryFn: () => subscriptionService.compareVendorPlans(),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get user plans comparison for pricing page
 */
export function useUserPlansComparison(options?: { enabled?: boolean }) {
  return useQuery<PlansComparison>({
    queryKey: subscriptionKeys.userPlansComparison(),
    queryFn: () => subscriptionService.compareUserPlans(),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

// ============================================================================
// User Subscription Queries & Mutations
// ============================================================================

/**
 * Get current user subscription
 */
export function useUserSubscription(options?: { enabled?: boolean }) {
  return useQuery<UserSubscription | UserSubscriptionStatusResponse>({
    queryKey: subscriptionKeys.userSubscription(),
    queryFn: () => userSubscriptionService.getCurrentSubscription(),
    staleTime: 60_000,
    retry: false,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get user usage summary
 */
export function useUserUsage(options?: { enabled?: boolean }) {
  return useQuery<FeatureLimitStatus[]>({
    queryKey: subscriptionKeys.userUsage(),
    queryFn: () => userSubscriptionService.getUsage(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get event-specific usage
 */
export function useEventUsage(eventId: string, options?: { enabled?: boolean }) {
  return useQuery<EventUsage>({
    queryKey: subscriptionKeys.eventUsage(eventId),
    queryFn: () => userSubscriptionService.getEventUsage(eventId),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!eventId,
  })
}

/**
 * Subscribe to a user plan
 */
export function useSubscribe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubscribeRequest) => userSubscriptionService.subscribe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userSubscription() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userUsage() })
    },
  })
}

/**
 * Upgrade user plan
 */
export function useUpgradePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpgradeRequest) => userSubscriptionService.upgrade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userSubscription() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userUsage() })
    },
  })
}

/**
 * Cancel user subscription
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CancelSubscriptionRequest) => userSubscriptionService.cancel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userSubscription() })
    },
  })
}

/**
 * Reactivate user subscription
 */
export function useReactivateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => userSubscriptionService.reactivate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userSubscription() })
    },
  })
}

/**
 * Downgrade user plan
 */
export function useDowngradePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpgradeRequest & { reason?: string }) =>
      userSubscriptionService.downgrade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userSubscription() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userUsage() })
    },
  })
}

/**
 * Pause user subscription
 */
export function usePauseSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (durationMonths: number) => userSubscriptionService.pause(durationMonths),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userSubscription() })
    },
  })
}

/**
 * Resume user subscription
 */
export function useResumeSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => userSubscriptionService.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.userSubscription() })
    },
  })
}

// ============================================================================
// Vendor Subscription Queries & Mutations
// ============================================================================

/**
 * Get current vendor subscription
 */
export function useVendorSubscription(options?: { enabled?: boolean }) {
  return useQuery<Subscription | null>({
    queryKey: subscriptionKeys.vendorSubscription(),
    queryFn: () => vendorSubscriptionService.getCurrentSubscription(),
    staleTime: 60_000,
    retry: false,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get vendor usage summary
 */
export function useVendorUsage(options?: { enabled?: boolean }) {
  return useQuery<FeatureLimitStatus[]>({
    queryKey: subscriptionKeys.vendorUsage(),
    queryFn: () => vendorSubscriptionService.getUsage(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Subscribe to a vendor plan
 */
export function useVendorSubscribe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubscribeRequest) => vendorSubscriptionService.subscribe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorSubscription() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorUsage() })
    },
  })
}

/**
 * Upgrade vendor plan
 */
export function useVendorUpgradePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpgradeRequest) => vendorSubscriptionService.upgrade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorSubscription() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorUsage() })
    },
  })
}

/**
 * Cancel vendor subscription
 */
export function useVendorCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CancelSubscriptionRequest) => vendorSubscriptionService.cancel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorSubscription() })
    },
  })
}

/**
 * Reactivate vendor subscription
 */
export function useVendorReactivateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => vendorSubscriptionService.reactivate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorSubscription() })
    },
  })
}

/**
 * Downgrade vendor plan
 */
export function useVendorDowngradePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpgradeRequest & { reason?: string }) =>
      vendorSubscriptionService.downgrade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorSubscription() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorUsage() })
    },
  })
}

/**
 * Pause vendor subscription
 */
export function useVendorPauseSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (durationMonths: number) => vendorSubscriptionService.pause(durationMonths),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorSubscription() })
    },
  })
}

/**
 * Resume vendor subscription
 */
export function useVendorResumeSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => vendorSubscriptionService.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.vendorSubscription() })
    },
  })
}

// ============================================================================
// Campaign Queries & Mutations
// ============================================================================

/**
 * Get campaigns with optional status filter
 */
export function useCampaigns(status?: CampaignStatus, options?: { enabled?: boolean }) {
  return useQuery<Campaign[]>({
    queryKey: subscriptionKeys.campaigns(status),
    queryFn: () => campaignService.getCampaigns(status),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get campaign by ID
 */
export function useCampaign(campaignId: string, options?: { enabled?: boolean }) {
  return useQuery<Campaign>({
    queryKey: subscriptionKeys.campaign(campaignId),
    queryFn: () => campaignService.getCampaign(campaignId),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!campaignId,
  })
}

/**
 * Get campaign statistics
 */
export function useCampaignStats(campaignId: string, options?: { enabled?: boolean }) {
  return useQuery<CampaignStats>({
    queryKey: subscriptionKeys.campaignStats(campaignId),
    queryFn: () => campaignService.getCampaignStats(campaignId),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!campaignId,
  })
}

/**
 * Create a new campaign
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCampaignRequest) => campaignService.createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.adCreditBalance() })
    },
  })
}

/**
 * Update an existing campaign
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ campaignId, payload }: { campaignId: string; payload: UpdateCampaignRequest }) =>
      campaignService.updateCampaign(campaignId, payload),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaign(campaignId) })
    },
  })
}

/**
 * Submit a campaign for approval
 */
export function useSubmitCampaignForApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.submitForApproval(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaign(campaignId) })
    },
  })
}

/**
 * Resubmit a rejected campaign for approval
 */
export function useResubmitCampaignForApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.resubmitForApproval(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaign(campaignId) })
    },
  })
}

/**
 * Start a campaign (only APPROVED campaigns)
 */
export function useStartCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.startCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaign(campaignId) })
    },
  })
}

/**
 * Pause an active campaign
 */
export function usePauseCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.pauseCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaign(campaignId) })
    },
  })
}

/**
 * Resume a paused campaign
 */
export function useResumeCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.resumeCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaign(campaignId) })
    },
  })
}

/**
 * Stop/complete a campaign
 */
export function useStopCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.stopCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaign(campaignId) })
    },
  })
}

/**
 * Cancel/delete a campaign
 */
export function useCancelCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignService.cancelCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.campaigns() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.adCreditBalance() })
    },
  })
}

// ============================================================================
// Ad Credits Queries & Mutations
// ============================================================================

/**
 * Get current ad credit balance
 */
export function useAdCreditBalance(options?: { enabled?: boolean }) {
  return useQuery<AdCreditBalance>({
    queryKey: subscriptionKeys.adCreditBalance(),
    queryFn: () => adCreditsService.getBalance(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get ad credit transaction history
 */
export function useAdCreditHistory(limit?: number, options?: { enabled?: boolean }) {
  return useQuery<AdCreditTransaction[]>({
    queryKey: subscriptionKeys.adCreditHistory(limit),
    queryFn: () => adCreditsService.getHistory(limit),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get spending summary for date range
 */
export function useSpendingSummary(
  startDate: string,
  endDate: string,
  options?: { enabled?: boolean }
) {
  return useQuery<SpendingSummary>({
    queryKey: subscriptionKeys.spendingSummary(startDate, endDate),
    queryFn: () => adCreditsService.getSpendingSummary(startDate, endDate),
    staleTime: 60_000,
    enabled: (options?.enabled ?? true) && !!startDate && !!endDate,
  })
}

/**
 * Purchase additional credits
 */
export function usePurchaseCredits() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PurchaseCreditsRequest) => adCreditsService.purchaseCredits(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.adCreditBalance() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.adCreditHistory() })
    },
  })
}

// ============================================================================
// Event Credits Queries & Mutations (Event-Based Pricing)
// ============================================================================

/**
 * Get event credit products (public - for pricing page)
 */
export function useEventCreditProducts(options?: { enabled?: boolean }) {
  return useQuery<EventCreditProduct[]>({
    queryKey: subscriptionKeys.eventCreditProducts(),
    queryFn: () => eventCreditsService.getProducts(),
    staleTime: 5 * 60 * 1000, // Products don't change often
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get event credit pricing summary (public - for pricing page)
 */
export function useEventCreditPricing(options?: { enabled?: boolean }) {
  return useQuery<EventCreditPricingSummary>({
    queryKey: subscriptionKeys.eventCreditPricing(),
    queryFn: () => eventCreditsService.getPricingSummary(),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get current user's event credit balance
 */
export function useEventCreditBalance(options?: { enabled?: boolean }) {
  return useQuery<EventCreditBalance>({
    queryKey: subscriptionKeys.eventCreditBalance(),
    queryFn: () => eventCreditsService.getBalance(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Check if user can create event with specified tier
 */
export function useCanCreateEvent(tier: EventTier, options?: { enabled?: boolean }) {
  return useQuery<CanCreateEventResponse>({
    queryKey: subscriptionKeys.eventCreditCanCreate(tier),
    queryFn: () => eventCreditsService.canCreateEvent(tier),
    staleTime: 30_000,
    enabled: (options?.enabled ?? true) && !!tier,
  })
}

/**
 * Get event credit transaction history
 */
export function useEventCreditTransactions(limit?: number, options?: { enabled?: boolean }) {
  return useQuery<EventCreditTransaction[]>({
    queryKey: subscriptionKeys.eventCreditTransactions(limit),
    queryFn: () => eventCreditsService.getTransactions(limit),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Get features for a specific tier
 */
export function useEventTierFeatures(tier: EventTier, options?: { enabled?: boolean }) {
  return useQuery<EventTierFeature[]>({
    queryKey: subscriptionKeys.eventTierFeatures(tier),
    queryFn: () => eventCreditsService.getTierFeatures(tier),
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) && !!tier,
  })
}

/**
 * Purchase event credits
 */
export function usePurchaseEventCredits() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PurchaseEventCreditsRequest) => eventCreditsService.purchase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.eventCreditBalance() })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.eventCreditTransactions() })
    },
  })
}
