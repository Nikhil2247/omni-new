'use client'

import { useParams } from 'next/navigation'
import { EventVendorsPanel } from '@/components/features/events/event-vendors-panel'

export default function EventVendorsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <EventVendorsPanel eventId={eventId} />
    </div>
  )
}
