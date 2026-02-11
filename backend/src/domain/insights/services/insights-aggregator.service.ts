// ============================================================================
// INSIGHTS AGGREGATOR SERVICE - Combined Analytics Dashboard
// ============================================================================
// Provides unified access to all platform insights for admin dashboards
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { UserEngagementService, UserEngagementSummary, EngagementTrend } from './user-engagement.service'
import { VendorMetricsService, VendorPerformanceSummary } from './vendor-metrics.service'
import { PlatformMetricsService, PlatformOverview, GrowthMetrics } from './platform-metrics.service'
import { DragonflyService } from 'src/infrastructure'


export interface AdminDashboard {
  overview: PlatformOverview
  growth: GrowthMetrics
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
    topPerformers: VendorPerformanceSummary[]
  }
  engagementTrends: EngagementTrend[]
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
  timestamp: Date
}

export interface ExecutiveSummary {
  period: string
  highlights: {
    totalUsers: number
    userGrowth: number
    totalVendors: number
    vendorGrowth: number
    totalLeads: number
    leadConversionRate: number
    platformHealth: number
  }
  keyMetrics: {
    name: string
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }[]
  alerts: {
    type: 'warning' | 'info' | 'success'
    message: string
  }[]
}

export interface RealTimeStats {
  activeUsers: number
  activeVendors: number
  ongoingEvents: number
  pendingLeads: number
  searchesLastHour: number
  leadsLastHour: number
  timestamp: Date
}

@Injectable()
export class InsightsAggregatorService {
  private readonly logger = new Logger(InsightsAggregatorService.name)
  private readonly CACHE_PREFIX = 'insights:'
  private readonly CACHE_TTL = 60 // 1 minute for aggregated data

  constructor(
    private readonly userEngagement: UserEngagementService,
    private readonly vendorMetrics: VendorMetricsService,
    private readonly platformMetrics: PlatformMetricsService,
    private readonly cache: DragonflyService,
  ) {}

  // ============================================================================
  // DASHBOARD METHODS
  // ============================================================================

  /**
   * Get complete admin dashboard data
   */
  async getAdminDashboard(): Promise<AdminDashboard> {
    const cacheKey = `${this.CACHE_PREFIX}admin-dashboard`
    const cached = await this.cache.get<AdminDashboard>(cacheKey)

    if (cached) {
      return cached
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      overview,
      growth,
      dau,
      wau,
      mau,
      topVendors,
      engagementTrends,
      userDistribution,
      vendorDistribution,
      leadDistribution,
      eventDistribution,
      searchAnalytics,
    ] = await Promise.all([
      this.platformMetrics.getPlatformOverview(),
      this.platformMetrics.getGrowthMetrics('month'),
      this.userEngagement.getDailyActiveUsers(),
      this.userEngagement.getWeeklyActiveUsers(),
      this.userEngagement.getMonthlyActiveUsers(),
      this.vendorMetrics.getTopVendors(10, 30),
      this.userEngagement.getEngagementTrends(thirtyDaysAgo, new Date()),
      this.platformMetrics.getUserTypeDistribution(),
      this.platformMetrics.getVendorVerificationDistribution(),
      this.platformMetrics.getLeadStatusDistribution(),
      this.platformMetrics.getEventStatusDistribution(),
      this.platformMetrics.getSearchAnalytics(30),
    ])

    const dashboard: AdminDashboard = {
      overview,
      growth,
      userMetrics: {
        dau,
        wau,
        mau,
        dauWauRatio: wau > 0 ? Math.round((dau / wau) * 100) : 0,
        dauMauRatio: mau > 0 ? Math.round((dau / mau) * 100) : 0,
      },
      vendorMetrics: {
        totalActive: overview.totalVendors,
        avgPerformanceScore: this.calculateAvgPerformanceScore(topVendors),
        topPerformers: topVendors,
      },
      engagementTrends,
      distributions: {
        userStatus: userDistribution,
        vendorVerification: vendorDistribution,
        leadStatus: leadDistribution,
        eventStatus: eventDistribution,
      },
      searchAnalytics,
      timestamp: new Date(),
    }

    await this.cache.set(cacheKey, dashboard, { ttl: this.CACHE_TTL })

    return dashboard
  }

  /**
   * Get executive summary for reports
   */
  async getExecutiveSummary(period: 'day' | 'week' | 'month' = 'month'): Promise<ExecutiveSummary> {
    const cacheKey = `${this.CACHE_PREFIX}executive-summary:${period}`
    const cached = await this.cache.get<ExecutiveSummary>(cacheKey)

    if (cached) {
      return cached
    }

    const [overview, growth] = await Promise.all([
      this.platformMetrics.getPlatformOverview(),
      this.platformMetrics.getGrowthMetrics(period),
    ])

    const alerts = this.generateAlerts(overview, growth)

    const summary: ExecutiveSummary = {
      period,
      highlights: {
        totalUsers: overview.totalUsers,
        userGrowth: overview.userGrowth,
        totalVendors: overview.totalVendors,
        vendorGrowth: overview.vendorGrowth,
        totalLeads: overview.totalLeads,
        leadConversionRate: overview.avgConversionRate,
        platformHealth: overview.platformHealth,
      },
      keyMetrics: [
        {
          name: 'Daily Active Users',
          value: overview.dailyActiveUsers,
          change: growth.users.growth,
          trend: this.getTrend(growth.users.growth),
        },
        {
          name: 'Monthly Active Users',
          value: overview.monthlyActiveUsers,
          change: growth.users.growth,
          trend: this.getTrend(growth.users.growth),
        },
        {
          name: 'New Vendors',
          value: growth.vendors.current,
          change: growth.vendors.growth,
          trend: this.getTrend(growth.vendors.growth),
        },
        {
          name: 'Lead Conversion',
          value: Math.round(overview.avgConversionRate * 100),
          change: 0, // Would need historical comparison
          trend: 'stable',
        },
        {
          name: 'Avg Response Time (min)',
          value: overview.avgResponseTime,
          change: 0,
          trend: overview.avgResponseTime < 60 ? 'up' : 'down',
        },
      ],
      alerts,
    }

    await this.cache.set(cacheKey, summary, { ttl: this.CACHE_TTL })

    return summary
  }

  /**
   * Get real-time statistics
   */
  async getRealTimeStats(): Promise<RealTimeStats> {
    // Real-time stats should not be cached or cached very briefly
    const [
      dau,
      activeVendors,
      ongoingEvents,
      pendingLeads,
      searchesLastHour,
      leadsLastHour,
    ] = await Promise.all([
      this.userEngagement.getDailyActiveUsers(),
      this.vendorMetrics.getTopVendors(1000, 1), // Active vendors today
      this.platformMetrics.getOngoingEventsCount(),
      this.platformMetrics.getPendingLeadsCount(),
      this.platformMetrics.getSearchesLastHour(),
      this.platformMetrics.getLeadsLastHour(),
    ])

    return {
      activeUsers: dau,
      activeVendors: activeVendors.length,
      ongoingEvents,
      pendingLeads,
      searchesLastHour,
      leadsLastHour,
      timestamp: new Date(),
    }
  }

  // ============================================================================
  // USER INSIGHTS
  // ============================================================================

  /**
   * Get detailed user insights
   */
  async getUserInsights(userId: string): Promise<{
    summary: UserEngagementSummary | null
    recentActivity: any[]
    recommendations: string[]
  }> {
    const summary = await this.userEngagement.getUserSummary(userId)

    const recommendations: string[] = []

    if (summary) {
      if (summary.totalLeadsSent === 0) {
        recommendations.push('Consider sending leads to vendors to get quotes')
      }
      if (summary.totalSearches < 5) {
        recommendations.push('Explore more vendors using search')
      }
      if (summary.engagementScore < 50) {
        recommendations.push('Complete your event checklist to stay on track')
      }
    }

    return {
      summary,
      recentActivity: [], // Would need activity log integration
      recommendations,
    }
  }

  // ============================================================================
  // VENDOR INSIGHTS
  // ============================================================================

  /**
   * Get detailed vendor insights
   */
  async getVendorInsights(vendorProfileId: string): Promise<{
    summary: VendorPerformanceSummary | null
    benchmarkComparison: {
      metric: string
      vendorValue: number
      industryAvg: number
      percentile: number
    }[]
    recommendations: string[]
  }> {
    const [summary, benchmarks] = await Promise.all([
      this.vendorMetrics.getVendorSummary(vendorProfileId),
      this.vendorMetrics.getIndustryBenchmarks(30),
    ])

    const benchmarkComparison: any[] = []
    const recommendations: string[] = []

    if (summary) {
      benchmarkComparison.push(
        {
          metric: 'Profile Views',
          vendorValue: summary.totalProfileViews,
          industryAvg: benchmarks.avgProfileViews,
          percentile: this.calculatePercentile(
            summary.totalProfileViews,
            benchmarks.avgProfileViews,
          ),
        },
        {
          metric: 'Leads Received',
          vendorValue: summary.totalLeadsReceived,
          industryAvg: benchmarks.avgLeadsReceived,
          percentile: this.calculatePercentile(
            summary.totalLeadsReceived,
            benchmarks.avgLeadsReceived,
          ),
        },
        {
          metric: 'Conversion Rate',
          vendorValue: summary.avgConversionRate,
          industryAvg: benchmarks.avgConversionRate,
          percentile: this.calculatePercentile(
            summary.avgConversionRate,
            benchmarks.avgConversionRate,
          ),
        },
      )

      // Generate recommendations
      if (summary.avgResponseRate < 0.8) {
        recommendations.push('Improve response rate by replying to leads within 24 hours')
      }
      if (summary.avgResponseTime > benchmarks.avgResponseTime) {
        recommendations.push('Reduce response time to stay competitive')
      }
      if (summary.totalProfileViews < benchmarks.avgProfileViews) {
        recommendations.push('Optimize your profile with better photos and descriptions')
      }
      if (summary.avgConversionRate < benchmarks.avgConversionRate) {
        recommendations.push('Review your pricing and portfolio to improve conversions')
      }
    }

    return {
      summary,
      benchmarkComparison,
      recommendations,
    }
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  /**
   * Export metrics data for reporting
   */
  async exportMetrics(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json',
  ): Promise<any> {
    const [dailyMetrics, engagementTrends] = await Promise.all([
      this.platformMetrics.getDailyMetrics(startDate, endDate),
      this.userEngagement.getEngagementTrends(startDate, endDate),
    ])

    const data = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      platformMetrics: dailyMetrics,
      engagementTrends,
      exportedAt: new Date().toISOString(),
    }

    if (format === 'csv') {
      return this.convertToCSV(dailyMetrics)
    }

    return data
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private calculateAvgPerformanceScore(vendors: VendorPerformanceSummary[]): number {
    if (vendors.length === 0) return 0

    const total = vendors.reduce((sum, v) => sum + v.performanceScore, 0)
    return Math.round(total / vendors.length)
  }

  private getTrend(change: number): 'up' | 'down' | 'stable' {
    if (change > 5) return 'up'
    if (change < -5) return 'down'
    return 'stable'
  }

  private generateAlerts(
    overview: PlatformOverview,
    growth: GrowthMetrics,
  ): Array<{ type: 'warning' | 'info' | 'success'; message: string }> {
    const alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string }> = []

    // Success alerts
    if (growth.users.growth > 20) {
      alerts.push({
        type: 'success',
        message: `User growth is up ${growth.users.growth}% this period!`,
      })
    }

    if (growth.vendors.growth > 15) {
      alerts.push({
        type: 'success',
        message: `Vendor signups increased by ${growth.vendors.growth}%`,
      })
    }

    // Warning alerts
    if (overview.platformHealth < 50) {
      alerts.push({
        type: 'warning',
        message: 'Platform health score is below target. Review vendor response times.',
      })
    }

    if (growth.leads.growth < -10) {
      alerts.push({
        type: 'warning',
        message: `Lead volume decreased by ${Math.abs(growth.leads.growth)}%`,
      })
    }

    // Info alerts
    if (overview.dailyActiveUsers > 1000) {
      alerts.push({
        type: 'info',
        message: `${overview.dailyActiveUsers} users active today`,
      })
    }

    return alerts
  }

  private calculatePercentile(value: number, average: number): number {
    if (average === 0) return 50
    const ratio = value / average
    // Simple percentile calculation
    return Math.min(Math.round(ratio * 50), 100)
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(','),
    )

    return [headers.join(','), ...rows].join('\n')
  }
}
