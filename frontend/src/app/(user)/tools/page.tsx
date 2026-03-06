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
} from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import { useChecklist } from '@/hooks/queries/use-checklists'
import { useBudget } from '@/hooks/queries/use-budget'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { useTimeline } from '@/hooks/queries/use-timeline'
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

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Planning Tools</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {primaryEvent ? (
                <>
                  Planning for <span className="font-medium text-foreground">{primaryEvent.name}</span>
                </>
              ) : (
                'Follow the flow to plan your perfect event'
              )}
            </p>
            {eventId && (
              <div className="mt-3 flex items-center gap-2">
                <Progress value={overallProgress} className="h-2 w-32" />
                <span className="text-xs font-medium text-muted-foreground">{overallProgress}% complete</span>
              </div>
            )}
          </div>
          <Button asChild className="self-start rounded-full sm:self-auto" variant={primaryEvent ? 'outline' : 'default'}>
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

      {/* No Event Warning */}
      {!eventId && !eventsLoading && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
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

      {/* Tool Flow - Sequential Steps */}
      <div className="relative">
        {/* Flow connector line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-emerald-300 to-pink-300 dark:from-purple-700 dark:via-emerald-700 dark:to-pink-700 hidden sm:block" />

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
                      'flex h-12 w-12 items-center justify-center rounded-full border-4 bg-background z-10',
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
                    'block sm:ml-16 group',
                    isLocked && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <Card
                    className={cn(
                      'transition-all hover:shadow-md',
                      !isLocked && 'hover:border-primary',
                      isSetUp && 'border-green-200 dark:border-green-800'
                    )}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      {/* Mobile step indicator */}
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:hidden',
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
                      <div className={cn('hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', colors.bg)}>
                        <Icon className={cn('h-6 w-6', colors.text)} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold leading-tight group-hover:text-primary">
                            {tool.title}
                          </p>
                          {tool.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {tool.badge}
                            </Badge>
                          )}
                          {isSetUp && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
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
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
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
        <Card>
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
