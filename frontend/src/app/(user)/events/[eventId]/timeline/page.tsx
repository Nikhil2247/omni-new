'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TimelinePanel } from '@/components/features/events/timeline-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useTimeline } from '@/hooks/queries/use-timeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Calendar, ArrowLeft, ListOrdered } from 'lucide-react'

export default function TimelinePage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: timeline } = useTimeline(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-timeline', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const itemCount = timeline?.items?.length || 0
  const eventDate = event?.date || event?.eventDate

  return (
    <div className="space-y-4 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-50 p-4 shadow-sm dark:border-sky-900/40 dark:from-sky-950/30 dark:via-cyan-950/20 dark:to-teal-950/20 sm:p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-500/20" />

        <div className="relative">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to event
            </Link>
          </Button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-700 shadow-sm dark:bg-sky-950/70 dark:text-sky-200">
                Event Timeline
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight sm:text-lg">
                Day Schedule
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {event?.name ? (
                  <>Plan the flow of <span className="font-medium text-foreground">{event.name}</span></>
                ) : (
                  'Create your event day schedule'
                )}
              </p>

              {/* Quick Stats */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-sky-900/50 dark:bg-sky-950/40">
                  <p className="text-[11px] text-muted-foreground">Schedule Items</p>
                  <p className="font-semibold">{itemCount}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-sky-900/50 dark:bg-sky-950/40">
                  <p className="text-[11px] text-muted-foreground">Event Date</p>
                  <p className="font-semibold">
                    {eventDate
                      ? new Date(eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                      : 'Not set'}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-sky-900/50 dark:bg-sky-950/40 sm:col-span-1">
                  <p className="text-[11px] text-muted-foreground">Status</p>
                  <p className="font-semibold">{timeline ? 'Active' : 'Not created'}</p>
                </div>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg self-start lg:self-auto">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Panel */}
      <TimelinePanel eventId={eventId} defaultDate={eventDate} />
    </div>
  )
}
