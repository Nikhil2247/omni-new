'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { OpsInvoicesList } from '@/components/features/ops'

export default function OpsEventInvoicesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const eventId = params?.eventId as string
  const vendorAgreementId = searchParams.get('vendorAgreementId') || undefined

  if (!eventId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Invoices</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Invoices</h1>
        <p className="text-muted-foreground">Manage invoices for vendor agreements</p>
      </div>
      <OpsInvoicesList
        activeEventId={eventId}
        vendorAgreementId={vendorAgreementId}
      />
    </div>
  )
}
