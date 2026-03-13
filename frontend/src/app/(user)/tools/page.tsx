'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trackDashboard } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowDown,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Mail,
  PlusCircle,
  Send,
  Sparkles,
  Users,
  Wallet,
  ChevronRight,
  AlertCircle,
  PartyPopper,
  ShieldAlert,
  Siren,
} from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import { useChecklist } from '@/hooks/queries/use-checklists'
import { useBudget } from '@/hooks/queries/use-budget'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { useTimeline } from '@/hooks/queries/use-timeline'
import { usePlannerInsights } from '@/hooks/queries/use-planner-insights'
import { cn } from '@/lib/utils'

// Tool flow order matching the screenshot
const TOOL_FLOW = [
  {
    id: 'create-event',
    step: 1,
    title: 'Create Event',
    description: 'Start by creating your event',
    icon: Calendar,
    color: 'purple',
    href: '/events/new',
    isRequired: true,
  },
  {
    id: 'timeline',
    step: 2,
    title: 'Event Timeline',
    description: 'Plan your day schedule',
    icon: Clock,
    color: 'sky',
    segment: 'timeline',
  },
  {
    id: 'budget',
    step: 3,
    title: 'Budget & Calculator',
    description: 'Track expenses and spending',
    icon: Wallet,
    color: 'amber',
    segment: 'budget',
  },
  {
    id: 'checklist',
    step: 4,
    title: 'Event Checklist',
    description: 'Manage tasks and to-dos',
    icon: CheckSquare,
    color: 'emerald',
    segment: 'checklist',
  },
  {
    id: 'e-invite',
    step: 5,
    title: 'E-Invite',
    description: 'Send invitations via WhatsApp',
    icon: Send,
    color: 'green',
    segment: 'guestlist',
    badge: 'WhatsApp',
  },
  {
    id: 'guestlist',
    step: 6,
    title: 'Guestlist',
    description: 'Manage your guests',
    icon: Users,
    color: 'violet',
    segment: 'guestlist',
  },
  {
    id: 'rsvp',
    step: 7,
    title: 'RSVP',
    description: 'Track guest responses',
    icon: Mail,
    color: 'pink',
    segment: 'guestlist',
    badge: 'In Guestlist',
  },
]

const COLOR_STYLES: Record<string, { bg: string; text: string; border: string; light: string }> = {
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    light: 'bg-purple-50 dark:bg-purple-950/20',
  },
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    light: 'bg-sky-50 dark:bg-sky-950/20',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    light: 'bg-amber-50 dark:bg-amber-950/20',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    light: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    light: 'bg-green-50 dark:bg-green-950/20',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    light: 'bg-violet-50 dark:bg-violet-950/20',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
    light: 'bg-pink-50 dark:bg-pink-950/20',
  },
}

export default function UserToolsPage() {
  const router = useRouter()
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ page: 1, limit: 1 })
  const primaryEvent = eventsData?.data?.[0]
  const eventId = primaryEvent?.id

  // Fetch tool data for progress tracking (only if event exists)
  const { data: checklistData } = useChecklist(eventId || '')
  const { data: budgetData } = useBudget(eventId || '')
  const { data: guestlistData } = useGuestlist(eventId || '')
  const { data: timelineData } = useTimeline(eventId || '')
  const { data: plannerInsightsData, isLoading: plannerInsightsLoading } = usePlannerInsights(eventId || '')

  useEffect(() => {
    trackDashboard.sectionView('tools', 'user')
  }, [])

  // Calculate tool progress
  const toolProgress = useMemo(() => {
    if (!eventId) return {}

    const progress: Record<string, { completed: number; total: number; percentage: number }> = {}

    // Timeline progress - items is a JSON array
    const timelineItems = Array.isArray(timelineData?.items) ? timelineData.items.length : 0
    progress.timeline = {
      completed: timelineItems,
      total: timelineItems || 1,
      percentage: timelineItems > 0 ? 100 : 0,
    }

    // Budget progress
    const budgetItems = budgetData?.items?.length || 0
    const paidItems = budgetData?.items?.filter((i: { isPaid?: boolean }) => i.isPaid)?.length || 0
    progress.budget = {
      completed: paidItems,
      total: budgetItems || 1,
      percentage: budgetItems > 0 ? Math.round((paidItems / budgetItems) * 100) : 0,
    }

    // Checklist progress - checklistData is a single checklist with tasks
    const allTasks = checklistData?.tasks || []
    const completedTasks = allTasks.filter((t: { isCompleted?: boolean }) => t.isCompleted).length
    progress.checklist = {
      completed: completedTasks,
      total: allTasks.length || 1,
      percentage: allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0,
    }

    // Guestlist/RSVP progress - guestlistData is a single guestlist with guests
    const allGuests = guestlistData?.guests || []
    const respondedGuests = allGuests.filter(
      (g: { rsvpStatus?: string }) => g.rsvpStatus === 'ATTENDING' || g.rsvpStatus === 'NOT_ATTENDING'
    ).length
    progress.guestlist = {
      completed: respondedGuests,
      total: allGuests.length || 1,
      percentage: allGuests.length > 0 ? Math.round((respondedGuests / allGuests.length) * 100) : 0,
    }
    progress['e-invite'] = progress.guestlist
    progress.rsvp = progress.guestlist

    return progress
  }, [eventId, timelineData, budgetData, checklistData, guestlistData])

  // Check which tools are set up
  const toolSetup = useMemo(() => {
    // Timeline items is a JSON array
    const timelineItems = Array.isArray(timelineData?.items) ? timelineData.items.length : 0
    // Budget items
    const budgetItems = budgetData?.items?.length || 0
    // Checklist is a single object with tasks
    const checklistTasks = checklistData?.tasks?.length || 0
    // Guestlist is a single object with guests
    const guests = guestlistData?.guests?.length || 0

    return {
      'create-event': !!eventId,
      timeline: timelineItems > 0,
      budget: budgetItems > 0,
      checklist: checklistTasks > 0,
      'e-invite': guests > 0,
      guestlist: guests > 0,
      rsvp: guests > 0,
    }
  }, [eventId, timelineData, budgetData, checklistData, guestlistData])

  function getToolHref(tool: (typeof TOOL_FLOW)[0]): string {
    if (tool.id === 'create-event') {
      return eventId ? `/events/${eventId}` : '/events/new'
    }
    if (tool.segment && eventId) {
      return `/events/${eventId}/${tool.segment}`
    }
    return '/events/new'
  }

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!eventId) return 0
    const setupCount = Object.values(toolSetup).filter(Boolean).length
    return Math.round((setupCount / TOOL_FLOW.length) * 100)
  }, [eventId, toolSetup])

  const setUpCount = useMemo(() => {
    if (!eventId) return 0
    return Object.values(toolSetup).filter(Boolean).length
  }, [eventId, toolSetup])

  const remainingToolsCount = useMemo(() => {
    if (!eventId) return TOOL_FLOW.length
    return Math.max(0, TOOL_FLOW.length - setUpCount)
  }, [eventId, setUpCount])

  const nextActionLabel = useMemo(() => {
    if (!eventId) return 'Create your first event to unlock planning tools.'
    if (!toolSetup.timeline) return 'Add your event timeline to define the day flow.'
    if (!toolSetup.budget) return 'Set your budget categories and expected spend.'
    if (!toolSetup.checklist) return 'Create your checklist to lock execution tasks.'
    if (!toolSetup.guestlist) return 'Add your guest list to begin invites and RSVP tracking.'
    return 'Review your planner insights and keep momentum this week.'
  }, [eventId, toolSetup])

  const fallbackPlannerInsights = useMemo(() => {
    if (!eventId) {
      return {
        healthScore: 0,
        healthLabel: 'Not Started',
        healthTone: 'text-muted-foreground',
        topActions: ['Create your first event to unlock your planning command center.'],
        risks: [],
      }
    }

    const checklistTasks = checklistData?.tasks || []
    const completedTasks = checklistTasks.filter((task: { isCompleted?: boolean }) => task.isCompleted).length
    const checklistCompletion = checklistTasks.length > 0 ? Math.round((completedTasks / checklistTasks.length) * 100) : 0
    const overdueTasks = checklistTasks.filter((task: { isCompleted?: boolean; dueDate?: string }) => {
      if (task.isCompleted || !task.dueDate) return false
      return new Date(task.dueDate) < new Date()
    }).length

    const budgetItems = budgetData?.items || []
    const paidItems = budgetItems.filter((item: { isPaid?: boolean }) => item.isPaid).length
    const budgetCompletion = budgetItems.length > 0 ? Math.round((paidItems / budgetItems.length) * 100) : 0
    const totalBudget = Number(budgetData?.totalBudget || 0)
    const totalSpent = budgetItems.reduce(
      (sum: number, item: { actualCost?: number | string }) => sum + Number(item.actualCost || 0),
      0,
    )
    const budgetUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    const timelineItemsCount = Array.isArray(timelineData?.items) ? timelineData.items.length : 0
    const guests = guestlistData?.guests || []
    const respondedGuests = guests.filter(
      (g: { rsvpStatus?: string }) => g.rsvpStatus === 'ATTENDING' || g.rsvpStatus === 'NOT_ATTENDING',
    ).length
    const rsvpRate = guests.length > 0 ? Math.round((respondedGuests / guests.length) * 100) : 0

    // Weighted to favor progress on execution-critical tools.
    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          20 +
            checklistCompletion * 0.3 +
            budgetCompletion * 0.2 +
            (timelineItemsCount > 0 ? 15 : 0) +
            rsvpRate * 0.25 +
            (guests.length > 0 ? 10 : 0),
        ),
      ),
    )

    const topActions: string[] = []
    if (!toolSetup.timeline) topActions.push('Add your first timeline block to anchor the event day flow.')
    if (checklistTasks.length === 0) topActions.push('Create checklist tasks for this week and assign due dates.')
    if (budgetItems.length === 0) topActions.push('Add budget categories now to prevent blind spending.')
    if (guests.length === 0) topActions.push('Start your guestlist to unlock RSVP tracking and invite flow.')
    if (guests.length > 0 && rsvpRate < 40) topActions.push('Follow up pending RSVPs to reduce last-minute uncertainty.')
    if (topActions.length === 0) {
      topActions.push('Review vendor confirmations and lock final payments for a smoother execution week.')
      topActions.push('Run a final timeline rehearsal with family or coordinator.')
      topActions.push('Send a final reminder to pending guests and vendors.')
    }

    const risks: Array<{ id: string; title: string; detail: string; level: 'high' | 'medium' | 'low' }> = []
    if (overdueTasks > 0) {
      risks.push({
        id: 'overdue-tasks',
        title: `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`,
        detail: 'Overdue checklist items can break downstream event dependencies.',
        level: 'high',
      })
    }
    if (totalBudget > 0 && budgetUsage > 90) {
      risks.push({
        id: 'budget-risk',
        title: `Budget at ${budgetUsage}%`,
        detail: 'Spending is close to the limit. Revisit optional expense categories.',
        level: budgetUsage > 100 ? 'high' : 'medium',
      })
    }
    if (guests.length > 0 && rsvpRate < 50) {
      risks.push({
        id: 'rsvp-risk',
        title: `RSVP response at ${rsvpRate}%`,
        detail: 'Low responses impact seating, catering, and logistics confidence.',
        level: 'medium',
      })
    }
    if (timelineItemsCount === 0) {
      risks.push({
        id: 'timeline-risk',
        title: 'No timeline blocks added',
        detail: 'Without a run-of-show, event-day coordination gets risky.',
        level: 'medium',
      })
    }

    const healthLabel =
      healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Strong' : healthScore >= 45 ? 'At Risk' : 'Critical'
    const healthTone =
      healthScore >= 85
        ? 'text-emerald-600 dark:text-emerald-400'
        : healthScore >= 70
        ? 'text-sky-600 dark:text-sky-400'
        : healthScore >= 45
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

    return {
      healthScore,
      healthLabel,
      healthTone,
      topActions: topActions.slice(0, 3),
      risks: risks.slice(0, 3),
    }
  }, [eventId, checklistData, budgetData, guestlistData, timelineData, toolSetup.timeline])

  const plannerInsights = useMemo(() => {
    if (!plannerInsightsData) {
      return fallbackPlannerInsights
    }

    const healthTone =
      plannerInsightsData.healthScore >= 85
        ? 'text-emerald-600 dark:text-emerald-400'
        : plannerInsightsData.healthScore >= 70
        ? 'text-sky-600 dark:text-sky-400'
        : plannerInsightsData.healthScore >= 45
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400'

    return {
      healthScore: plannerInsightsData.healthScore,
      healthLabel: plannerInsightsData.healthLabel,
      healthTone,
      topActions: plannerInsightsData.topActions,
      risks: plannerInsightsData.risks,
    }
  }, [plannerInsightsData, fallbackPlannerInsights])

  return (
    <div className="space-y-8 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-linear-to-br from-violet-50 via-fuchsia-50 to-rose-50 p-6 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-rose-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-500/20" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-700 shadow-sm dark:bg-violet-950/70 dark:text-violet-200">
              Smart Planning Command Center
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Planning Tools</h1>
            <p className="mt-2 text-base text-muted-foreground">
              {primaryEvent ? (
                <>
                  Planning for <span className="font-medium text-foreground">{primaryEvent.name}</span>
                </>
              ) : (
                'Follow the flow to plan your perfect event'
              )}
            </p>
            {eventId && (
              <div className="mt-4 flex items-center gap-3">
                <Progress value={overallProgress} className="h-2.5 w-44 bg-white/70 dark:bg-muted/50" />
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{overallProgress}% complete</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                <p className="text-[11px] text-muted-foreground">Flow Steps</p>
                <p className="font-semibold">{TOOL_FLOW.length} total</p>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                <p className="text-[11px] text-muted-foreground">Tools Set Up</p>
                <p className="font-semibold">{setUpCount}</p>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40 col-span-2 sm:col-span-1">
                <p className="text-[11px] text-muted-foreground">Planner Health</p>
                <p className="font-semibold">{eventId ? `${plannerInsights.healthScore}/100` : 'Not started'}</p>
              </div>
            </div>
          </div>

          <Button
            asChild
            className="self-start rounded-full border-0 bg-foreground px-6 text-background shadow-md transition-transform hover:scale-[1.02] hover:bg-foreground/90 sm:self-auto"
            variant={primaryEvent ? 'outline' : 'default'}
          >
            <Link href={primaryEvent ? '/events' : '/events/new'}>
              {primaryEvent ? (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  My Events
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Planning Overview */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-violet-200/70 bg-linear-to-br from-violet-50 to-white dark:border-violet-900/60 dark:from-violet-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-2xl font-bold">{overallProgress}%</p>
              <p className="pb-0.5 text-xs text-muted-foreground">overall</p>
            </div>
            <Progress value={overallProgress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-sky-200/70 bg-linear-to-br from-sky-50 to-white dark:border-sky-900/60 dark:from-sky-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tools Ready</p>
            <p className="mt-2 text-2xl font-bold">{setUpCount}</p>
            <p className="mt-2 text-xs text-muted-foreground">of {TOOL_FLOW.length} configured</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-rose-200/70 bg-linear-to-br from-rose-50 to-white dark:border-rose-900/60 dark:from-rose-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
            <p className="mt-2 text-2xl font-bold">{remainingToolsCount}</p>
            <p className="mt-2 text-xs text-muted-foreground">steps pending completion</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-200/70 bg-linear-to-br from-emerald-50 to-white dark:border-emerald-900/60 dark:from-emerald-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Next Action</p>
            <p className="mt-2 line-clamp-3 text-sm font-medium">{nextActionLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* No Event Warning */}
      {!eventId && !eventsLoading && (
        <Card className="rounded-2xl border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Start with Step 1</p>
              <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/80">
                Create your event first to unlock all planning tools. Each tool is linked to your event.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planner Intelligence */}
      {eventId && (
        <div className="grid gap-4 lg:grid-cols-3">
          {plannerInsightsLoading ? (
            <>
              <Card className="rounded-2xl border-violet-200/70 bg-white/80 dark:border-violet-900/60 dark:bg-violet-950/20 lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Siren className="h-4 w-4" />
                    Event Health Score
                  </CardTitle>
                  <CardDescription>Snapshot of planning readiness across timeline, budget, tasks, and RSVP.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-9 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-2 w-full animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-sky-200/70 bg-white/80 dark:border-sky-900/60 dark:bg-sky-950/20 lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    Top 3 Actions
                  </CardTitle>
                  <CardDescription>Highest impact moves to improve your plan this week.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <div className="mt-0.5 h-5 w-5 animate-pulse rounded-full bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-rose-200/70 bg-white/80 dark:border-rose-900/60 dark:bg-rose-950/20 lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="h-4 w-4" />
                    Risk Alerts
                  </CardTitle>
                  <CardDescription>Potential blockers that need attention now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {[1, 2].map((item) => (
                    <div key={item} className="rounded-md border p-2.5">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                      <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="rounded-2xl border-violet-200/70 bg-white/85 shadow-sm dark:border-violet-900/60 dark:bg-violet-950/20 lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Siren className="h-4 w-4" />
                    Event Health Score
                  </CardTitle>
                  <CardDescription>Snapshot of planning readiness across timeline, budget, tasks, and RSVP.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className={cn('text-3xl font-bold', plannerInsights.healthTone)}>{plannerInsights.healthScore}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <p className={cn('mt-1 text-sm font-medium', plannerInsights.healthTone)}>{plannerInsights.healthLabel}</p>
                  <Progress value={plannerInsights.healthScore} className="mt-3 h-2" />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-sky-200/70 bg-white/85 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/20 lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    Top 3 Actions
                  </CardTitle>
                  <CardDescription>Highest impact moves to improve your plan this week.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {plannerInsights.topActions.map((action, index) => (
                    <div key={`${action}-${index}`} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="mt-0.5 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                        {index + 1}
                      </Badge>
                      <p className="text-muted-foreground">{action}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-rose-200/70 bg-white/85 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20 lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="h-4 w-4" />
                    Risk Alerts
                  </CardTitle>
                  <CardDescription>Potential blockers that need attention now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {plannerInsights.risks.length === 0 ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                      No immediate risks detected. Keep this momentum.
                    </div>
                  ) : (
                    plannerInsights.risks.map((risk) => (
                      <div
                        key={risk.id}
                        className={cn(
                          'rounded-md border p-2.5',
                          risk.level === 'high'
                            ? 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30'
                            : risk.level === 'medium'
                            ? 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30'
                            : 'border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30',
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle
                            className={cn(
                              'h-3.5 w-3.5',
                              risk.level === 'high'
                                ? 'text-red-600 dark:text-red-400'
                                : risk.level === 'medium'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-sky-600 dark:text-sky-400',
                            )}
                          />
                          <p className="text-xs font-medium">{risk.title}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{risk.detail}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tool Flow - Sequential Steps */}
      <div className="relative">
        {/* Flow connector line */}
        <div className="absolute bottom-0 left-6 top-0 hidden w-0.5 bg-linear-to-b from-violet-300 via-cyan-300 to-rose-300 dark:from-violet-700 dark:via-cyan-700 dark:to-rose-700 sm:block" />

        <div className="space-y-4">
          {TOOL_FLOW.map((tool, index) => {
            const Icon = tool.icon
            const colors = COLOR_STYLES[tool.color]
            const href = getToolHref(tool)
            const isSetUp = toolSetup[tool.id as keyof typeof toolSetup]
            const progress = toolProgress[tool.id]
            const isLocked = !eventId && tool.id !== 'create-event'

            return (
              <div key={tool.id} className="relative">
                {/* Step connector */}
                <div className="absolute left-6 -translate-x-1/2 hidden sm:flex flex-col items-center">
                  <div
                    className={cn(
                      'z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 bg-background shadow-sm ring-4 ring-background/80',
                      isSetUp ? 'border-green-500' : colors.border
                    )}
                  >
                    {isSetUp ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <span className={cn('text-lg font-bold', colors.text)}>{tool.step}</span>
                    )}
                  </div>
                </div>

                {/* Tool Card */}
                <Link
                  href={isLocked ? '#' : href}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault()
                      router.push('/events/new')
                    }
                  }}
                  className={cn(
                    'group block sm:ml-16',
                    isLocked && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <Card
                    className={cn(
                      'rounded-2xl border transition-all duration-200',
                      !isLocked && 'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg',
                      isSetUp && 'border-green-200 dark:border-green-800',
                      !isSetUp && colors.light,
                    )}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={cn('h-14 w-1 rounded-full hidden sm:block', colors.bg)} />

                      {/* Mobile step indicator */}
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border sm:hidden',
                          isSetUp ? 'bg-green-100 dark:bg-green-900/30' : colors.bg
                        )}
                      >
                        {isSetUp ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <span className={cn('font-bold', colors.text)}>{tool.step}</span>
                        )}
                      </div>

                      {/* Icon */}
                      <div className={cn('hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm sm:flex', colors.bg, colors.border)}>
                        <Icon className={cn('h-6 w-6', colors.text)} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold leading-tight transition-colors group-hover:text-primary">
                            {tool.title}
                          </p>
                          {tool.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {tool.badge}
                            </Badge>
                          )}
                          {isSetUp && (
                            <Badge variant="outline" className="border-green-200 bg-green-50 text-xs text-green-700">
                              Set up
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{tool.description}</p>

                        {/* Progress bar for set up tools */}
                        {isSetUp && progress && progress.total > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={progress.percentage} className="h-1.5 w-24" />
                            <span className="text-xs text-muted-foreground">
                              {progress.completed}/{progress.total}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      {isLocked ? (
                        <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      )}
                    </CardContent>
                  </Card>
                </Link>

                {/* Arrow connector between steps */}
                {index < TOOL_FLOW.length - 1 && (
                  <div className="flex justify-center py-1 sm:hidden">
                    <ArrowDown className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Completion celebration */}
      {overallProgress === 100 && eventId && (
        <Card className="rounded-2xl border-green-200 bg-linear-to-r from-green-50 to-emerald-50 shadow-sm dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <PartyPopper className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">All tools set up!</p>
              <p className="text-sm text-green-700/80 dark:text-green-400/80">
                Your event planning is complete. Keep updating as needed.
              </p>
            </div>
            <Link href={`/events/${eventId}`} className="ml-auto">
              <Button variant="outline" className="border-green-300 hover:bg-green-100">
                View Event
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick tips */}
      {eventId && overallProgress < 100 && (
        <Card className="rounded-2xl border-dashed border-violet-200 dark:border-violet-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            {!toolSetup.timeline && <p>Set up your event timeline to plan the day schedule</p>}
            {!toolSetup.budget && toolSetup.timeline && <p>Add budget items to track expenses</p>}
            {!toolSetup.checklist && toolSetup.budget && <p>Create a checklist to manage tasks</p>}
            {!toolSetup.guestlist && toolSetup.checklist && <p>Add your guestlist and send invites</p>}
          </CardContent>
        </Card>
      )}

      {/* Switch event hint */}
      {eventId && eventsData?.meta && Number(eventsData.meta.total) > 1 && (
        <p className="text-center text-xs text-muted-foreground">
          Tools are linked to your most recent event.{' '}
          <Link href="/events" className="font-medium underline underline-offset-2">
            Switch event
          </Link>
        </p>
      )}
    </div>
  )
}
