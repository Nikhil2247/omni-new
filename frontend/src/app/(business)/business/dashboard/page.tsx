'use client'

import { useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  useBusinessProfile,
  useBusinessAnalyticsSummary,
  useBusinessReviews,
  useBusinessTasks,
  useBusinessAgreements,
  useBusinessLeads,
} from '@/hooks/queries/use-business'
import { useCampaigns, useAdCreditBalance, useVendorSubscription } from '@/hooks/queries/use-subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Star,
  Eye,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  ListTodo,
  Users,
  Coins,
  Megaphone,
  MessageSquare,
  Calendar,
  Clock,
  Target,
  MousePointerClick,
  BarChart3,
  Zap,
  Crown,
} from 'lucide-react'

export default function BusinessDashboardPage() {
  const { user } = useAuthStore()
  const { data: profile, isLoading: profileLoading } = useBusinessProfile()

  useEffect(() => {
    trackDashboard.view('vendor')
  }, [])

  const { data: summary, isLoading: summaryLoading } = useBusinessAnalyticsSummary(30)
  const { data: reviews } = useBusinessReviews()
  const { data: tasks } = useBusinessTasks(profile?.id || '')
  const { data: agreements } = useBusinessAgreements(profile?.id || '')
  const { data: leads } = useBusinessLeads()
  const { data: campaigns } = useCampaigns()
  const { data: creditBalance } = useAdCreditBalance()
  const { data: subscription } = useVendorSubscription()

  // Calculate stats
  const pendingTasks = tasks?.filter(t => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length || 0
  const activeAgreements = agreements?.filter(a => a.status === 'LOCKED').length || 0
  const reviewsToRespond = reviews?.filter(r => r.status === 'PENDING').length || 0
  const newLeads = leads?.filter(l => l.status === 'NEW').length || 0
  const totalLeads = leads?.length || 0

  // Active campaigns
  const activeCampaigns = campaigns?.filter(c => c.status === 'ACTIVE') || []
  const hasActiveCampaigns = activeCampaigns.length > 0

  // Campaign totals
  const campaignStats = activeCampaigns.reduce(
    (acc, campaign) => ({
      impressions: acc.impressions + (campaign.impressions || 0),
      clicks: acc.clicks + (campaign.clicks || 0),
      conversions: acc.conversions + (campaign.conversions || 0),
      spent: acc.spent + (campaign.creditsSpent || 0),
      budget: acc.budget + (campaign.totalBudget || 0),
    }),
    { impressions: 0, clicks: 0, conversions: 0, spent: 0, budget: 0 }
  )

  // Overdue tasks
  const overdueTasks = tasks?.filter(t => {
    if (!t.dueDate || t.status === 'COMPLETED' || t.status === 'CANCELLED') return false
    return new Date(t.dueDate) < new Date()
  }) || []

  // Recent agreements (last 5)
  const recentAgreements = agreements?.slice(0, 5) || []

  // Upcoming tasks (next 5 by due date)
  const upcomingTasks = tasks
    ?.filter(t => t.dueDate && t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5) || []

  // Plan info
  const planName = subscription?.plan?.name || 'Free'
  const planTier = subscription?.plan?.tier?.toUpperCase() || 'FREE'
  const isPaidPlan = planTier === 'PROFESSIONAL' || planTier === 'ENTERPRISE'

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-3">
        <PageHeader title={`Welcome, ${user?.name || 'Vendor'}!`} />
        <Card>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <h3 className="text-sm font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Create your business profile to receive agreements and manage your tasks.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/business/profile'}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={`Welcome back, ${user?.name || profile.businessName}!`}
        actions={
          <>
          {isPaidPlan && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" />
              {planName}
            </Badge>
          )}
          {profile.status !== 'ACTIVE' && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {profile.status === 'PENDING_REVIEW' ? 'Pending Verification' : 'Profile Incomplete'}
            </Badge>
          )}
          </>
        }
      />

      {/* Overdue Tasks Alert - Show prominently at top */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">
                    {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Link href="/business/tasks?filter=overdue">
                <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                  View Tasks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {summaryLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Profile Views"
            value={summary?.totalViews || profile.viewCount || 0}
            icon={Eye}
            trend={summary?.periodComparison?.viewsChange}
            subtitle="Last 30 days"
          />
          <StatCard
            title="Total Leads"
            value={totalLeads}
            icon={Users}
            highlight={newLeads > 0 ? `${newLeads} new` : undefined}
            highlightColor="text-green-600"
          />
          <StatCard
            title="Active Agreements"
            value={activeAgreements}
            icon={Briefcase}
          />
          <RatingCard
            rating={summary?.averageRating || 0}
            reviewCount={summary?.reviewCount || reviews?.length || 0}
          />
        </div>
      )}

      {/* Campaign Performance Card - Only if active campaigns */}
      {hasActiveCampaigns && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Megaphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Campaign Performance ({activeCampaigns.length} active)</CardTitle>
              </div>
            </div>
            <Link href="/business/marketing/campaigns">
              <Button variant="ghost" size="sm">
                Manage <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <CampaignMetric
                label="Impressions"
                value={campaignStats.impressions}
                icon={Eye}
              />
              <CampaignMetric
                label="Clicks"
                value={campaignStats.clicks}
                icon={MousePointerClick}
                subValue={campaignStats.impressions > 0
                  ? `${((campaignStats.clicks / campaignStats.impressions) * 100).toFixed(1)}% CTR`
                  : undefined}
              />
              <CampaignMetric
                label="Conversions"
                value={campaignStats.conversions}
                icon={Target}
              />
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Coins className="h-4 w-4" />
                  <span>Budget Used</span>
                </div>
                <p className="text-xl font-bold">{formatNumber(campaignStats.spent)}</p>
                <Progress
                  value={campaignStats.budget > 0 ? (campaignStats.spent / campaignStats.budget) * 100 : 0}
                  className="mt-2 h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  of {formatNumber(campaignStats.budget)} total budget
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions & Ad Credits */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Ad Credits Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Ad Credits
              </CardTitle>
              <Link href="/business/marketing/credits">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Manage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatNumber(creditBalance?.balance || 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">Available credits</p>
            {!hasActiveCampaigns && (creditBalance?.balance || 0) > 0 && (
              <Link href="/business/marketing/campaigns/new">
                <Button size="sm" className="mt-3 w-full">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ActionItem
              icon={ListTodo}
              label="Tasks to complete"
              count={pendingTasks}
              href="/business/tasks"
            />
            <ActionItem
              icon={Users}
              label="New leads"
              count={newLeads}
              href="/business/leads"
              highlight
            />
            <ActionItem
              icon={MessageSquare}
              label="Reviews to respond"
              count={reviewsToRespond}
              href="/business/reviews"
            />
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Tasks
              </CardTitle>
              <Link href="/business/tasks">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-2 text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 3).map((task) => (
                  <TaskItem
                    key={task.id}
                    title={task.title}
                    dueDate={task.dueDate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Recent Agreements */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm">Recent Agreements</CardTitle>
              </div>
              <Link href="/business/agreements">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAgreements.length === 0 ? (
                <div className="text-center py-2 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-1 opacity-50" />
                  <p>No agreements yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAgreements.map((agreement) => (
                    <AgreementItem
                      key={agreement.id}
                      eventType={agreement.activeEvent?.eventType}
                      clientName={agreement.activeEvent?.clientName}
                      eventDate={agreement.activeEvent?.eventDate}
                      status={agreement.status}
                      amount={agreement.agreedAmount}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InsightItem
              label="Profile completion"
              value={profile.status === 'ACTIVE' ? 100 : 75}
              suffix="%"
              showProgress
            />
            <InsightItem
              label="Response rate"
              value={summary?.responseRate || 0}
              suffix="%"
              description="To inquiries"
            />
            <InsightItem
              label="Avg. response time"
              value={summary?.avgResponseTime || '-'}
              description="To messages"
            />
            {!isPaidPlan && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Upgrade for more visibility
                </p>
                <Link href="/business/upgrade">
                  <Button size="sm" variant="outline" className="w-full">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm">Recent Reviews</CardTitle>
          </div>
          <Link href="/business/reviews">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!reviews || reviews.length === 0 ? (
            <div className="text-center py-2 text-muted-foreground">
              <Star className="h-8 w-8 mx-auto mb-1 opacity-50" />
              <p>No reviews yet</p>
              
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {reviews.slice(0, 4).map((review) => (
                <ReviewCard
                  key={review.id}
                  author={review.reviewer ? `${review.reviewer.firstName || ''} ${review.reviewer.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous'}
                  rating={review.rating}
                  text={review.body || review.title || ''}
                  date={review.createdAt}
                  hasResponse={!!review.response}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString('en-IN')
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  highlight,
  highlightColor = 'text-primary',
  iconColor,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: number
  subtitle?: string
  highlight?: string
  highlightColor?: string
  iconColor?: string
}) {
  const hasTrend = trend !== undefined && trend !== null
  const isPositive = (trend || 0) >= 0

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-xl font-bold">{value}</p>
          {highlight && (
            <span className={`text-sm font-medium ${highlightColor}`}>{highlight}</span>
          )}
        </div>
        {hasTrend && (
          <p className={`mt-1 flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}{trend?.toFixed(1)}% from last period
          </p>
        )}
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

function CampaignMetric({
  label,
  value,
  icon: Icon,
  subValue,
}: {
  label: string
  value: number
  icon: React.ElementType
  subValue?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="text-xl font-bold">{formatNumber(value)}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  )
}

function AgreementItem({
  eventType,
  clientName,
  eventDate,
  status,
  amount,
}: {
  eventType?: string | null
  clientName?: string | null
  eventDate?: string | null
  status: string
  amount?: number | null
}) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    SENT: { label: 'Sent', variant: 'secondary' },
    ACCEPTED: { label: 'Accepted', variant: 'default' },
    DECLINED: { label: 'Declined', variant: 'destructive' },
    LOCKED: { label: 'Active', variant: 'default' },
  }

  const config = statusConfig[status] || { label: status, variant: 'outline' as const }

  return (
    <div className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Briefcase className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{clientName || 'Client'}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{eventType || 'Event'}</span>
            {eventDate && (
              <>
                <span>•</span>
                <span>{format(new Date(eventDate), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex items-center gap-3">
        {amount !== undefined && amount !== null && (
          <p className="font-semibold text-sm">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 0,
            }).format(amount)}
          </p>
        )}
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    </div>
  )
}

function ActionItem({
  icon: Icon,
  label,
  count,
  href,
  highlight,
}: {
  icon: React.ElementType
  label: string
  count: number
  href: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      {count > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          highlight
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-primary/10 text-primary'
        }`}>
          {count}
        </span>
      )}
    </Link>
  )
}

function TaskItem({
  title,
  dueDate,
}: {
  title: string
  dueDate?: string | null
}) {
  const isOverdue = !!dueDate && new Date(dueDate) < new Date()
  const daysUntilDue = dueDate
    ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-primary'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {dueDate && (
          <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
            <Clock className="h-3 w-3" />
            {isOverdue
              ? `Overdue by ${formatDistanceToNow(new Date(dueDate))}`
              : daysUntilDue === 0
                ? 'Due today'
                : daysUntilDue === 1
                  ? 'Due tomorrow'
                  : `Due in ${daysUntilDue} days`
            }
          </p>
        )}
      </div>
    </div>
  )
}

function InsightItem({
  label,
  value,
  suffix = '',
  description,
  showProgress,
}: {
  label: string
  value: string | number
  suffix?: string
  description?: string
  showProgress?: boolean
}) {
  const numericValue = typeof value === 'number' ? value : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">{value}{suffix}</span>
      </div>
      {showProgress && (
        <Progress value={numericValue} className="h-1.5" />
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  )
}

function RatingCard({
  rating,
  reviewCount,
}: {
  rating: number
  reviewCount: number
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Average Rating</p>
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-xl font-bold">{rating.toFixed(1)}</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
        </p>
      </CardContent>
    </Card>
  )
}

function ReviewCard({
  author,
  rating,
  text,
  date,
  hasResponse,
}: {
  author: string
  rating: number
  text: string
  date: string
  hasResponse?: boolean
}) {
  return (
    <div className="rounded-lg border p-3 hover:bg-accent/30 transition-colors">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-sm">{author}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
      </div>
      {text && <p className="text-sm text-muted-foreground line-clamp-2">{text}</p>}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </p>
        {hasResponse && (
          <Badge variant="outline" className="text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Responded
          </Badge>
        )}
      </div>
    </div>
  )
}
