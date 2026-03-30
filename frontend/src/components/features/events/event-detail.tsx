'use client'

import Link from 'next/link'
import {
  CalendarDays,
  MapPin,
  Users,
  ClipboardList,
  Wallet,
  UsersRound,
  Image,
  CalendarClock,
  Settings2,
  Handshake,
  Sparkles,
  Clock,
  DollarSign,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  PartyPopper,
  Send,
  Mail,
} from 'lucide-react'
import { useEvent } from '@/hooks/queries/use-events'
import { useChecklist } from '@/hooks/queries/use-checklists'
import { useBudget } from '@/hooks/queries/use-budget'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { useTimeline } from '@/hooks/queries/use-timeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { EventStatus } from '@/lib/api/types/event.types'
import type { BudgetItem } from '@/lib/api/types/budget.types'
import { useMemo } from 'react'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const statusStyles: Record<EventStatus, { bg: string; text: string; border: string; icon: string }> = {
  PLANNING: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/20',
    icon: 'bg-blue-100 dark:bg-blue-900/30',
  },
  CONFIRMED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/20',
    icon: 'bg-amber-100 dark:bg-amber-900/30',
  },
  COMPLETED: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-500/20',
    icon: 'bg-slate-100 dark:bg-slate-900/30',
  },
  CANCELLED: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500/20',
    icon: 'bg-red-100 dark:bg-red-900/30',
  },
}

// Planning tool flow
const PLANNING_TOOLS = [
  {
    id: 'timeline',
    step: 1,
    title: 'Event Timeline',
    description: 'Plan your day schedule',
    icon: CalendarClock,
    color: 'sky',
    href: 'timeline',
  },
  {
    id: 'budget',
    step: 2,
    title: 'Budget & Calculator',
    description: 'Track expenses and spending',
    icon: Wallet,
    color: 'amber',
    href: 'budget',
  },
  {
    id: 'checklist',
    step: 3,
    title: 'Event Checklist',
    description: 'Manage tasks and to-dos',
    icon: ClipboardList,
    color: 'emerald',
    href: 'checklist',
  },
  {
    id: 'e-invite',
    step: 4,
    title: 'E-Invite Create',
    description: 'Design & generate invitations',
    icon: Send,
    color: 'green',
    href: 'einvite',
    badge: 'WhatsApp',
  },
  {
    id: 'guestlist',
    step: 5,
    title: 'Guestlist',
    description: 'Manage your guests',
    icon: UsersRound,
    color: 'violet',
    href: 'guestlist',
  },
  {
    id: 'rsvp',
    step: 6,
    title: 'RSVP',
    description: 'Track guest responses',
    icon: Mail,
    color: 'pink',
    href: 'guestlist',
    badge: 'In Guestlist',
  },
  {
    id: 'memories',
    step: 7,
    title: 'Memories',
    description: 'Photos & videos from guests',
    icon: Image,
    color: 'rose',
    href: 'memories',
  },
]

const COLOR_STYLES: Record<string, { bg: string; text: string; border: string; light: string }> = {
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
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    light: 'bg-purple-50 dark:bg-purple-950/20',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    light: 'bg-rose-50 dark:bg-rose-950/20',
  },
}

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
    return <div className="text-sm text-destructive">Unable to load event details.</div>
  }

  const statusLabel = (data.status || 'PLANNING').replace(/_/g, ' ')
  const statusStyle = statusStyles[data.status || 'PLANNING']
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

  return (
    <div className="space-y-6 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-linear-to-br from-violet-50 via-fuchsia-50 to-rose-50 p-6 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-rose-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-rose-300/30 blur-3xl dark:bg-rose-500/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  statusStyle.bg,
                  statusStyle.text,
                  statusStyle.border
                )}
              >
                {statusLabel}
              </Badge>
              {daysUntilEvent !== null && daysUntilEvent > 0 && (
                <Badge variant="outline" className="rounded-full bg-white/80 px-3 py-1 backdrop-blur-sm dark:bg-violet-950/70">
                  <Clock className="mr-1.5 h-3 w-3" />
                  {daysUntilEvent} days to go
                </Badge>
              )}
              {eventTypeName && (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  <Sparkles className="mr-1.5 h-3 w-3" />
                  {eventTypeName}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{data.name || 'Event'}</h1>
            {data.description && (
              <p className="mt-2 text-base text-muted-foreground">{data.description}</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Progress value={overallProgress} className="h-2.5 w-44 bg-white/70 dark:bg-muted/50" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{overallProgress}% complete</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {eventDate && (
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                  <p className="text-[11px] text-muted-foreground">Event Date</p>
                  <p className="font-semibold">
                    {new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                <p className="text-[11px] text-muted-foreground">Tools Set Up</p>
                <p className="font-semibold">{setUpCount} / {PLANNING_TOOLS.length}</p>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                <p className="text-[11px] text-muted-foreground">Budget</p>
                <p className="font-semibold">{formatCurrency(budgetTotal)}</p>
              </div>
              {data.guestCount && (
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                  <p className="text-[11px] text-muted-foreground">Guests</p>
                  <p className="font-semibold">{data.guestCount}</p>
                </div>
              )}
            </div>
          </div>

          <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
            <Link href={`/events/${data.id}/settings`}>
              <Settings2 className="mr-2 h-4 w-4" />
              Event Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
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

        <Card className="rounded-2xl border-emerald-200/70 bg-linear-to-br from-emerald-50 to-white dark:border-emerald-900/60 dark:from-emerald-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Checklist</p>
            <p className="mt-2 text-2xl font-bold">{checklistProgress}%</p>
            <p className="mt-2 text-xs text-muted-foreground">{checklists.length} checklists</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-200/70 bg-linear-to-br from-amber-50 to-white dark:border-amber-900/60 dark:from-amber-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget Spent</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(budgetSpent)}</p>
            <p className="mt-2 text-xs text-muted-foreground">of {formatCurrency(budgetTotal)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-purple-200/70 bg-linear-to-br from-purple-50 to-white dark:border-purple-900/60 dark:from-purple-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vendors</p>
            <p className="mt-2 text-2xl font-bold">{vendors.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">confirmed</p>
          </CardContent>
        </Card>
      </div>

      {/* Planning Tools Flow */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Planning Tools</h2>
        <div className="relative">
          {/* Flow connector line */}
          <div className="absolute bottom-0 left-6 top-0 hidden w-0.5 bg-linear-to-b from-violet-300 via-cyan-300 to-rose-300 dark:from-violet-700 dark:via-cyan-700 dark:to-rose-700 sm:block" />

          <div className="space-y-3">
            {PLANNING_TOOLS.map((tool, index) => {
              const Icon = tool.icon
              const colors = COLOR_STYLES[tool.color]
              const isSetUp = toolSetup[tool.id as keyof typeof toolSetup]
              const progress = toolProgress[tool.id]

              return (
                <div key={tool.id} className="relative">
                  {/* Step connector */}
                  <div className="absolute left-6 hidden -translate-x-1/2 sm:flex flex-col items-center">
                    <div
                      className={cn(
                        'z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 bg-background shadow-sm ring-4 ring-background/80',
                        isSetUp ? 'border-green-500' : colors.border
                      )}
                    >
                      {isSetUp ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className={cn('text-sm font-bold', colors.text)}>{tool.step}</span>
                      )}
                    </div>
                  </div>

                  {/* Tool Card */}
                  <Link href={`/events/${data.id}/${tool.href}`} className="group block sm:ml-14">
                    <Card
                      className={cn(
                        'rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg',
                        isSetUp && 'border-green-200 dark:border-green-800',
                        !isSetUp && colors.light
                      )}
                    >
                      <CardContent className="flex items-center gap-4 p-3">
                        <div className={cn('h-12 w-1 rounded-full hidden sm:block', colors.bg)} />

                        {/* Mobile step indicator */}
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:hidden',
                            isSetUp ? 'bg-green-100 dark:bg-green-900/30' : colors.bg
                          )}
                        >
                          {isSetUp ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className={cn('text-sm font-bold', colors.text)}>{tool.step}</span>
                          )}
                        </div>

                        {/* Icon */}
                        <div
                          className={cn(
                            'hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm sm:flex',
                            colors.bg,
                            colors.border
                          )}
                        >
                          <Icon className={cn('h-5 w-5', colors.text)} />
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

                          {/* Progress bar for set up tools - exclude e-invite, guestlist, rsvp, memories */}
                          {isSetUp && progress && progress.total > 0 &&
                           !['e-invite', 'guestlist', 'rsvp', 'memories'].includes(tool.id) && (
                            <div className="mt-2 flex items-center gap-2">
                              <Progress value={progress.percentage} className="h-1.5 w-24" />
                              <span className="text-xs text-muted-foreground">
                                {progress.completed}/{progress.total}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Completion celebration */}
      {overallProgress === 100 && (
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
          </CardContent>
        </Card>
      )}

      {/* Location info if available */}
      {(data.venueName || (data as any).address?.addressLine1) && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Venue Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.venueName && (
              <p className="font-medium">{data.venueName}</p>
            )}
            {(data as any).address?.addressLine1 && (
              <p className="text-muted-foreground">{(data as any).address.addressLine1}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
