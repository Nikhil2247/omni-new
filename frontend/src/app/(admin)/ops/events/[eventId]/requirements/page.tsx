'use client'

import { useParams } from 'next/navigation'
import { OpsRequirementsPanel } from '@/components/features/ops'

export default function OpsEventRequirementsPage() {
  const params = useParams()
  const eventId = params?.eventId as string

  if (!eventId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Requirement Sheet</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Requirement Sheet</h1>
        <p className="text-muted-foreground">Manage vendor requirements for this event</p>
      </div>
      <OpsRequirementsPanel activeEventId={eventId} />
    </div>
  )
}
