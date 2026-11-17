'use client'

import Link from 'next/link'
import { useEvent } from '@/hooks/queries/use-events'
import { useChecklist } from '@/hooks/queries/use-checklists'
import { useBudget } from '@/hooks/queries/use-budget'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { useTimeline } from '@/hooks/queries/use-timeline'
import { Skeleton } from '@/components/ui/skeleton'
import { BrushTitle, BrushBar, Chip, Eyebrow, Ico, ICONS, PaintedScene, Paper, PaintedNum, SketchButton, Stamp, skPaper } from '@/components/sketch'
import type { EventStatus } from '@/lib/api/types/event.types'
import type { BudgetItem } from '@/lib/api/types/budget.types'
import { useMemo } from 'react'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const statusTone: Record<EventStatus, 'ok' | 'wait' | 'late'> = {
  PLANNING: 'wait',
  CONFIRMED: 'ok',
  IN_PROGRESS: 'wait',
  COMPLETED: 'ok',
  CANCELLED: 'late',
}

/** A stable number from a string, so an event always gets the same painted scene. */
function hashSeed(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h) % 997
}

// Planning tool flow
const PLANNING_TOOLS = [
  { id: 'timeline', step: 1, title: 'Event Timeline', description: 'Plan your day schedule', icon: ICONS.clock, href: 'timeline' },
  { id: 'budget', step: 2, title: 'Budget & Calculator', description: 'Track expenses and spending', icon: ICONS.wallet, href: 'budget' },
  { id: 'checklist', step: 3, title: 'Event Checklist', description: 'Manage tasks and to-dos', icon: ICONS.planner, href: 'checklist' },
  { id: 'e-invite', step: 4, title: 'E-Invite Create', description: 'Design & generate invitations', icon: ICONS.mail, href: 'einvite', badge: 'WhatsApp' },
  { id: 'guestlist', step: 5, title: 'Guestlist', description: 'Manage your guests', icon: ICONS.guests, href: 'guestlist' },
  { id: 'rsvp', step: 6, title: 'RSVP', description: 'Track guest responses', icon: ICONS.chat, href: 'guestlist', badge: 'In Guestlist' },
  { id: 'memories', step: 7, title: 'Memories', description: 'Photos & videos from guests', icon: ICONS.gallery, href: 'memories' },
]

export function EventDetail({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useEvent(eventId)

  // Fetch tool data for progress tracking
  const { data: checklistData } = useChecklist(eventId)
  const { data: budgetData } = useBudget(eventId)
  const { data: guestlistData } = useGuestlist(eventId)
  const { data: timelineData } = useTimeline(eventId)

  // Calculate tool progress
  const toolProgress = useMemo(() => {
    const progress: Record<string, { completed: number; total: number; percentage: number }> = {}

    // Timeline progress
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

    // Checklist progress
    const allTasks = checklistData?.tasks || []
    const completedTasks = allTasks.filter((t: { isCompleted?: boolean }) => t.isCompleted).length
    progress.checklist = {
      completed: completedTasks,
      total: allTasks.length || 1,
      percentage: allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0,
    }

    // Guestlist/RSVP progress
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
  }, [timelineData, budgetData, checklistData, guestlistData])

  // Tool setup status
  const toolSetup = useMemo(() => {
    const timelineItems = Array.isArray(timelineData?.items) ? timelineData.items.length : 0
    const budgetItems = budgetData?.items?.length || 0
    const checklistTasks = checklistData?.tasks?.length || 0
    const guests = guestlistData?.guests?.length || 0

    return {
      timeline: timelineItems > 0,
      budget: budgetItems > 0,
      checklist: checklistTasks > 0,
      'e-invite': guests > 0,
      guestlist: guests > 0,
      rsvp: guests > 0,
      vendors: false,
      memories: false,
    }
  }, [timelineData, budgetData, checklistData, guestlistData])

  // Overall progress
  const overallProgress = useMemo(() => {
    const setupCount = Object.values(toolSetup).filter(Boolean).length
    return Math.round((setupCount / PLANNING_TOOLS.length) * 100)
  }, [toolSetup])

  const setUpCount = useMemo(() => {
    return Object.values(toolSetup).filter(Boolean).length
  }, [toolSetup])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-rose text-sm">Unable to load event details.</div>
  }

  const statusLabel = (data.status || 'PLANNING').replace(/_/g, ' ')
  const eventDate = data.eventDate || data.date || null
  const daysUntilEvent = eventDate ? Math.ceil((new Date(eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  const checklists = Array.isArray((data as any).checklists) ? (data as any).checklists : []
  const vendors = Array.isArray((data as any).vendors) ? (data as any).vendors : []
  const budgetItems: BudgetItem[] = budgetData?.items ?? []
  const budgetTotal = Number(
    budgetData?.totalBudget ?? (data as any).budget?.totalBudget ?? (data as any).totalBudget ?? 0,
  )
  const budgetSpent = budgetItems
    .filter((item) => item.isPaid)
    .reduce((sum, item) => sum + Number(item.actualCost ?? item.estimatedCost ?? 0), 0)
  const checklistProgress = data.checklistProgress ?? 0
  const eventTypeName = (data as any).eventType?.name

  const seed = hashSeed(data.id)

  return (
    <div className="space-y-8 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Stamp tone={statusTone[data.status || 'PLANNING']}>{statusLabel}</Stamp>
            {daysUntilEvent !== null && daysUntilEvent > 0 && <Stamp tone="wait">{daysUntilEvent} days to go</Stamp>}
            {eventTypeName && <Eyebrow>{eventTypeName}</Eyebrow>}
          </div>

          <h1 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
            <BrushTitle title={data.name || 'Event'} />
          </h1>
          {data.description && <p className="text-ink-soft mt-3">{data.description}</p>}

          <div className="mt-4 flex items-center gap-3">
            <BrushBar value={overallProgress} tone="green" className="w-44" />
            <span className="text-leaf-deep text-xs font-bold">{overallProgress}% complete</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {eventDate && (
              <Paper className="px-4 py-3">
                <p className="sk-eyebrow">Event Date</p>
                <p className="font-display mt-1 text-xl font-semibold">
                  {new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </Paper>
            )}
            <Paper alt className="px-4 py-3">
              <p className="sk-eyebrow">Tools Set Up</p>
              <p className="font-display mt-1 text-xl font-semibold">
                {setUpCount} / {PLANNING_TOOLS.length}
              </p>
            </Paper>
            <Paper className="px-4 py-3">
              <p className="sk-eyebrow">Budget</p>
              <p className="font-display mt-1 text-xl font-semibold">{formatCurrency(budgetTotal)}</p>
            </Paper>
            {data.guestCount && (
              <Paper alt className="px-4 py-3">
                <p className="sk-eyebrow">Guests</p>
                <p className="font-display mt-1 text-xl font-semibold">{data.guestCount}</p>
              </Paper>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-80">
          <div className="sk-paper bg-sky1 relative aspect-[16/9] overflow-hidden p-0" aria-hidden="true">
            <PaintedScene seed={seed} motif={seed % 5} />
          </div>
          <SketchButton asChild variant="line" size="sm" className="self-start">
            <Link href={`/events/${data.id}/settings`}>Event Settings</Link>
          </SketchButton>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Paper className="px-5 py-4">
          <p className="sk-eyebrow">Progress</p>
          <div className="mt-2 flex items-end gap-2">
            <p className="font-display text-3xl font-semibold">{overallProgress}%</p>
            <p className="text-ink-soft pb-1 text-xs">overall</p>
          </div>
          <BrushBar value={overallProgress} className="mt-3" />
        </Paper>

        <Paper alt className="px-5 py-4">
          <p className="sk-eyebrow">Checklist</p>
          <p className="font-display mt-2 text-3xl font-semibold">{checklistProgress}%</p>
          <p className="text-ink-soft mt-2 text-xs">{checklists.length} checklists</p>
        </Paper>

        <Paper className="px-5 py-4">
          <p className="sk-eyebrow">Budget Spent</p>
          <p className="font-display mt-2 text-3xl font-semibold">{formatCurrency(budgetSpent)}</p>
          <p className="text-ink-soft mt-2 text-xs">of {formatCurrency(budgetTotal)}</p>
        </Paper>

        <Paper alt className="px-5 py-4">
          <p className="sk-eyebrow">Vendors</p>
          <p className="font-display mt-2 text-3xl font-semibold">{vendors.length}</p>
          <p className="text-ink-soft mt-2 text-xs">confirmed</p>
        </Paper>
      </div>

      {/* Planning Tools Flow */}
      <div>
        <h2 className="font-display mb-4 text-2xl font-semibold">Planning Tools</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLANNING_TOOLS.map((tool) => {
            const isSetUp = toolSetup[tool.id as keyof typeof toolSetup]
            const progress = toolProgress[tool.id]

            return (
              <Link
                key={tool.id}
                href={`/events/${data.id}/${tool.href}`}
                className={skPaper({
                  alt: tool.step % 2 === 0,
                  className: 'group flex items-start gap-4 px-5 py-4 transition-transform hover:-translate-y-1',
                })}
              >
                <PaintedNum tone={isSetUp ? 'green' : 'blue'}>{tool.step}</PaintedNum>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg leading-tight font-semibold">{tool.title}</p>
                    {tool.badge && <Chip>{tool.badge}</Chip>}
                  </div>
                  <p className="text-ink-soft mt-0.5 text-sm">{tool.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Stamp tone={isSetUp ? 'ok' : 'wait'}>{isSetUp ? 'Set up' : 'Not set up'}</Stamp>
                  </div>

                  {/* Progress bar for set up tools - exclude e-invite, guestlist, rsvp, memories */}
                  {isSetUp &&
                    progress &&
                    progress.total > 0 &&
                    !['e-invite', 'guestlist', 'rsvp', 'memories'].includes(tool.id) && (
                      <div className="mt-3 flex items-center gap-2">
                        <BrushBar value={progress.percentage} tone="green" className="w-28" />
                        <span className="text-ink-soft text-xs">
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                    )}
                </div>
                <Ico d={tool.icon} className="h-9 w-9 shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Completion celebration */}
      {overallProgress === 100 && (
        <Paper tape className="flex items-center gap-4 px-6 py-5">
          <Ico d={ICONS.heart} className="h-10 w-10" />
          <div>
            <p className="font-display text-lg font-semibold">All tools set up!</p>
            <p className="text-ink-soft text-sm">Your event planning is complete. Keep updating as needed.</p>
          </div>
        </Paper>
      )}

      {/* Location info if available */}
      {(data.venueName || (data as any).address?.addressLine1) && (
        <Paper alt className="px-5 py-4">
          <h2 className="font-display flex items-center gap-2 text-xl font-semibold">
            <Ico d={ICONS.venue} className="h-6 w-6" />
            Venue Details
          </h2>
          <div className="mt-2 space-y-1 text-sm">
            {data.venueName && <p className="font-semibold">{data.venueName}</p>}
            {(data as any).address?.addressLine1 && <p className="text-ink-soft">{(data as any).address.addressLine1}</p>}
          </div>
        </Paper>
      )}
    </div>
  )
}
