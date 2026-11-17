'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GuestlistPanel } from '@/components/features/events/guestlist-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { Brush, Eyebrow, Paper, SketchButton } from '@/components/sketch'
import { ArrowLeft } from 'lucide-react'

export default function GuestlistPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: guestlist } = useGuestlist(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-guestlist', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const totalGuests = guestlist?.guests?.length || 0
  const attending = guestlist?.guests?.filter((g: any) => g.rsvpStatus === 'ATTENDING').length || 0
  const pending = guestlist?.guests?.filter((g: any) => g.rsvpStatus === 'PENDING' || g.rsvpStatus === 'MAYBE').length || 0
  const plusOnes = guestlist?.guests?.reduce((sum: number, g: any) => sum + (g.plusOne || 0), 0) || 0

  const stats = [
    { label: 'Total Guests', value: totalGuests },
    { label: 'Attending', value: attending },
    { label: 'Pending', value: pending },
    { label: 'Expected Total', value: attending + plusOnes },
  ]

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <SketchButton variant="ghost" size="sm" asChild className="mb-3">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
        </SketchButton>

        <Eyebrow>Guest Management</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Guestlist &amp; <Brush>RSVP</Brush>
        </h1>
        <p className="text-ink-soft mt-3 max-w-2xl">
          {event?.name ? (
            <>Manage guests for <span className="text-ink font-medium">{event.name}</span></>
          ) : (
            'Track RSVPs and manage your guest list'
          )}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-3xl">
          {stats.map((s) => (
            <Paper key={s.label} className="px-4 py-3">
              <p className="sk-eyebrow">{s.label}</p>
              <p className="font-display mt-1 text-2xl font-semibold">{s.value}</p>
            </Paper>
          ))}
        </div>
      </div>

      {/* Guestlist Panel */}
      <GuestlistPanel eventId={eventId} />
    </div>
  )
}
