'use client'

import { useOpsKycById } from '@/hooks/queries/use-ops'

export function OpsKycDetails({ kycId }: { kycId: string }) {
  const { data, isLoading, error } = useOpsKycById(kycId)

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading KYC record...</div>
  }

  if (error || !data) {
    return <div className="text-sm text-destructive">Failed to load KYC record.</div>
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-2">
      <h2 className="text-lg font-semibold">KYC Record</h2>
      <p className="text-sm">Vendor: {data.vendorProfileId}</p>
      <p className="text-sm">Status: {data.status}</p>
      <p className="text-sm">Submitted: {data.submittedAt ? new Date(data.submittedAt).toLocaleString() : 'N/A'}</p>
    </div>
  )
}
