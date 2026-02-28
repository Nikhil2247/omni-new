'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { GuestlistPanel } from '@/components/features/events/guestlist-panel'
import { trackDashboard } from '@/lib/analytics/umami'

export default function GuestlistPage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-guestlist', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <GuestlistPanel eventId={eventId} />
    </div>
  )
}
