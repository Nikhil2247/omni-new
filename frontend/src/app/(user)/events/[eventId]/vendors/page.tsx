'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { EventVendorsPanel } from '@/components/features/events/event-vendors-panel'
import { trackDashboard } from '@/lib/analytics/umami'

export default function EventVendorsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-vendors', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <EventVendorsPanel eventId={eventId} />
    </div>
  )
}
