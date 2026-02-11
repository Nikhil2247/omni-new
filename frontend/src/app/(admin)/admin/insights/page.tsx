'use client'

import * as React from 'react'
import { useAdminDashboard } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  BarChart3,
  Calendar,
  DollarSign,
  Search,
  Store,
  TrendingUp,
  Users,
  Zap,
  Target,
  Eye,
} from 'lucide-react'
import {
  AreaLineChart,
  BarChart,
  DonutChart,
  MetricCard,
  DateRangeSelector,
  type DateRangeValue,
} from '@/components/charts'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export default function AdminInsightsPage() {
  const { data, isLoading } = useAdminDashboard()
  const [dateRange, setDateRange] = React.useState<DateRangeValue>({
    startDate: startOfDay(subDays(new Date(), 29)),
    endDate: endOfDay(new Date()),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-sm text-destructive">Unable to load platform insights.</div>
  }

  const overview = data.overview
  const distributions = data.distributions ?? {
    userStatus: [],
    vendorVerification: [],
    leadStatus: [],
    eventStatus: [],
  }
  const engagementTrends = data.engagementTrends ?? []
  const searchAnalytics = data.searchAnalytics ?? {
    totalSearches: 0,
    uniqueSearchers: 0,
    avgSearchesPerUser: 0,
    topSearchTerms: [],
    zeroResultRate: 0,
  }
  const topVendors = data.vendorMetrics?.topPerformers?.slice(0, 6) ?? []

  // Prepare engagement chart data
  const engagementChartData = engagementTrends.map((trend) => ({
    date: new Date(trend.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    'Active Users': trend.activeUsers,
    Sessions: trend.totalSessions,
    Searches: trend.totalSearches,
    Leads: trend.totalLeads,
  }))

  // Prepare distribution donut data
  const userStatusData = distributions.userStatus.map((item) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
  }))

  const vendorVerificationData = distributions.vendorVerification.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  }))

  const leadStatusData = distributions.leadStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  }))

  const eventStatusData = distributions.eventStatus.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  }))

  // Prepare vendor performance bar chart data - use performanceScore or fallback to leads
  const vendorBarData = topVendors.map((vendor, index) => ({
    name: vendor.vendorName || vendor.businessName || `Vendor ${index + 1}`,
    value: vendor.performanceScore || vendor.totalLeadsReceived || vendor.totalProfileViews || 0,
  }))

  // Calculate totals for donut centers
  const totalUsers = userStatusData.reduce((sum, item) => sum + item.value, 0)
  const totalVendors = vendorVerificationData.reduce((sum, item) => sum + item.value, 0)
  const totalLeads = leadStatusData.reduce((sum, item) => sum + item.value, 0)
  const totalEvents = eventStatusData.reduce((sum, item) => sum + item.value, 0)

  // Calculate trend for sparklines (last 7 days)
  const last7Days = engagementTrends.slice(-7)
  const userTrend = last7Days.map((t) => t.activeUsers)
  const sessionTrend = last7Days.map((t) => t.totalSessions)
  const searchTrend = last7Days.map((t) => t.totalSearches)
  const leadTrend = last7Days.map((t) => t.totalLeads)

  // Calculate change percentages
  const calcChange = (trend: number[]) => {
    if (trend.length < 2) return 0
    const first = trend[0] || 1
    const last = trend[trend.length - 1] || 0
    return ((last - first) / first) * 100
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -mb-32 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Platform Insights</h1>
              <p className="text-muted-foreground">
                Comprehensive analytics and performance metrics
              </p>
            </div>
          </div>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Executive Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Users"
          value={overview.totalUsers}
          change={calcChange(userTrend)}
          trend={userTrend}
          icon={Users}
          variant="gradient"
          valueFormatter={(v) => Number(v).toLocaleString()}
        />
        <MetricCard
          title="Active Vendors"
          value={overview.totalVendors}
          change={calcChange(sessionTrend)}
          trend={sessionTrend}
          icon={Store}
          valueFormatter={(v) => Number(v).toLocaleString()}
        />
        <MetricCard
          title="Total Leads"
          value={overview.totalLeads}
          change={calcChange(leadTrend)}
          trend={leadTrend}
          icon={Target}
          valueFormatter={(v) => Number(v).toLocaleString()}
        />
        <MetricCard
          title="Total Revenue"
          value={overview.totalRevenue ?? 0}
          change={overview.revenueGrowth ?? 0}
          icon={DollarSign}
          valueFormatter={(v) => `$${Number(v).toLocaleString()}`}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${Math.round(overview.avgConversionRate * 100)}%`}
          change={overview.avgConversionRate > 0.1 ? 5.2 : -2.1}
          icon={TrendingUp}
        />
      </div>

      {/* Engagement Trends Chart - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Engagement Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily active users, sessions, searches, and leads over time
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              {engagementTrends.length} days of data
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {engagementChartData.length > 0 ? (
            <AreaLineChart
              data={engagementChartData}
              dataKeys={[
                { key: 'Active Users', color: 'hsl(var(--primary))', label: 'Active Users' },
                { key: 'Sessions', color: 'hsl(var(--chart-2))', label: 'Sessions' },
                { key: 'Searches', color: 'hsl(var(--chart-3))', label: 'Searches' },
                { key: 'Leads', color: 'hsl(var(--chart-4))', label: 'Leads' },
              ]}
              xAxisKey="date"
              height={350}
              showLegend
              gradientFill
            />
          ) : (
            <div className="flex h-80 items-center justify-center text-muted-foreground">
              No engagement data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <EngagementStat
          label="Daily Active Users"
          value={data.userMetrics.dau}
          icon={Users}
        />
        <EngagementStat
          label="Weekly Active Users"
          value={data.userMetrics.wau}
          icon={Activity}
        />
        <EngagementStat
          label="Monthly Active Users"
          value={data.userMetrics.mau}
          icon={Calendar}
        />
        <EngagementStat
          label="DAU/WAU Ratio"
          value={`${(data.userMetrics.dauWauRatio * 100).toFixed(1)}%`}
          icon={Zap}
        />
        <EngagementStat
          label="DAU/MAU Ratio"
          value={`${(data.userMetrics.dauMauRatio * 100).toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Distribution Donut Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DonutChart
          data={userStatusData}
          title="User Status"
          centerValue={totalUsers}
          centerLabel="users"
          height={180}
        />
        <DonutChart
          data={vendorVerificationData}
          title="Vendor Verification"
          centerValue={totalVendors}
          centerLabel="vendors"
          height={180}
        />
        <DonutChart
          data={leadStatusData}
          title="Lead Status"
          centerValue={totalLeads}
          centerLabel="leads"
          height={180}
        />
        <DonutChart
          data={eventStatusData}
          title="Event Status"
          centerValue={totalEvents}
          centerLabel="events"
          height={180}
        />
      </div>

      {/* Search Analytics & Vendor Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search Analytics Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Analytics
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Platform search behavior and patterns
                </p>
              </div>
              <Badge
                variant={searchAnalytics.zeroResultRate > 0.2 ? 'destructive' : 'secondary'}
              >
                {Math.round(searchAnalytics.zeroResultRate * 100)}% zero results
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{searchAnalytics.totalSearches.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Searches</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{searchAnalytics.uniqueSearchers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Unique Searchers</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{searchAnalytics.avgSearchesPerUser.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg/User</p>
              </div>
            </div>

            {/* Top Search Terms */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Top Search Terms</h4>
              {searchAnalytics.topSearchTerms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No search data available.</p>
              ) : (
                <div className="space-y-2">
                  {searchAnalytics.topSearchTerms.slice(0, 6).map((term, index) => (
                    <div
                      key={term.term}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{term.term}</span>
                      </div>
                      <Badge variant="secondary">{term.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Top Vendor Performance
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Highest performing vendors by score
                </p>
              </div>
              <Badge variant="outline">
                Avg: {data.vendorMetrics.avgPerformanceScore.toFixed(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {vendorBarData.length > 0 ? (
              <BarChart
                data={vendorBarData}
                layout="horizontal"
                height={280}
                barColor="hsl(var(--primary))"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No vendor performance data available
              </div>
            )}

            {/* Vendor Stats Summary */}
            {topVendors.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {topVendors.reduce((sum, v) => sum + v.totalProfileViews, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {topVendors.reduce((sum, v) => sum + v.totalLeadsReceived, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {(
                      (topVendors.reduce((sum, v) => sum + v.avgConversionRate, 0) /
                        topVendors.length) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Conversion</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Health & Response Times */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Platform Health</CardTitle>
              <Badge variant={healthVariant(overview.platformHealth)}>
                {normalizeHealthPercent(overview.platformHealth)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <HealthRing value={normalizeHealthPercent(overview.platformHealth)} />
              <div className="mt-4 grid w-full grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold">{Math.round(overview.avgResponseTime)}</p>
                  <p className="text-xs text-muted-foreground">Avg Response (min)</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold">{data.vendorMetrics.avgPerformanceScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Vendor Score</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detailed Vendor Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {topVendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor data available.</p>
            ) : (
              <div className="space-y-3">
                {topVendors.map((vendor, index) => (
                  <div
                    key={vendor.vendorProfileId}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{vendor.vendorName || vendor.businessName || `Vendor ${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.categoryName && <span>{vendor.categoryName} • </span>}
                          {vendor.totalProfileViews} views • {vendor.totalLeadsReceived} leads
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          Score: {vendor.performanceScore.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(vendor.avgConversionRate)} conversion
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EngagementStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function HealthRing({ value }: { value: number }) {
  const radius = 60
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (val: number) => {
    if (val >= 90) return 'hsl(142 76% 36%)'
    if (val >= 75) return 'hsl(47 96% 53%)'
    return 'hsl(351 84% 48%)'
  }

  return (
    <div className="relative">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor(value)}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-500"
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
        <span className="text-xs text-muted-foreground">Health</span>
      </div>
    </div>
  )
}

function normalizeHealthPercent(value: number) {
  const normalized = value <= 1 ? value * 100 : value
  return Math.round(normalized)
}

function healthVariant(value: number) {
  const normalized = normalizeHealthPercent(value)
  if (normalized >= 90) return 'default' as const
  if (normalized >= 75) return 'secondary' as const
  return 'destructive' as const
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
