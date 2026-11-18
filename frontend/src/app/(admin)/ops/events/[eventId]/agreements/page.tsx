'use client'

import { PageHeader } from '@/components/dash'
import { useParams } from 'next/navigation'
import { OpsAgreementsList } from '@/components/features/ops'

export default function OpsEventAgreementsPage() {
  const params = useParams()
  const eventId = params?.eventId as string

  if (!eventId) {
    return (
      <div className="space-y-3">
        <PageHeader title="Vendor Agreements" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Vendor Agreements" />
      <OpsAgreementsList activeEventId={eventId} />
    </div>
  )
}
