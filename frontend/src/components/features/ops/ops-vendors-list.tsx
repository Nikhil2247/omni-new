'use client'

import { useRouter } from 'next/navigation'
import { useOpsVendors } from '@/hooks/queries/use-ops'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Eye, ShieldCheck, ShieldX, XCircle } from 'lucide-react'
import {
  DataTable,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
} from '@/components/dashboard'

export function OpsVendorsList() {
  const router = useRouter()
  const { data, isLoading, error } = useOpsVendors()
  type Vendor = NonNullable<typeof data>[number]

  const columns: DataColumn<Vendor>[] = [
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (v) => (
        <TwoLineCell title={v.businessName || 'Unnamed Vendor'} subtitle={`ID: ${v.id.slice(0, 8)}...`} />
      ),
      sortValue: (v) => v.businessName,
      exportValue: (v) => v.businessName,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (v) => <StatusBadge status={v.status || 'UNKNOWN'} />,
      sortValue: (v) => v.status,
      exportValue: (v) => v.status,
    },
    {
      id: 'verified',
      header: 'Verification',
      label: 'Verification',
      cell: (v) =>
        v.verifiedAt ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldX className="h-3.5 w-3.5" />
            Not verified
          </span>
        ),
      sortValue: (v) => (v.verifiedAt ? 1 : 0),
      exportValue: (v) => (v.verifiedAt ? 'Verified' : 'Not verified'),
    },
  ]

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          Failed to load vendors. Please try again.
        </CardContent>
      </Card>
    )
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(v) => v.id}
      isLoading={isLoading}
      columnToggle
      exportFilename="vendors"
      emptyTitle="No vendors found"
      emptyIcon={Building2}
      onRowClick={(v) => router.push(`/ops/vendors/${v.id}`)}
      rowActions={(v) => [{ label: 'View vendor', icon: Eye, href: `/ops/vendors/${v.id}` }]}
    />
  )
}
