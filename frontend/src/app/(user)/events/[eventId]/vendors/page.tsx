'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { EventVendorsPanel } from '@/components/features/events/event-vendors-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useEventVendors } from '@/hooks/queries/use-event-vendors'
import { Brush, Eyebrow, Paper, SketchButton } from '@/components/sketch'

export default function EventVendorsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: vendors } = useEventVendors(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-vendors', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const totalVendors = vendors?.length || 0
  const confirmedVendors = vendors?.filter((v: any) => v.status === 'CONFIRMED' || v.status === 'BOOKED').length || 0
  const pendingVendors = vendors?.filter((v: any) => v.status === 'SHORTLISTED' || v.status === 'CONTACTED').length || 0

  return (
    <div className="space-y-6 pb-6">
      <div>
        <SketchButton variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/events/${eventId}`}>Back to event</Link>
        </SketchButton>

        <Eyebrow>Vendor Management</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Event <Brush>Vendors</Brush>
        </h1>
        <p className="text-ink-soft mt-3">
          {event?.name ? (
            <>
              Manage vendors for <span className="text-ink font-semibold">{event.name}</span>
            </>
          ) : (
            'Track and manage your event vendors'
          )}
        </p>

        <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          <Paper className="px-4 py-3">
            <p className="sk-eyebrow">Total Vendors</p>
            <p className="font-display mt-1 text-2xl font-semibold">{totalVendors}</p>
          </Paper>
          <Paper alt className="px-4 py-3">
            <p className="sk-eyebrow">Confirmed</p>
            <p className="font-display text-leaf-deep mt-1 text-2xl font-semibold">{confirmedVendors}</p>
          </Paper>
          <Paper className="col-span-2 px-4 py-3 sm:col-span-1">
            <p className="sk-eyebrow">Pending</p>
            <p className={`font-display mt-1 text-2xl font-semibold ${pendingVendors > 0 ? 'text-gold' : ''}`}>
              {pendingVendors}
            </p>
          </Paper>
        </div>
      </div>

      {/* Vendors Panel */}
      <EventVendorsPanel eventId={eventId} />
    </div>
  )
}
