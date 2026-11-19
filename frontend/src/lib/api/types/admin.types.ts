export interface AdminUserRole {
  id: string
  role: {
    id: string
    name: string
    displayName: string
  }
}

export interface AdminUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  avatarUrl: string | null
  status: string
  emailVerified: boolean
  emailVerifiedAt: string | null
  twoFactorEnabled: boolean
  hasCompletedOnboarding: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  userRoles?: AdminUserRole[]
  vendorProfile?: { id: string } | null
  sessions?: Array<{
    id: string
    deviceType?: string | null
    deviceName?: string | null
    location?: string | null
    ipAddress?: string | null
    lastActiveAt?: string | null
    createdAt?: string
    expiresAt?: string
    isCurrent?: boolean
  }>
}

export interface AdminUserListParams {
  query?: string
  status?: string
  role?: string
  page?: number
  limit?: number
}

export interface AdminRole {
  id: string
  name: string
  displayName: string
  description?: string | null
  level: number
  isSystem: boolean
  parentRole?: { id: string; name: string } | null
}

export type FeatureFlagCategory = 'marketing' | 'vendor' | 'user' | 'system'

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string | null
  category: FeatureFlagCategory
  enabled: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminAuditLog {
  id: string
  userId?: string | null
  action: string
  entityType: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

export interface AdminAuditParams {
  userId?: string
  entityType?: string
  entityId?: string
  action?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export interface SystemConfigState {
  maintenanceMode: boolean
  registrationEnabled: boolean
  allowVendorOnboarding: boolean
  supportEmail?: string
  environment?: string
}

export interface SystemHealthCheck {
  status: 'healthy' | 'degraded' | 'not_configured' | 'ok' | 'up' | 'error' | 'unknown'
  latencyMs?: number
  latency?: number
  error?: string
  details?: Record<string, unknown>
  connected?: boolean
}

export interface SystemHealthResources {
  uptimeSeconds: number
  nodeVersion: string
  environment: string
  platform: string
  pid: number
  memory: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    arrayBuffers?: number
  }
}

// Legacy format support
export interface SystemHealthStateLegacy {
  status: 'healthy' | 'degraded'
  checks: {
    database: SystemHealthCheck
    cache: SystemHealthCheck
    queue: SystemHealthCheck
    search: SystemHealthCheck
    storage: SystemHealthCheck
  }
  resources: SystemHealthResources
  timestamp: string
}

// New comprehensive health check format from /health/ready
export interface ServiceHealthStatus {
  status: string
  latency?: number
  details?: Record<string, unknown>
  connected?: boolean
  error?: string
  usedMemory?: string
  connectedClients?: number
  uptimeSeconds?: number
  queuesWithWaiting?: number
  queuesWithActive?: number
  queuesWithCompleted?: number
  queuesWithFailed?: number
  replicationLag?: number
}

export interface SystemHealthState {
  status: 'ok' | 'error' | 'degraded' | 'healthy'
  timestamp: string
  uptime?: number
  version?: string
  // New format with services object
  services?: {
    database: ServiceHealthStatus
    cache: ServiceHealthStatus
    search: ServiceHealthStatus
    storage: ServiceHealthStatus
    jobs: ServiceHealthStatus
  }
  // Admin endpoint format with checks object
  checks?: {
    database: SystemHealthCheck
    cache: SystemHealthCheck
    queue: SystemHealthCheck
    search: SystemHealthCheck
    storage: SystemHealthCheck
  }
  // Connection details from admin endpoint
  connections?: {
    redis: { host: string; port: number; db: number }
    queue: { host: string; port: number; db: number; password?: string }
    search: { host: string }
    storage: { endpoint: string; port: number; bucket: string; useSSL: boolean }
  }
  // Resources from admin endpoint
  resources?: SystemHealthResources
}

export interface AdminDashboardOverview {
  totalUsers: number
  totalVendors: number
  totalLeads: number
  totalEvents: number
  userGrowth: number
  vendorGrowth: number
  eventGrowth: number
  leadGrowth: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  avgConversionRate: number
  avgResponseTime: number
  platformHealth: number
  totalRevenue: number
  revenueGrowth: number
}

export interface AdminDashboard {
  overview: AdminDashboardOverview
  growth: {
    period: string
    users: { current: number; previous: number; growth: number }
    vendors: { current: number; previous: number; growth: number }
    leads: { current: number; previous: number; growth: number }
    events: { current: number; previous: number; growth: number }
    revenue: { current: number; previous: number; growth: number }
  }
  userMetrics: {
    dau: number
    wau: number
    mau: number
    dauWauRatio: number
    dauMauRatio: number
  }
  vendorMetrics: {
    totalActive: number
    avgPerformanceScore: number
    topPerformers: Array<{
      vendorProfileId: string
      vendorName: string
      businessName?: string
      categoryName?: string
      cityName?: string
      totalProfileViews: number
      totalSearchAppearances: number
      totalSearchClicks: number
      avgClickThroughRate: number
      totalLeadsReceived: number
      totalLeadsResponded: number
      avgResponseRate: number
      avgResponseTime: number
      totalLeadsConverted: number
      avgConversionRate: number
      totalWishlistAdds: number
      totalPortfolioViews: number
      totalRevenue: number
      performanceScore: number
      ranking?: number
    }>
  }
  engagementTrends: Array<{
    date: string
    activeUsers: number
    totalSessions: number
    avgSessionDuration: number
    totalSearches: number
    totalLeads: number
  }>
  distributions: {
    userStatus: Array<{ type: string; count: number; percentage: number }>
    vendorVerification: Array<{ status: string; count: number; percentage: number }>
    leadStatus: Array<{ status: string; count: number; percentage: number }>
    eventStatus: Array<{ status: string; count: number; percentage: number }>
  }
  searchAnalytics: {
    totalSearches: number
    uniqueSearchers: number
    avgSearchesPerUser: number
    topSearchTerms: Array<{ term: string; count: number }>
    zeroResultRate: number
  }
  timestamp: string
}

// ─── Vendor, category and location management ────────────────────────────────

export type AdminVendorStatus = 'ACTIVE' | 'UNCLAIMED' | 'SUSPENDED' | 'ARCHIVED' | 'DRAFT' | 'PENDING_REVIEW'

export interface AdminVendor {
  id: string
  businessName: string
  slug: string
  status: AdminVendorStatus
  planTier: string
  verifiedAt: string | null
  contactEmail: string | null
  contactPhone: string | null
  leadCount: number
  viewCount: number
  totalReviews: number
  createdAt: string
  updatedAt: string
  category: { id: string; name: string; slug: string } | null
  user: { id: string; email: string } | null
  cityId: string | null
  cityName: string | null
  claimed: boolean
}

export interface AdminVendorListParams {
  query?: string
  status?: string
  categoryId?: string
  cityId?: string
  page?: number
  limit?: number
}

export interface AdminVendorStats {
  total: number
  byStatus: Record<string, number>
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
  parentId: string | null
  parent?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  _count?: { vendors: number; children: number; serviceTypes: number }
}

export interface AdminCategoryInput {
  name: string
  slug?: string
  description?: string | null
  icon?: string | null
  sortOrder?: number
  isActive?: boolean
  parentId?: string | null
}

export interface AdminCountry {
  id: string
  name: string
  code: string
  code2: string
  dialCode: string | null
  currency: string | null
  isActive: boolean
  _count?: { states: number }
}

export interface AdminCountryInput {
  name: string
  code: string
  code2: string
  dialCode?: string | null
  currency?: string | null
  isActive?: boolean
}

export interface AdminState {
  id: string
  name: string
  code: string | null
  countryId: string
  isActive: boolean
  country?: { id: string; name: string }
  _count?: { cities: number }
}

export interface AdminStateInput {
  name: string
  code?: string | null
  countryId: string
  isActive?: boolean
}

export interface AdminCity {
  id: string
  name: string
  stateId: string
  isActive: boolean
  state?: { id: string; name: string; country?: { id: string; name: string } }
  _count?: { addresses: number }
}

export interface AdminCityInput {
  name: string
  stateId: string
  isActive?: boolean
}

export interface AdminCityListParams {
  query?: string
  stateId?: string
  countryId?: string
  page?: number
  limit?: number
}
