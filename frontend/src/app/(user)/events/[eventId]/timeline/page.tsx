'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TimelinePanel } from '@/components/features/events/timeline-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useTimeline } from '@/hooks/queries/use-timeline'
import { Brush, Eyebrow, Paper, SketchButton } from '@/components/sketch'
import { ArrowLeft } from 'lucide-react'

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
    <div className="space-y-5 pb-4">
      {/* Header */}
      <header>
        <SketchButton variant="ghost" size="sm" asChild className="mb-3">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
        </SketchButton>

        <Eyebrow>Event Timeline</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Day <Brush>Schedule</Brush>
        </h1>
        <p className="text-ink-soft mt-2 text-base">
          {event?.name ? (
            <>
              Plan the flow of <span className="text-ink font-semibold">{event.name}</span>
            </>
          ) : (
            'Create your event day schedule'
          )}
        </p>

        {/* Quick Stats */}
        <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          <Paper className="px-4 py-3">
            <p className="sk-eyebrow">Schedule Items</p>
            <p className="font-display text-2xl font-semibold">{itemCount}</p>
          </Paper>
          <Paper alt className="px-4 py-3">
            <p className="sk-eyebrow">Event Date</p>
            <p className="font-display text-2xl font-semibold">
              {eventDate
                ? new Date(eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                : 'Not set'}
            </p>
          </Paper>
          <Paper className="col-span-2 px-4 py-3 sm:col-span-1">
            <p className="sk-eyebrow">Status</p>
            <p className="font-display text-2xl font-semibold">{timeline ? 'Active' : 'Not created'}</p>
          </Paper>
        </div>
      </header>

      {/* Timeline Panel */}
      <TimelinePanel eventId={eventId} defaultDate={eventDate} />
    </div>
  )
}
