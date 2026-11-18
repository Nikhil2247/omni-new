'use client'

import { PageHeader } from '@/components/dash'
import { useParams, useSearchParams } from 'next/navigation'
import { OpsInvoicesList } from '@/components/features/ops'

export default function OpsEventInvoicesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const eventId = params?.eventId as string
  const vendorAgreementId = searchParams.get('vendorAgreementId') || undefined

  if (!eventId) {
    return (
      <div className="space-y-3">
        <PageHeader title="Invoices" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Invoices" />
      <OpsInvoicesList
        activeEventId={eventId}
        vendorAgreementId={vendorAgreementId}
      />
    </div>
  )
}
