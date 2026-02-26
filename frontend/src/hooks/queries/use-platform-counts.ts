/**
 * Platform Counts Hook
 *
 * Easy access to automated platform counts with real-time updates
 */

import { useQuery } from '@tanstack/react-query';
import { insightsService } from '@/lib/api/services/insights.service';

/**
 * Platform-wide counts interface
 */
export interface PlatformCounts {
  // Users
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  verifiedUsers: number;

  // Vendors
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  verifiedVendors: number;

  // Leads
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;

  // Events
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;

  // Content
  totalCategories: number;
  totalServices: number;
  totalPortfolios: number;
  totalReviews: number;
  approvedReviews: number;

  // Engagement
  totalSearches: number;
  totalProfileViews: number;
  totalMessages: number;

  // Funnels (Last 30 Days)
  vendorDiscoveryStarted: number;
  vendorDiscoveryCompleted: number;
  userSignupStarted: number;
  userSignupCompleted: number;
  vendorOnboardingStarted: number;
  vendorOnboardingCompleted: number;
  eventPlanningStarted: number;
  eventPlanningCompleted: number;

  // System
  lastUpdated: string;
  updateDuration: number;
}

/**
 * Funnel conversion rates
 */
export interface FunnelConversionRates {
  vendorDiscovery: number;
  userSignup: number;
  vendorOnboarding: number;
  eventPlanning: number;
}

/**
 * Fetch all platform counts
 */
async function fetchPlatformCounts(): Promise<PlatformCounts> {
  return insightsService.getCounts();
}

/**
 * Fetch funnel conversion rates
 */
async function fetchFunnelConversionRates(): Promise<FunnelConversionRates> {
  return insightsService.getFunnelConversionRates();
}

/**
 * Fetch count for specific entity
 */
async function fetchEntityCount(
  entity:
    | 'users'
    | 'vendors'
    | 'leads'
    | 'events'
    | 'categories'
    | 'services'
    | 'portfolios'
    | 'reviews',
): Promise<{ entity: string; count: number }> {
  return insightsService.getEntityCount(entity);
}

/**
 * Hook: Get all platform counts
 *
 * Automatically updates every 5 minutes (matches backend cache TTL)
 * Data is cached and served instantly from Redis on backend
 *
 * @example
 * ```tsx
 * function DashboardStats() {
 *   const { data: counts, isLoading } = usePlatformCounts();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <h1>Total Users: {counts.totalUsers}</h1>
 *       <h1>Total Vendors: {counts.totalVendors}</h1>
 *       <h1>Total Leads: {counts.totalLeads}</h1>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlatformCounts(options?: {
  refetchInterval?: number; // milliseconds
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['platform-counts'],
    queryFn: fetchPlatformCounts,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache)
    refetchInterval: options?.refetchInterval || 5 * 60 * 1000, // Auto-refresh every 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook: Get funnel conversion rates
 *
 * @example
 * ```tsx
 * function FunnelStats() {
 *   const { data: rates } = useFunnelConversionRates();
 *
 *   return (
 *     <div>
 *       <p>Vendor Discovery: {rates.vendorDiscovery.toFixed(1)}%</p>
 *       <p>User Signup: {rates.userSignup.toFixed(1)}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFunnelConversionRates(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['funnel-conversion-rates'],
    queryFn: fetchFunnelConversionRates,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: options?.refetchInterval || 10 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook: Get count for specific entity
 *
 * @example
 * ```tsx
 * function UserCount() {
 *   const { data } = useEntityCount('users');
 *
 *   return <div>Total Users: {data?.count}</div>;
 * }
 * ```
 */
export function useEntityCount(
  entity:
    | 'users'
    | 'vendors'
    | 'leads'
    | 'events'
    | 'categories'
    | 'services'
    | 'portfolios'
    | 'reviews',
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: ['entity-count', entity],
    queryFn: () => fetchEntityCount(entity),
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval || 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Helper: Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  const safePart = part ?? 0;
  const safeTotal = total ?? 0;
  if (safeTotal === 0) return 0;
  return (safePart / safeTotal) * 100;
}

/**
 * Helper: Calculate conversion rate
 */
export function calculateConversionRate(completed: number, started: number): number {
  return calculatePercentage(completed ?? 0, started ?? 0);
}

/**
 * Helper: Format count with K/M suffix
 */
export function formatCount(count: number): string {
  const safeCount = count ?? 0;
  if (safeCount >= 1000000) {
    return `${(safeCount / 1000000).toFixed(1)}M`;
  }
  if (safeCount >= 1000) {
    return `${(safeCount / 1000).toFixed(1)}K`;
  }
  return safeCount.toString();
}

/**
 * Helper: Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const safeValue = value ?? 0;
  return `${safeValue.toFixed(decimals)}%`;
}
