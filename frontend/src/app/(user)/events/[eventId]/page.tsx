'use client'

import { useParams } from 'next/navigation'
import { EventDetail } from '@/components/features/events/event-detail'

export default function EventPage() {
  const params = useParams()
  const eventId = params.eventId as string

  if (!eventId) {
    return null
  }

  return <EventDetail eventId={eventId} />
}
