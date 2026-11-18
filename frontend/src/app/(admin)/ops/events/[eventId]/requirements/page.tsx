'use client'

import { PageHeader } from '@/components/dashboard'
import { useParams } from 'next/navigation'
import { OpsRequirementsPanel } from '@/components/features/ops'

export default function OpsEventRequirementsPage() {
  const params = useParams()
  const eventId = params?.eventId as string

  if (!eventId) {
    return (
      <div className="space-y-3">
        <PageHeader title="Requirement Sheet" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Requirement Sheet" />
      <OpsRequirementsPanel activeEventId={eventId} />
    </div>
  )
}
