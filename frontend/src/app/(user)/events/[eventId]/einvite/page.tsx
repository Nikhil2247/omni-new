'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { EInvitePanel } from '@/components/features/events/einvite-panel'
import { trackDashboard } from '@/lib/analytics/umami'

export default function EInvitePage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-einvite', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <EInvitePanel eventId={eventId} />
    </div>
  )
}
