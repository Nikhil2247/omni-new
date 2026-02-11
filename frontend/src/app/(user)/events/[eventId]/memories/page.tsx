'use client'

import { useParams } from 'next/navigation'
import { MemoriesPanel } from '@/components/features/events/memories-panel'

export default function MemoriesPage() {
  const params = useParams()
  const eventId = params.eventId as string

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <MemoriesPanel eventId={eventId} />
    </div>
  )
}
