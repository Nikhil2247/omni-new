'use client'

import { useState, useMemo } from 'react'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { useAdminDashboard } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  Gauge,
  Store,
  TrendingUp,
  Users,
  Activity,
  Zap,
  Target,
  Clock,
  DollarSign,
} from 'lucide-react'
import {
  AreaLineChart,
  BarChart,
  MetricCard,
  DateRangeSelector,
  DateRangeValue,
} from '@/components/charts'

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: startOfDay(subDays(new Date(), 29)),
    endDate: endOfDay(new Date()),
  })

  const { data, isLoading, error } = useAdminDashboard()

  // Process engagement trends for chart
  const trendChartData = useMemo(() => {
    if (!data?.engagementTrends) return []
    return data.engagementTrends.map((t) => ({
      date: t.date,
      activeUsers: t.activeUsers,
      sessions: t.totalSessions,
      searches: t.totalSearches,
      leads: t.totalLeads,
    }))
  }, [data?.engagementTrends])

  // Process top vendors for bar chart - use performanceScore or fallback to leads/views
  const vendorChartData = useMemo(() => {
    if (!data?.vendorMetrics?.topPerformers) return []
    return data.vendorMetrics.topPerformers.slice(0, 6).map((v, i) => ({
      name: v.vendorName || v.businessName || `Vendor ${i + 1}`,
      value: v.performanceScore || v.totalLeadsReceived || v.totalProfileViews || 0,
      fill: i === 0 ? 'hsl(var(--primary))' : undefined,
    }))
  }, [data?.vendorMetrics?.topPerformers])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Activity className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm text-destructive">Unable to load admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const overview = data.overview ?? {
    totalUsers: 0,
    totalVendors: 0,
    totalEvents: 0,
    totalLeads: 0,
    userGrowth: 0,
    vendorGrowth: 0,
    eventGrowth: 0,
    leadGrowth: 0,
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    avgConversionRate: 0,
    avgResponseTime: 0,
    platformHealth: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
  }
  const userMetrics = data.userMetrics ?? { dau: 0, wau: 0, mau: 0, dauWauRatio: 0, dauMauRatio: 0 }
  const topVendors = data.vendorMetrics?.topPerformers?.slice(0, 5) ?? []
  const healthPercent = normalizeHealthPercent(overview.platformHealth)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform overview and key performance signals</p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Users"
          value={overview.totalUsers}
          change={overview.userGrowth}
          icon={Users}
          variant="gradient"
        />
        <MetricCard
          title="Active Vendors"
          value={overview.totalVendors}
          change={overview.vendorGrowth}
          icon={Store}
        />
        <MetricCard
          title="Active Events"
          value={overview.totalEvents}
          change={overview.eventGrowth}
          icon={Calendar}
        />
        <MetricCard
          title="Total Revenue"
          value={overview.totalRevenue}
          change={overview.revenueGrowth}
          icon={DollarSign}
          valueFormatter={(v) => `$${Number(v).toLocaleString()}`}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${Math.round(overview.avgConversionRate * 100)}%`}
          icon={Target}
        />
      </div>

      {/* Engagement Trends & Platform Health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {trendChartData.length > 0 ? (
            <AreaLineChart
              title="Engagement Trends"
              description="Daily active users and sessions over time"
              data={trendChartData}
              dataKeys={[
                { key: 'activeUsers', label: 'Active Users', color: 'hsl(var(--primary))' },
                { key: 'sessions', label: 'Sessions', color: 'hsl(var(--chart-2))' },
              ]}
              height={320}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center">
                <p className="text-sm text-muted-foreground">No trend data available yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Platform Health</CardTitle>
            <Badge variant={healthVariant(overview.platformHealth)}>
              {healthPercent}%
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Health Ring */}
            <div className="flex justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90 transform">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#healthGradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${(healthPercent / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(280 70% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="mt-1 text-2xl font-bold">{healthPercent}%</span>
                </div>
              </div>
            </div>

            {/* Health Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Avg Response Time
                </span>
                <span className="font-medium">{Math.round(overview.avgResponseTime)} min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">DAU / WAU Ratio</span>
                <span className="font-medium">{formatPercent(userMetrics.dauWauRatio)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">DAU / MAU Ratio</span>
                <span className="font-medium">{formatPercent(userMetrics.dauMauRatio)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GrowthCard label="Users" value={overview.totalUsers} change={overview.userGrowth} icon={Users} />
        <GrowthCard label="Vendors" value={overview.totalVendors} change={overview.vendorGrowth} icon={Store} />
        <GrowthCard label="Events" value={overview.totalEvents} change={overview.eventGrowth} icon={Calendar} />
        <GrowthCard label="Leads" value={overview.totalLeads} change={overview.leadGrowth} icon={TrendingUp} />
      </div>

      {/* Vendors & Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Vendors Chart */}
        {vendorChartData.length > 0 ? (
          <BarChart
            title="Top Vendors Performance"
            description="Performance scores of top vendors"
            data={vendorChartData}
            layout="vertical"
            height={280}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Top Vendors Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">No vendor performance data yet.</p>
            </CardContent>
          </Card>
        )}

        {/* Active Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">User Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EngagementRow
              label="Daily Active Users"
              value={userMetrics.dau}
              max={userMetrics.mau || 100}
              color="bg-violet-500"
            />
            <EngagementRow
              label="Weekly Active Users"
              value={userMetrics.wau}
              max={userMetrics.mau || 100}
              color="bg-purple-500"
            />
            <EngagementRow
              label="Monthly Active Users"
              value={userMetrics.mau}
              max={userMetrics.mau || 100}
              color="bg-indigo-500"
            />

            <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {userMetrics.dau}
                </p>
                <p className="text-xs text-muted-foreground">DAU</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {userMetrics.wau}
                </p>
                <p className="text-xs text-muted-foreground">WAU</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {userMetrics.mau}
                </p>
                <p className="text-xs text-muted-foreground">MAU</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Top Performing Vendors (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {topVendors.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No vendor performance data yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topVendors.map((vendor, index) => (
                <div
                  key={vendor.vendorProfileId}
                  className="flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                          : index === 2
                          ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{vendor.vendorName || vendor.businessName || `Vendor ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {vendor.categoryName && <span>{vendor.categoryName} • </span>}
                        {vendor.totalLeadsConverted} conversions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{vendor.performanceScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(vendor.avgConversionRate)} conv
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function GrowthCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string
  value: number
  change: number
  icon: React.ElementType
}) {
  const isPositive = change >= 0
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span
            className={`text-xs font-medium ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EngagementRow({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const percent = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
        />
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
