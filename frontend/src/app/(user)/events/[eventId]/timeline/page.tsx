'use client'

import { useParams } from 'next/navigation'
import { TimelinePanel } from '@/components/features/events/timeline-panel'

export default function TimelinePage() {
  const params = useParams()
  const eventId = params.eventId as string

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <TimelinePanel eventId={eventId} />
    </div>
  )
}
