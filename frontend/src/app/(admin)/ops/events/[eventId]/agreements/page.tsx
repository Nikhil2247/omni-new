'use client'

import { useParams } from 'next/navigation'
import { OpsAgreementsList } from '@/components/features/ops'

export default function OpsEventAgreementsPage() {
  const params = useParams()
  const eventId = params?.eventId as string

  if (!eventId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Vendor Agreements</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Vendor Agreements</h1>
        <p className="text-muted-foreground">Manage contracts and agreements with vendors</p>
      </div>
      <OpsAgreementsList activeEventId={eventId} />
    </div>
  )
}
