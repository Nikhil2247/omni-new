'use client'

import { useParams } from 'next/navigation'
import { GuestlistPanel } from '@/components/features/events/guestlist-panel'

export default function GuestlistPage() {
  const params = useParams()
  const eventId = params.eventId as string

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <GuestlistPanel eventId={eventId} />
    </div>
  )
}
