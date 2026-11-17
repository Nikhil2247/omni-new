'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  Brush,
  BrushBar,
  Eyebrow,
  Ico,
  ICONS,
  Paper,
  PaintedNum,
  SketchButton,
  Stamp,
  skPaper,
  type IcoName,
} from '@/components/sketch'
import { useEvents } from '@/hooks/queries/use-events'
import { useChecklist } from '@/hooks/queries/use-checklists'
import { useBudget } from '@/hooks/queries/use-budget'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { useTimeline } from '@/hooks/queries/use-timeline'
import { usePlannerInsights } from '@/hooks/queries/use-planner-insights'
import { useEInviteByEvent } from '@/hooks/queries/use-einvites'
import { useMemories } from '@/hooks/queries/use-memories'
import { cn } from '@/lib/utils'

// Tool flow order matching the screenshot
const TOOL_FLOW: Array<{
  id: string
  step: number
  title: string
  description: string
  icon: IcoName
  href?: string
  segment?: string
  isRequired?: boolean
  badge?: string
}> = [
  {
    id: 'create-event',
    step: 1,
    title: 'Create Event',
    description: 'Start by creating your event',
    icon: 'calendar',
    href: '/events/new',
    isRequired: true,
  },
  {
    id: 'timeline',
    step: 2,
    title: 'Event Timeline',
    description: 'Plan your day schedule',
    icon: 'clock',
    segment: 'timeline',
  },
  {
    id: 'budget',
    step: 3,
    title: 'Budget & Calculator',
    description: 'Track expenses and spending',
    icon: 'wallet',
    segment: 'budget',
  },
  {
    id: 'checklist',
    step: 4,
    title: 'Event Checklist',
    description: 'Manage tasks and to-dos',
    icon: 'planner',
    segment: 'checklist',
  },
  {
    id: 'e-invite',
    step: 5,
    title: 'E-Invite Create',
    description: 'Design & generate digital invitations',
    icon: 'mail',
    segment: 'einvite',
    badge: 'WhatsApp',
  },
  {
    id: 'guestlist',
    step: 6,
    title: 'Guestlist',
    description: 'Manage your guests',
    icon: 'guests',
    segment: 'guestlist',
  },
  {
    id: 'rsvp',
    step: 7,
    title: 'RSVP',
    description: 'Track guest responses',
    icon: 'heart',
    segment: 'guestlist',
    badge: 'In Guestlist',
  },
  {
    id: 'memories',
    step: 8,
    title: 'Memories',
    description: 'Photos & videos from guests',
    icon: 'gallery',
    segment: 'memories',
  },
]

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
  const { data: einviteData } = useEInviteByEvent(eventId || '')
  const { data: memoriesData } = useMemories(eventId || '')
  const { data: plannerInsightsData, isLoading: plannerInsightsLoading } = usePlannerInsights(eventId || '')

  // Display mode: 'tiles' for quick access grid, 'stepper' for sequential flow
  // Default to tiles when user has an event, stepper when creating
  const [displayMode, setDisplayMode] = useState<'tiles' | 'stepper'>('tiles')

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

    // E-invite progress - sent count vs guests with phone
    const guestsWithPhone = allGuests.filter((g: { phone?: string }) => g.phone).length
    const sentCount = einviteData?.sentCount || 0
    progress['e-invite'] = {
      completed: sentCount,
      total: guestsWithPhone || 1,
      percentage: guestsWithPhone > 0 ? Math.round((sentCount / guestsWithPhone) * 100) : (einviteData ? 100 : 0),
    }

    progress.rsvp = progress.guestlist

    return progress
  }, [eventId, timelineData, budgetData, checklistData, guestlistData, einviteData])

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
    // E-invite exists if there's an einvite record
    const hasEInvite = !!einviteData

    return {
      'create-event': !!eventId,
      timeline: timelineItems > 0,
      budget: budgetItems > 0,
      checklist: checklistTasks > 0,
      'e-invite': hasEInvite,
      guestlist: guests > 0,
      rsvp: guests > 0,
      memories: !!memoriesData,
    }
  }, [eventId, timelineData, budgetData, checklistData, guestlistData, einviteData, memoriesData])

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
        healthTone: 'text-ink-soft',
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
        ? 'text-leaf-deep'
        : healthScore >= 70
        ? 'text-blue'
        : healthScore >= 45
        ? 'text-gold'
        : 'text-rose'

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
        ? 'text-leaf-deep'
        : plannerInsightsData.healthScore >= 70
        ? 'text-blue'
        : plannerInsightsData.healthScore >= 45
        ? 'text-gold'
        : 'text-rose'

    return {
      healthScore: plannerInsightsData.healthScore,
      healthLabel: plannerInsightsData.healthLabel,
      healthTone,
      topActions: plannerInsightsData.topActions,
      risks: plannerInsightsData.risks,
    }
  }, [plannerInsightsData, fallbackPlannerInsights])

  const visibleTools = TOOL_FLOW.filter((tool) => tool.id !== 'create-event')

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <Eyebrow>Smart Planning Command Center</Eyebrow>
          <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
            Planning <Brush>Tools</Brush>
          </h1>
          <p className="text-ink-soft mt-3">
            {primaryEvent ? (
              <>
                Planning for <span className="text-ink font-semibold">{primaryEvent.name}</span>
              </>
            ) : (
              'Follow the flow to plan your perfect event'
            )}
          </p>
          {eventId && (
            <div className="mt-3 flex max-w-sm items-center gap-3">
              <BrushBar value={overallProgress} className="mt-0 flex-1" />
              <span className="text-ink-soft text-xs font-semibold whitespace-nowrap">{overallProgress}% complete</span>
            </div>
          )}
        </div>

        <SketchButton asChild variant={primaryEvent ? 'line' : 'solid'}>
          <Link href={primaryEvent ? '/events' : '/events/new'}>
            <Ico d={ICONS.calendar} className="!size-5" />
            {primaryEvent ? 'My Events' : 'Create Event'}
          </Link>
        </SketchButton>
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Paper className="px-4 py-3">
          <span className="sk-eyebrow">Flow Steps</span>
          <p className="font-display mt-1 text-2xl font-semibold">{TOOL_FLOW.length} total</p>
        </Paper>
        <Paper alt className="px-4 py-3">
          <span className="sk-eyebrow">Tools Set Up</span>
          <p className="font-display mt-1 text-2xl font-semibold">{setUpCount}</p>
          <p className="text-ink-soft text-xs">of {TOOL_FLOW.length} configured</p>
        </Paper>
        <Paper className="px-4 py-3">
          <span className="sk-eyebrow">Remaining</span>
          <p className="font-display mt-1 text-2xl font-semibold">{remainingToolsCount}</p>
          <p className="text-ink-soft text-xs">steps pending completion</p>
        </Paper>
        <Paper alt className="px-4 py-3">
          <span className="sk-eyebrow">Planner Health</span>
          <p className="font-display mt-1 text-2xl font-semibold">
            {eventId ? `${plannerInsights.healthScore}/100` : 'Not started'}
          </p>
        </Paper>
      </div>

      <Paper className="flex items-start gap-3 px-5 py-4">
        <Ico d={ICONS.target} className="!size-8 shrink-0" />
        <div>
          <span className="sk-eyebrow">Next Action</span>
          <p className="mt-1 text-sm font-medium">{nextActionLabel}</p>
        </div>
      </Paper>

      {/* No Event Warning */}
      {!eventId && !eventsLoading && (
        <Paper alt tape className="flex items-start gap-3 px-5 py-4">
          <Ico d={ICONS.star} className="!size-8 shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold">Start with Step 1</p>
            <p className="text-ink-soft mt-0.5 text-sm">
              Create your event first to unlock all planning tools. Each tool is linked to your event.
            </p>
          </div>
        </Paper>
      )}

      {/* Planner Intelligence */}
      {eventId && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Paper className="px-5 py-4">
            <div className="flex items-center gap-2">
              <Ico d={ICONS.chart} className="!size-7" />
              <h2 className="font-display text-lg font-semibold">Event Health Score</h2>
            </div>
            <p className="text-ink-soft mt-1 text-sm">
              Snapshot of planning readiness across timeline, budget, tasks, and RSVP.
            </p>
            {plannerInsightsLoading ? (
              <div className="mt-3">
                <div className="bg-line h-9 w-24 animate-pulse rounded" />
                <div className="bg-line mt-2 h-4 w-20 animate-pulse rounded" />
                <div className="bg-line mt-3 h-3 w-full animate-pulse rounded" />
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-end gap-2">
                  <span className={cn('font-display text-3xl font-semibold', plannerInsights.healthTone)}>
                    {plannerInsights.healthScore}
                  </span>
                  <span className="text-ink-soft pb-1 text-sm">/100</span>
                </div>
                <p className={cn('mt-1 text-sm font-semibold', plannerInsights.healthTone)}>{plannerInsights.healthLabel}</p>
                <BrushBar value={plannerInsights.healthScore} />
              </div>
            )}
          </Paper>

          <Paper alt className="px-5 py-4">
            <div className="flex items-center gap-2">
              <Ico d={ICONS.star} className="!size-7" />
              <h2 className="font-display text-lg font-semibold">Top 3 Actions</h2>
            </div>
            <p className="text-ink-soft mt-1 text-sm">Highest impact moves to improve your plan this week.</p>
            <div className="mt-3 space-y-2.5">
              {plannerInsightsLoading
                ? [1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <div className="bg-line mt-0.5 h-5 w-5 animate-pulse rounded-full" />
                      <div className="bg-line h-4 w-full animate-pulse rounded" />
                    </div>
                  ))
                : plannerInsights.topActions.map((action, index) => (
                    <div key={`${action}-${index}`} className="flex items-start gap-2.5 text-sm">
                      <PaintedNum className="!size-6 shrink-0 text-xs">{index + 1}</PaintedNum>
                      <p className="text-ink-soft">{action}</p>
                    </div>
                  ))}
            </div>
          </Paper>

          <Paper className="px-5 py-4">
            <div className="flex items-center gap-2">
              <Ico d={ICONS.shield} className="!size-7" />
              <h2 className="font-display text-lg font-semibold">Risk Alerts</h2>
            </div>
            <p className="text-ink-soft mt-1 text-sm">Potential blockers that need attention now.</p>
            <div className="mt-3 space-y-2.5">
              {plannerInsightsLoading ? (
                [1, 2].map((item) => (
                  <div key={item} className="border-line rounded-md border-2 border-dashed p-2.5">
                    <div className="bg-line h-3.5 w-32 animate-pulse rounded" />
                    <div className="bg-line mt-2 h-3 w-full animate-pulse rounded" />
                  </div>
                ))
              ) : plannerInsights.risks.length === 0 ? (
                <Stamp>No immediate risks detected. Keep this momentum.</Stamp>
              ) : (
                plannerInsights.risks.map((risk) => (
                  <div key={risk.id} className="border-line border-b-2 border-dashed pb-2.5 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Stamp tone={risk.level === 'high' ? 'late' : 'wait'}>{risk.level}</Stamp>
                      <p className="text-sm font-semibold">{risk.title}</p>
                    </div>
                    <p className="text-ink-soft mt-1 text-xs">{risk.detail}</p>
                  </div>
                ))
              )}
            </div>
          </Paper>
        </div>
      )}

      {/* Planning Tools Section Header with View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">Planning Tools</h2>
        {eventId && (
          <div className="flex items-center gap-2">
            <SketchButton
              size="sm"
              variant={displayMode === 'tiles' ? 'solid' : 'line'}
              aria-pressed={displayMode === 'tiles'}
              onClick={() => setDisplayMode('tiles')}
            >
              Tiles
            </SketchButton>
            <SketchButton
              size="sm"
              variant={displayMode === 'stepper' ? 'solid' : 'line'}
              aria-pressed={displayMode === 'stepper'}
              onClick={() => setDisplayMode('stepper')}
            >
              Steps
            </SketchButton>
          </div>
        )}
      </div>

      {/* Quick Tiles View - Grid Layout */}
      {displayMode === 'tiles' && eventId && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleTools.map((tool) => {
            const href = getToolHref(tool)
            const isSetUp = toolSetup[tool.id as keyof typeof toolSetup]
            const progress = toolProgress[tool.id]
            const showProgress =
              isSetUp && progress && progress.total > 0 && !['e-invite', 'guestlist', 'rsvp', 'memories'].includes(tool.id)

            return (
              <Paper key={tool.id} alt={tool.step % 2 === 1} className="flex h-full flex-col px-5 py-5">
                <div className="flex items-start justify-between gap-2">
                  <Ico d={ICONS[tool.icon]} className="!size-12" />
                  <Stamp tone={isSetUp ? 'ok' : 'wait'}>{isSetUp ? 'Started' : 'Not started'}</Stamp>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-semibold">{tool.title}</h3>
                  {tool.badge && <span className="sk-chip">{tool.badge}</span>}
                </div>
                <p className="text-ink-soft mt-1 line-clamp-2 flex-1 text-sm">{tool.description}</p>
                {showProgress && (
                  <div className="mt-3 flex items-center gap-2">
                    <BrushBar value={progress.percentage} tone="green" className="mt-0 flex-1" />
                    <span className="text-ink-soft text-xs">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                )}
                <SketchButton asChild size="sm" variant={isSetUp ? 'line' : 'solid'} className="mt-4 self-start">
                  <Link href={href}>Open {tool.title}</Link>
                </SketchButton>
              </Paper>
            )
          })}
        </div>
      )}

      {/* Stepper View - Sequential Steps (shown when no event or stepper mode selected) */}
      {(displayMode === 'stepper' || !eventId) && (
        <ol className="space-y-4">
          {TOOL_FLOW.map((tool) => {
            const href = getToolHref(tool)
            const isSetUp = toolSetup[tool.id as keyof typeof toolSetup]
            const progress = toolProgress[tool.id]
            const isLocked = !eventId && tool.id !== 'create-event'
            const showProgress =
              isSetUp && progress && progress.total > 0 && !['e-invite', 'guestlist', 'rsvp', 'memories'].includes(tool.id)

            return (
              <li key={tool.id}>
                <Paper
                  alt={tool.step % 2 === 0}
                  className={cn('flex flex-wrap items-center gap-4 px-5 py-4', isLocked && 'opacity-70')}
                >
                  <PaintedNum tone={isSetUp ? 'green' : 'blue'}>{isSetUp ? '✓' : tool.step}</PaintedNum>
                  <Ico d={ICONS[tool.icon]} className="!size-10 max-sm:hidden" />
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg leading-tight font-semibold">{tool.title}</h3>
                      {tool.badge && <span className="sk-chip">{tool.badge}</span>}
                      <Stamp tone={isSetUp ? 'ok' : 'wait'}>{isSetUp ? 'Started' : 'Not started'}</Stamp>
                    </div>
                    <p className="text-ink-soft mt-0.5 text-sm">{tool.description}</p>
                    {showProgress && (
                      <div className="mt-2 flex items-center gap-2">
                        <BrushBar value={progress.percentage} tone="green" className="mt-0 w-28" />
                        <span className="text-ink-soft text-xs">
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                    )}
                  </div>
                  <SketchButton asChild size="sm" variant={isSetUp ? 'line' : 'solid'}>
                    <Link
                      href={isLocked ? '#' : href}
                      onClick={(e) => {
                        if (isLocked) {
                          e.preventDefault()
                          router.push('/events/new')
                        }
                      }}
                    >
                      {isLocked ? 'Create event first' : `Open ${tool.title}`}
                    </Link>
                  </SketchButton>
                </Paper>
              </li>
            )
          })}
        </ol>
      )}

      {/* Completion celebration */}
      {overallProgress === 100 && eventId && (
        <Paper tape className="flex flex-wrap items-center gap-4 px-5 py-4">
          <Ico d={ICONS.star} className="!size-10" />
          <div>
            <p className="font-display text-lg font-semibold">All tools set up!</p>
            <p className="text-ink-soft text-sm">Your event planning is complete. Keep updating as needed.</p>
          </div>
          <SketchButton asChild variant="line" className="ml-auto">
            <Link href={`/events/${eventId}`}>View Event</Link>
          </SketchButton>
        </Paper>
      )}

      {/* Quick tips */}
      {eventId && overallProgress < 100 && (
        <div className={skPaper({ alt: true, className: 'px-5 py-4' })}>
          <h2 className="font-display text-lg font-semibold">Next Steps</h2>
          <div className="text-ink-soft mt-1 space-y-1 text-sm">
            {!toolSetup.timeline && <p>Set up your event timeline to plan the day schedule</p>}
            {!toolSetup.budget && toolSetup.timeline && <p>Add budget items to track expenses</p>}
            {!toolSetup.checklist && toolSetup.budget && <p>Create a checklist to manage tasks</p>}
            {!toolSetup.guestlist && toolSetup.checklist && <p>Add your guestlist and send invites</p>}
          </div>
        </div>
      )}

      {/* Switch event hint */}
      {eventId && eventsData?.meta && Number(eventsData.meta.total) > 1 && (
        <p className="text-ink-soft text-center text-xs">
          Tools are linked to your most recent event.{' '}
          <Link href="/events" className="text-blue font-semibold underline underline-offset-2">
            Switch event
          </Link>
        </p>
      )}
    </div>
  )
}
