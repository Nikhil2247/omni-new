'use client'

import { useState } from 'react'
import { useOpsKycByVendor } from '@/hooks/queries/use-ops'

export function OpsKycLookup() {
  const [vendorProfileId, setVendorProfileId] = useState('')
  const { data, isLoading, error } = useOpsKycByVendor(vendorProfileId)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <label className="text-sm font-medium">Vendor Profile ID</label>
        <div className="mt-2 flex gap-2">
          <input
            value={vendorProfileId}
            onChange={(event) => setVendorProfileId(event.target.value)}
            placeholder="Enter vendor profile ID"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter a vendor profile ID to fetch the KYC record from the backend.
        </p>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading KYC record...</div>
      )}
      {error && (
        <div className="text-sm text-destructive">Failed to load KYC record.</div>
      )}
      {!isLoading && vendorProfileId && !data && (
        <div className="text-sm text-muted-foreground">No KYC record found.</div>
      )}

      {data && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">KYC Record</p>
              <p className="text-xs text-muted-foreground">Vendor: {data.vendorProfileId}</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
              {data.status}
            </span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Submitted: {data.submittedAt ? new Date(data.submittedAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      )}
    </div>
  )
}
