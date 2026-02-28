'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { EventDetail } from '@/components/features/events/event-detail'
import { trackEventPlanning } from '@/lib/analytics/umami'

export default function EventPage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackEventPlanning.view(eventId)
  }, [eventId])

  if (!eventId) {
    return null
  }

  return <EventDetail eventId={eventId} />
}
