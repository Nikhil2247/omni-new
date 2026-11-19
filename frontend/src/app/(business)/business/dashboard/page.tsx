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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  DashboardHero,
  HeroChip,
  KpiCard,
  KpiGrid,
  ListRow,
  ListStack,
  PageHeader,
  Panel,
  PanelEmpty,
  StatusBadge,
  WidgetBoard,
  type BoardWidget,
} from '@/components/dash'
import {
  Star,
  Eye,
  CheckCircle2,
  Loader2,
  AlertTriangle,
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
  Zap,
  Crown,
  BarChart3,
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
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="text-sm font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Create your business profile to receive agreements and manage your tasks.
            </p>
            <Button asChild className="mt-4">
              <Link href="/business/profile">Create Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Completion is computed from the profile's real fields. Lists (services, portfolio) are only
  // judged when the API returned them, so a missing include never lowers the score.
  const checklist = [
    { label: 'profile photo', done: !!profile.profilePhotoUrl },
    { label: 'banner image', done: !!profile.bannerImageUrl },
    { label: 'tagline', done: !!profile.tagline?.trim() },
    { label: 'description', done: !!profile.description?.trim() },
    { label: 'contact phone', done: !!profile.contactPhone },
    { label: 'contact email', done: !!profile.contactEmail },
    { label: 'address', done: !!(profile.addressId || profile.address) },
    ...(profile.services ? [{ label: 'services', done: profile.services.length > 0 }] : []),
    ...(profile.portfolios ? [{ label: 'portfolio', done: profile.portfolios.length > 0 }] : []),
  ]
  const missingItems = checklist.filter((c) => !c.done).map((c) => c.label)
  const profileCompletion = Math.round(((checklist.length - missingItems.length) / checklist.length) * 100)
  const profileIncomplete = profile.status !== 'ACTIVE' || missingItems.length > 0
  const rating = summary?.averageRating || 0
  const reviewCount = summary?.reviewCount || reviews?.length || 0
  const firstName = user?.name?.split(' ')[0] || profile.businessName
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const widgets: BoardWidget[] = [
    {
      id: 'next-steps',
      title: 'What to do next',
      span: 5,
      content: (
        <Panel title="What to do next" icon={Zap} description="Items that need your attention">
          <ListStack>
            {profileIncomplete && (
              <ListRow
                icon={AlertTriangle}
                href="/business/profile"
                title={profile.status === 'PENDING_REVIEW' && missingItems.length === 0 ? 'Verification in progress' : 'Complete your profile'}
                meta={
                  missingItems.length > 0
                    ? `Add: ${missingItems.slice(0, 3).join(', ')}${missingItems.length > 3 ? ` +${missingItems.length - 3} more` : ''}`
                    : profile.status === 'PENDING_REVIEW'
                      ? 'We are reviewing your details'
                      : 'Finish setup to get discovered'
                }
              />
            )}
            {overdueTasks.length > 0 && (
              <ListRow
                icon={AlertTriangle}
                href="/business/tasks?filter=overdue"
                title={`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`}
                meta="Review and complete them"
                trailing={<StatusBadge status="overdue" tone="danger" />}
              />
            )}
            <ListRow icon={ListTodo} href="/business/tasks" title="Tasks to complete" trailing={<CountPill n={pendingTasks} />} />
            <ListRow icon={Users} href="/business/leads" title="New leads" trailing={<CountPill n={newLeads} />} />
            <ListRow icon={MessageSquare} href="/business/reviews" title="Reviews to respond" trailing={<CountPill n={reviewsToRespond} />} />
          </ListStack>
        </Panel>
      ),
    },
    {
      id: 'upcoming-tasks',
      title: 'Upcoming tasks',
      span: 7,
      content: (
        <Panel title="Upcoming tasks" icon={Calendar} action={{ label: 'View all', href: '/business/tasks' }}>
          {upcomingTasks.length === 0 ? (
            <PanelEmpty icon={CheckCircle2}>All caught up!</PanelEmpty>
          ) : (
            <ListStack>
              {upcomingTasks.map((task) => (
                <TaskRow key={task.id} title={task.title} dueDate={task.dueDate} />
              ))}
            </ListStack>
          )}
        </Panel>
      ),
    },
    {
      id: 'agreements',
      title: 'Recent agreements',
      span: 8,
      content: (
        <Panel title="Recent agreements" icon={Briefcase} action={{ label: 'View all', href: '/business/agreements' }}>
          {recentAgreements.length === 0 ? (
            <PanelEmpty icon={Briefcase}>No agreements yet</PanelEmpty>
          ) : (
            <ListStack>
              {recentAgreements.map((agreement) => (
                <AgreementRow
                  key={agreement.id}
                  eventType={agreement.activeEvent?.eventType}
                  clientName={agreement.activeEvent?.clientName}
                  eventDate={agreement.activeEvent?.eventDate}
                  status={agreement.status}
                  amount={agreement.agreedAmount}
                />
              ))}
            </ListStack>
          )}
        </Panel>
      ),
    },
    {
      id: 'performance',
      title: 'Performance',
      span: 4,
      content: (
        <Panel title="Performance" icon={BarChart3}>
          <div className="space-y-3">
            <Metric label="Profile completion" value={`${profileCompletion}%`}>
              <Progress value={profileCompletion} className="h-1.5" />
            </Metric>
            <Metric label="Response rate" value={`${summary?.responseRate || 0}%`} description="To inquiries" />
            <Metric label="Avg. response time" value={summary?.avgResponseTime || '-'} description="To messages" />
            {!isPaidPlan && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-2 text-sm">Upgrade for more visibility</p>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/business/upgrade">
                    <Crown className="size-4" /> Upgrade Plan
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </Panel>
      ),
    },
    ...(hasActiveCampaigns
      ? [
          {
            id: 'campaigns',
            title: 'Campaign performance',
            span: 8 as const,
            content: (
              <Panel
                title={`Campaign performance (${activeCampaigns.length} active)`}
                icon={Megaphone}
                action={{ label: 'Manage', href: '/business/marketing/campaigns' }}
              >
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Metric label="Impressions" value={formatNumber(campaignStats.impressions)} icon={Eye} />
                  <Metric
                    label="Clicks"
                    value={formatNumber(campaignStats.clicks)}
                    icon={MousePointerClick}
                    description={
                      campaignStats.impressions > 0
                        ? `${((campaignStats.clicks / campaignStats.impressions) * 100).toFixed(1)}% CTR`
                        : undefined
                    }
                  />
                  <Metric label="Conversions" value={formatNumber(campaignStats.conversions)} icon={Target} />
                  <Metric
                    label="Budget used"
                    value={formatNumber(campaignStats.spent)}
                    icon={Coins}
                    description={`of ${formatNumber(campaignStats.budget)} total budget`}
                  >
                    <Progress
                      value={campaignStats.budget > 0 ? (campaignStats.spent / campaignStats.budget) * 100 : 0}
                      className="h-1.5"
                    />
                  </Metric>
                </div>
              </Panel>
            ),
          },
        ]
      : []),
    {
      id: 'ad-credits',
      title: 'Ad credits',
      span: hasActiveCampaigns ? 4 : 5,
      content: (
        <Panel title="Ad credits" icon={Coins} action={{ label: 'Manage', href: '/business/marketing/credits' }}>
          <p className="tabular text-2xl font-semibold">{formatNumber(creditBalance?.balance || 0)}</p>
          <p className="text-muted-foreground mt-1 text-sm">Available credits</p>
          {!hasActiveCampaigns && (creditBalance?.balance || 0) > 0 && (
            <Button asChild size="sm" className="mt-3 w-full">
              <Link href="/business/marketing/campaigns/new">
                <Megaphone className="size-4" /> Create Campaign
              </Link>
            </Button>
          )}
        </Panel>
      ),
    },
    {
      id: 'reviews',
      title: 'Recent reviews',
      span: hasActiveCampaigns ? 12 : 7,
      content: (
        <Panel title="Recent reviews" icon={Star} action={{ label: 'View all', href: '/business/reviews' }}>
          {!reviews || reviews.length === 0 ? (
            <PanelEmpty icon={Star}>No reviews yet</PanelEmpty>
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
        </Panel>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DashboardHero
        eyebrow={profile.businessName}
        title={`${greeting}, ${firstName}`}
        subtitle="Here is what needs your attention and how your business is doing."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/business/tasks"><ListTodo className="size-3.5" /> Tasks</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/business/leads"><Users className="size-3.5" /> Leads</Link>
            </Button>
          </>
        }
        aside={
          <>
            {isPaidPlan && <HeroChip icon={Crown} label="Plan" value={planName} />}
            {profileIncomplete && (
              <HeroChip
                icon={AlertTriangle}
                label="Profile"
                value={profile.status === 'PENDING_REVIEW' ? 'Pending verification' : 'Incomplete'}
              />
            )}
            {newLeads > 0 && <HeroChip icon={Users} label="New leads" value={newLeads} />}
          </>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Profile views"
          value={summary?.totalViews || profile.viewCount || 0}
          icon={Eye}
          loading={summaryLoading}
          delta={summary?.periodComparison?.viewsChange ?? undefined}
          hint="Last 30 days"
        />
        <KpiCard
          label="Total leads"
          value={totalLeads}
          icon={Users}
          loading={summaryLoading}
          hint={newLeads > 0 ? `${newLeads} new` : undefined}
          href="/business/leads"
        />
        <KpiCard
          label="Active agreements"
          value={activeAgreements}
          icon={Briefcase}
          loading={summaryLoading}
          href="/business/agreements"
        />
        <KpiCard
          label="Average rating"
          value={rating.toFixed(1)}
          icon={Star}
          loading={summaryLoading}
          hint={`${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`}
          href="/business/reviews"
        />
      </KpiGrid>

      <WidgetBoard storageKey="business-dashboard" widgets={widgets} />
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString('en-IN')
}

function CountPill({ n }: { n: number }) {
  if (n <= 0) return <span className="text-muted-foreground text-xs">0</span>
  return <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">{n}</span>
}

function Metric({
  label,
  value,
  icon: Icon,
  description,
  children,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ElementType
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {Icon ? <Icon className="size-3.5" /> : null}
        <span>{label}</span>
      </div>
      <p className="tabular text-lg font-semibold">{value}</p>
      {children}
      {description && <p className="text-muted-foreground text-xs">{description}</p>}
    </div>
  )
}

function AgreementRow({
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
  const labels: Record<string, string> = { SENT: 'Sent', ACCEPTED: 'Accepted', DECLINED: 'Declined', LOCKED: 'Active' }
  const meta = [eventType || 'Event', eventDate ? format(new Date(eventDate), 'MMM d, yyyy') : null].filter(Boolean).join(' • ')
  return (
    <ListRow
      icon={Briefcase}
      title={clientName || 'Client'}
      meta={meta}
      trailing={
        <span className="flex items-center gap-3">
          {amount !== undefined && amount !== null && (
            <span className="tabular text-sm font-semibold">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)}
            </span>
          )}
          <StatusBadge status={status}>{labels[status]}</StatusBadge>
        </span>
      }
    />
  )
}

function TaskRow({ title, dueDate }: { title: string; dueDate?: string | null }) {
  const isOverdue = !!dueDate && new Date(dueDate) < new Date()
  const daysUntilDue = dueDate
    ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null
  const meta = !dueDate
    ? undefined
    : isOverdue
      ? `Overdue by ${formatDistanceToNow(new Date(dueDate))}`
      : daysUntilDue === 0
        ? 'Due today'
        : daysUntilDue === 1
          ? 'Due tomorrow'
          : `Due in ${daysUntilDue} days`
  return (
    <ListRow
      icon={Clock}
      href="/business/tasks"
      title={title}
      meta={meta}
      trailing={isOverdue ? <StatusBadge status="overdue" tone="danger" /> : undefined}
    />
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
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{author}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`size-3.5 ${i < rating ? 'fill-primary text-primary' : 'text-muted-foreground/40'}`} />
          ))}
        </div>
      </div>
      {text && <p className="text-muted-foreground line-clamp-2 text-sm">{text}</p>}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(date), { addSuffix: true })}</p>
        {hasResponse && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <CheckCircle2 className="size-3" /> Responded
          </span>
        )}
      </div>
    </div>
  )
}
