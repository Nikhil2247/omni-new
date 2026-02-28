'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { TimelinePanel } from '@/components/features/events/timeline-panel'
import { trackDashboard } from '@/lib/analytics/umami'

export default function TimelinePage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-timeline', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <TimelinePanel eventId={eventId} />
    </div>
  )
}
