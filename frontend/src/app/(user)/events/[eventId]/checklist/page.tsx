'use client'

import { useParams } from 'next/navigation'
import { ChecklistPanel } from '@/components/features/events/checklist-panel'

export default function ChecklistPage() {
  const params = useParams()
  const eventId = params.eventId as string

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <ChecklistPanel eventId={eventId} />
    </div>
  )
}
