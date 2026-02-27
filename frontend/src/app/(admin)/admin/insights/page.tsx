'use client'

import * as React from 'react'
import {
  usePlatformCounts,
  useFunnelConversionRates,
  useRefreshPlatformCounts,
  formatCount,
} from '@/hooks/queries/use-platform-counts'
import { useAdminDashboard } from '@/hooks/queries/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  Store,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  MessageSquare,
  Search,
  FileText,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import {
  AreaLineChart,
  BarChart,
  DonutChart,
  MetricCard,
  DateRangeSelector,
  type DateRangeValue,
} from '@/components/charts'
import { FunnelDashboard } from '@/components/analytics/FunnelDashboard'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

export default function AdminInsightsPage() {
  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } = usePlatformCounts()
  const { data: funnelRates, refetch: refetchFunnelRates } = useFunnelConversionRates()
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useAdminDashboard()
  const { mutateAsync: refreshCountsOnServer } = useRefreshPlatformCounts()
  const [dateRange, setDateRange] = React.useState<DateRangeValue>({
    startDate: startOfDay(subDays(new Date(), 29)),
    endDate: endOfDay(new Date()),
  })

  const isLoading = countsLoading || dashboardLoading
  const [refreshing, setRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshCountsOnServer()
      await Promise.all([refetchCounts(), refetchFunnelRates(), refetchDashboard()])
    } finally {
      setRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!counts) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Unable to load platform insights</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time analytics, metrics, and performance insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Last Updated Badge */}
      {counts.lastUpdated && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Clock className="h-3 w-3" />
            Last updated: {new Date(counts.lastUpdated).toLocaleString()}
          </Badge>
          {counts.updateDuration !== undefined && (
            <Badge variant="secondary" className="gap-2">
              <Sparkles className="h-3 w-3" />
              Updated in {counts.updateDuration}ms
            </Badge>
          )}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Store className="mr-2 h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="leads">
            <Target className="mr-2 h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="mr-2 h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="funnels">
            <PieChart className="mr-2 h-4 w-4" />
            Funnels
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <ExecutiveMetrics counts={counts} />
          <EngagementMetrics counts={counts} />
          {dashboard && <PlatformHealthMetrics dashboard={dashboard} />}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <UserMetrics counts={counts} />
          {dashboard && <UserEngagementDetails dashboard={dashboard} />}
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          <VendorMetrics counts={counts} />
          {dashboard && <VendorPerformanceDetails dashboard={dashboard} />}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          <LeadMetrics counts={counts} />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <ContentMetrics counts={counts} />
        </TabsContent>

        {/* Funnels Tab */}
        <TabsContent value="funnels" className="space-y-6">
          <FunnelMetrics counts={counts} funnelRates={funnelRates} />
          <FunnelDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =============================================================================
// COMPONENT SECTIONS
// =============================================================================

function ExecutiveMetrics({ counts }: { counts: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={formatCount(counts.totalUsers)}
        subtitle={`${counts.activeUsers} active`}
        icon={Users}
        trend={+12.5}
        color="blue"
      />
      <StatCard
        title="Total Vendors"
        value={formatCount(counts.totalVendors)}
        subtitle={`${counts.verifiedVendors} verified`}
        icon={Store}
        trend={+8.3}
        color="purple"
      />
      <StatCard
        title="Total Leads"
        value={formatCount(counts.totalLeads)}
        subtitle={`${counts.newLeads} new`}
        icon={Target}
        trend={+15.7}
        color="green"
      />
      <StatCard
        title="Total Events"
        value={formatCount(counts.totalEvents)}
        subtitle={`${counts.upcomingEvents} upcoming`}
        icon={Calendar}
        trend={+5.2}
        color="orange"
      />
    </div>
  )
}

function EngagementMetrics({ counts }: { counts: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Engagement Overview
        </CardTitle>
        <CardDescription>
          Platform activity and user interaction metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricBox
            label="Total Searches"
            value={formatCount(counts.totalSearches)}
            icon={Search}
            color="blue"
          />
          <MetricBox
            label="Profile Views"
            value={formatCount(counts.totalProfileViews)}
            icon={Eye}
            color="purple"
          />
          <MetricBox
            label="Messages"
            value={formatCount(counts.totalMessages)}
            icon={MessageSquare}
            color="green"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function UserMetrics({ counts }: { counts: any }) {
  const userStatusData = [
    { name: 'Active', value: counts.activeUsers || 0, color: 'hsl(var(--chart-1))' },
    { name: 'Pending', value: counts.pendingUsers || 0, color: 'hsl(var(--chart-2))' },
    { name: 'Verified', value: counts.verifiedUsers || 0, color: 'hsl(var(--chart-3))' },
  ]

  const activePercentage = counts.totalUsers > 0 ? (counts.activeUsers / counts.totalUsers) * 100 : 0
  const verifiedPercentage = counts.totalUsers > 0 ? (counts.verifiedUsers / counts.totalUsers) * 100 : 0

  return (
    <div className="space-y-6">
      {/* User Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={formatCount(counts.totalUsers)}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={formatCount(counts.activeUsers)}
          subtitle={`${activePercentage.toFixed(1)}% of total`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Pending Users"
          value={formatCount(counts.pendingUsers)}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Verified Users"
          value={formatCount(counts.verifiedUsers)}
          subtitle={`${verifiedPercentage.toFixed(1)}% of total`}
          icon={Star}
          color="purple"
        />
      </div>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Status Distribution</CardTitle>
          <CardDescription>Breakdown of users by verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UserProgressBar
              label="Active Users"
              value={counts.activeUsers}
              total={counts.totalUsers}
              color="bg-green-500"
            />
            <UserProgressBar
              label="Verified Users"
              value={counts.verifiedUsers}
              total={counts.totalUsers}
              color="bg-blue-500"
            />
            <UserProgressBar
              label="Pending Users"
              value={counts.pendingUsers}
              total={counts.totalUsers}
              color="bg-yellow-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VendorMetrics({ counts }: { counts: any }) {
  const activePercentage = counts.totalVendors > 0 ? (counts.activeVendors / counts.totalVendors) * 100 : 0
  const verifiedPercentage = counts.totalVendors > 0 ? (counts.verifiedVendors / counts.totalVendors) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vendors"
          value={formatCount(counts.totalVendors)}
          icon={Store}
          color="purple"
        />
        <StatCard
          title="Active Vendors"
          value={formatCount(counts.activeVendors)}
          subtitle={`${activePercentage.toFixed(1)}% of total`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Pending Vendors"
          value={formatCount(counts.pendingVendors)}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Verified Vendors"
          value={formatCount(counts.verifiedVendors)}
          subtitle={`${verifiedPercentage.toFixed(1)}% of total`}
          icon={Star}
          color="blue"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Status Distribution</CardTitle>
          <CardDescription>Breakdown of vendors by verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UserProgressBar
              label="Active Vendors"
              value={counts.activeVendors}
              total={counts.totalVendors}
              color="bg-green-500"
            />
            <UserProgressBar
              label="Verified Vendors"
              value={counts.verifiedVendors}
              total={counts.totalVendors}
              color="bg-blue-500"
            />
            <UserProgressBar
              label="Pending Vendors"
              value={counts.pendingVendors}
              total={counts.totalVendors}
              color="bg-yellow-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LeadMetrics({ counts }: { counts: any }) {
  const conversionRate = counts.totalLeads > 0 ? (counts.convertedLeads / counts.totalLeads) * 100 : 0
  const contactedRate = counts.totalLeads > 0 ? (counts.contactedLeads / counts.totalLeads) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={formatCount(counts.totalLeads)}
          icon={Target}
          color="green"
        />
        <StatCard
          title="New Leads"
          value={formatCount(counts.newLeads)}
          icon={Sparkles}
          color="blue"
        />
        <StatCard
          title="Contacted"
          value={formatCount(counts.contactedLeads)}
          subtitle={`${contactedRate.toFixed(1)}% of total`}
          icon={MessageSquare}
          color="purple"
        />
        <StatCard
          title="Converted"
          value={formatCount(counts.convertedLeads)}
          subtitle={`${conversionRate.toFixed(1)}% conversion`}
          icon={CheckCircle2}
          color="green"
          trend={+conversionRate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel Progress</CardTitle>
          <CardDescription>Lead journey from new to converted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FunnelProgressBar
              label="New Leads"
              value={counts.newLeads}
              total={counts.totalLeads}
              color="bg-blue-500"
            />
            <FunnelProgressBar
              label="Contacted Leads"
              value={counts.contactedLeads}
              total={counts.totalLeads}
              color="bg-purple-500"
            />
            <FunnelProgressBar
              label="Converted Leads"
              value={counts.convertedLeads}
              total={counts.totalLeads}
              color="bg-green-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ContentMetrics({ counts }: { counts: any }) {
  const approvalRate = counts.totalReviews > 0 ? (counts.approvedReviews / counts.totalReviews) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Categories"
        value={formatCount(counts.totalCategories)}
        icon={PieChart}
        color="blue"
      />
      <StatCard
        title="Services"
        value={formatCount(counts.totalServices)}
        icon={FileText}
        color="purple"
      />
      <StatCard
        title="Portfolios"
        value={formatCount(counts.totalPortfolios)}
        icon={Eye}
        color="green"
      />
      <StatCard
        title="Reviews"
        value={formatCount(counts.totalReviews)}
        subtitle={`${approvalRate.toFixed(0)}% approved`}
        icon={Star}
        color="yellow"
      />
    </div>
  )
}

function FunnelMetrics({ counts, funnelRates }: { counts: any; funnelRates: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FunnelCard
          title="Vendor Discovery"
          started={counts.vendorDiscoveryStarted}
          completed={counts.vendorDiscoveryCompleted}
          rate={funnelRates?.vendorDiscovery || 0}
        />
        <FunnelCard
          title="User Signup"
          started={counts.userSignupStarted}
          completed={counts.userSignupCompleted}
          rate={funnelRates?.userSignup || 0}
        />
        <FunnelCard
          title="Vendor Onboarding"
          started={counts.vendorOnboardingStarted}
          completed={counts.vendorOnboardingCompleted}
          rate={funnelRates?.vendorOnboarding || 0}
        />
        <FunnelCard
          title="Event Planning"
          started={counts.eventPlanningStarted}
          completed={counts.eventPlanningCompleted}
          rate={funnelRates?.eventPlanning || 0}
        />
      </div>
    </div>
  )
}

function PlatformHealthMetrics({ dashboard }: { dashboard: any }) {
  if (!dashboard?.overview) return null

  const avgResponseTime = dashboard.overview.avgResponseTime ?? 0
  const avgConversionRate = dashboard.overview.avgConversionRate ?? 0
  const platformHealth = dashboard.overview.platformHealth ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Health</CardTitle>
        <CardDescription>Overall platform performance and health metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricBox
            label="Avg Response Time"
            value={`${Math.round(avgResponseTime)} min`}
            icon={Clock}
            color="blue"
          />
          <MetricBox
            label="Conversion Rate"
            value={`${(avgConversionRate * 100).toFixed(1)}%`}
            icon={TrendingUp}
            color="green"
          />
          <MetricBox
            label="Platform Health"
            value={`${Math.round(platformHealth * 100)}%`}
            icon={Activity}
            color="purple"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function UserEngagementDetails({ dashboard }: { dashboard: any }) {
  if (!dashboard?.userMetrics) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Engagement Metrics</CardTitle>
        <CardDescription>DAU, WAU, and MAU engagement ratios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricBox
            label="Daily Active Users"
            value={formatCount(dashboard.userMetrics.dau)}
            icon={Users}
            color="blue"
          />
          <MetricBox
            label="Weekly Active Users"
            value={formatCount(dashboard.userMetrics.wau)}
            icon={Activity}
            color="purple"
          />
          <MetricBox
            label="Monthly Active Users"
            value={formatCount(dashboard.userMetrics.mau)}
            icon={Calendar}
            color="green"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function VendorPerformanceDetails({ dashboard }: { dashboard: any }) {
  if (!dashboard?.vendorMetrics) return null

  const avgPerformanceScore = dashboard.vendorMetrics.avgPerformanceScore ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Performance</CardTitle>
        <CardDescription>Top performing vendors and average scores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <span className="text-sm font-medium">Average Performance Score</span>
            <span className="text-2xl font-bold">
              {avgPerformanceScore.toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: number
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && trend !== null && (
          <div className="mt-4 flex items-center gap-2">
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={cn('text-sm font-medium', trend >= 0 ? 'text-green-500' : 'text-red-500')}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MetricBox({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className={cn('rounded-lg p-3', `bg-${color}-500/10`)}>
        <Icon className={cn('h-5 w-5', `text-${color}-500`)} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function UserProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatCount(value)} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <Progress value={percentage} className="h-2" indicatorClassName={color} />
    </div>
  )
}

function FunnelProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatCount(value)} / {formatCount(total)}
        </span>
      </div>
      <div className="relative h-8 overflow-hidden rounded-lg bg-muted">
        <div
          className={cn('h-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

function FunnelCard({
  title,
  started,
  completed,
  rate,
}: {
  title: string
  started: number
  completed: number
  rate: number
}) {
  const safeRate = rate ?? 0
  const safeStarted = started ?? 0
  const safeCompleted = completed ?? 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{safeRate.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground">conversion</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Started</span>
              <span className="font-medium">{formatCount(safeStarted)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">{formatCount(safeCompleted)}</span>
            </div>
          </div>
          <Progress value={safeRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
