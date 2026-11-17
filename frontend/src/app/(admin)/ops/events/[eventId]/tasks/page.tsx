'use client'

import { useParams } from 'next/navigation'
import { OpsTasksList } from '@/components/features/ops'

export default function OpsEventTasksPage() {
  const params = useParams()
  const eventId = params?.eventId as string

  if (!eventId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Operational Tasks</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Operational Tasks</h1>
        <p className="text-muted-foreground">Manage tasks for event execution</p>
      </div>
      <OpsTasksList activeEventId={eventId} />
    </div>
  )
}
