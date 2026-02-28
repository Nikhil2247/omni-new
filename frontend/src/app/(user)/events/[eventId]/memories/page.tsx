'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MemoriesPanel } from '@/components/features/events/memories-panel'
import { trackDashboard } from '@/lib/analytics/umami'

export default function MemoriesPage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-memories', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <MemoriesPanel eventId={eventId} />
    </div>
  )
}
