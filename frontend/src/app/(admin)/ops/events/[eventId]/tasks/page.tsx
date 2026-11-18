'use client'

import { PageHeader } from '@/components/dash'
import { useParams } from 'next/navigation'
import { OpsTasksList } from '@/components/features/ops'

export default function OpsEventTasksPage() {
  const params = useParams()
  const eventId = params?.eventId as string

  if (!eventId) {
    return (
      <div className="space-y-3">
        <PageHeader title="Operational Tasks" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Operational Tasks" />
      <OpsTasksList activeEventId={eventId} />
    </div>
  )
}
