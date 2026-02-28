'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ChecklistPanel } from '@/components/features/events/checklist-panel'
import { trackDashboard } from '@/lib/analytics/umami'

export default function ChecklistPage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-checklist', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <ChecklistPanel eventId={eventId} />
    </div>
  )
}
