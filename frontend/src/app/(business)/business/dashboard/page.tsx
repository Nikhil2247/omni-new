'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth-store'
import {
  useBusinessProfile,
  useBusinessAnalyticsSummary,
  useBusinessReviews,
  useBusinessTasks,
  useBusinessAgreements,
} from '@/hooks/queries/use-business'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Star,
  Eye,
  TrendingUp,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  ListTodo,
} from 'lucide-react'

export default function BusinessDashboardPage() {
  const { user } = useAuthStore()
  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const { data: summary, isLoading: summaryLoading } = useBusinessAnalyticsSummary(30)
  const { data: reviews } = useBusinessReviews()
  const { data: tasks } = useBusinessTasks(profile?.id || '')
  const { data: agreements } = useBusinessAgreements(profile?.id || '')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate stats
  const pendingTasks = tasks?.filter(t => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length || 0
  const activeAgreements = agreements?.filter(a => a.status === 'LOCKED').length || 0
  const reviewsToRespond = reviews?.filter(r => !r.response).length || 0

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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Vendor'}!</h1>
          <p className="text-muted-foreground">
            Get started by setting up your business profile
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-2">
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name || profile.businessName}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your business performance
          </p>
        </div>
        {profile.status !== 'ACTIVE' && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {profile.status === 'PENDING_REVIEW' ? 'Pending Verification' : 'Profile Incomplete'}
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      {summaryLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary?.totalRevenue || 0)}
            icon={DollarSign}
            trend={summary?.periodComparison?.revenueChange}
          />
          <StatCard
            title="Active Agreements"
            value={String(activeAgreements)}
            icon={Briefcase}
          />
          <StatCard
            title="Profile Views"
            value={String(summary?.totalViews || profile.viewCount || 0)}
            icon={Eye}
            trend={summary?.periodComparison?.viewsChange}
          />
          <StatCard
            title="Average Rating"
            value={(summary?.averageRating || 0).toFixed(1)}
            icon={Star}
            subtitle={`${summary?.reviewCount || reviews?.length || 0} reviews`}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Agreements */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Agreements</CardTitle>
                <CardDescription>Latest agreements sent by the operations team</CardDescription>
              </div>
              <Link href="/business/agreements">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAgreements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No agreements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pending Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <ActionItem
                  icon={ListTodo}
                  label="Pending tasks"
                  count={pendingTasks}
                  href="/business/tasks"
                />
                <ActionItem
                  icon={Briefcase}
                  label="Active agreements"
                  count={activeAgreements}
                  href="/business/agreements"
                />
                <ActionItem
                  icon={Star}
                  label="Reviews to respond"
                  count={reviewsToRespond}
                  href="/business/reviews"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Tasks</CardTitle>
              <Link href="/business/tasks">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
                    return (
                      <TaskItem
                        key={task.id}
                        title={task.title}
                        dueDate={task.dueDate}
                        isOverdue={isOverdue}
                      />
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Overdue Tasks ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overdueTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="bg-white rounded-md p-3 border border-red-200">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-red-600">
                    Due: {format(new Date(task.dueDate!), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.activeEvent?.clientName}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/business/tasks">
                <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-100">
                  View All Tasks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>What clients are saying about you</CardDescription>
          </div>
          <Link href="/business/reviews">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!reviews || reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.slice(0, 4).map((review) => (
                <ReviewCard
                  key={review.id}
                  author={review.user?.name || 'Anonymous'}
                  rating={review.rating}
                  text={review.content || review.title || ''}
                  date={format(new Date(review.createdAt), 'MMM d, yyyy')}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
}: {
  title: string
  value: string
  icon: React.ElementType
  trend?: number
  subtitle?: string
}) {
  const hasTrend = trend !== undefined
  const isPositive = (trend || 0) >= 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {hasTrend && (
          <p className={`mt-1 flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 ${!isPositive && 'rotate-180'}`} />
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
  const statusConfig: Record<string, { label: string; color: string }> = {
    SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
    ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
    DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-700' },
    LOCKED: { label: 'Locked', color: 'bg-purple-100 text-purple-700' },
  }

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="flex items-center justify-between rounded-md border p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{clientName || 'Client'}</p>
          <p className="text-sm text-muted-foreground">{eventType || 'Event'}</p>
          {eventDate && (
            <p className="text-xs text-muted-foreground">
              {format(new Date(eventDate), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        {amount !== undefined && amount !== null && (
          <p className="font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            }).format(amount)}
          </p>
        )}
        <Badge className={config.color}>{config.label}</Badge>
      </div>
    </div>
  )
}

function ActionItem({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: React.ElementType
  label: string
  count: number
  href: string
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
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  )
}

function TaskItem({
  title,
  dueDate,
  isOverdue,
}: {
  title: string
  dueDate?: string | null
  isOverdue?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-2 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-primary'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {dueDate && (
          <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
            Due: {format(new Date(dueDate), 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  )
}

function ReviewCard({
  author,
  rating,
  text,
  date,
}: {
  author: string
  rating: number
  text: string
  date: string
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">{author}</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
      </div>
      {text && <p className="text-sm text-muted-foreground line-clamp-2">{text}</p>}
      <p className="mt-2 text-xs text-muted-foreground">{date}</p>
    </div>
  )
}
