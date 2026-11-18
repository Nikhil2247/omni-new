'use client'

import { useState, useEffect } from 'react'
import { useOpsVendors } from '@/hooks/queries/use-ops'
import { useUmami } from '@/hooks/use-umami'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Store,
  ShieldCheck,
  ShieldX,
  XCircle,
} from 'lucide-react'
import {
  PageHeader,
  DataTable,
  FilterSelect,
  StatusBadge,
  TwoLineCell,
  StatCard,
  StatGrid,
  type DataColumn,
} from '@/components/dashboard'

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  PENDING_VERIFICATION: { label: 'Pending Verification', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
}

export default function OpsVendorsPage() {
  const router = useRouter()
  const { data: vendors, isLoading, error } = useOpsVendors()
  const { track } = useUmami()

  useEffect(() => {
    track('ops:vendors:page_view', { totalVendors: vendors?.length || 0 })
  }, [vendors, track])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch = !searchTerm ||
      vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const activeCount = vendors?.filter(v => v.status === 'ACTIVE').length || 0
  const pendingCount = vendors?.filter(v => v.status === 'PENDING_VERIFICATION').length || 0
  const verifiedCount = vendors?.filter(v => v.verifiedAt).length || 0

  type Vendor = NonNullable<typeof vendors>[number]

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
      cell: (v) => <StatusBadge status={v.status} />,
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Vendors" />
        <DataTable data={[]} columns={columns} rowKey={(v) => v.id} isLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="Vendors" />
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-3 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            Failed to load vendors. Please try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Vendors" />

      <StatGrid>
        <StatCard label="Total Vendors" value={vendors?.length || 0} icon={Store} accent="text-blue-600" />
        <StatCard label="Active" value={activeCount} icon={CheckCircle2} accent="text-green-600" />
        <StatCard label="Pending Verification" value={pendingCount} icon={Clock} accent="text-yellow-600" />
        <StatCard label="Verified" value={verifiedCount} icon={ShieldCheck} accent="text-purple-600" />
      </StatGrid>

      <DataTable
        data={filteredVendors}
        columns={columns}
        rowKey={(v) => v.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search vendors...' }}
        filters={
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(statusConfig).map(([value, c]) => ({ value, label: c.label }))}
          />
        }
        columnToggle
        exportFilename="vendors"
        emptyTitle="No vendors found"
        emptyIcon={Building2}
        onRowClick={(v) => router.push(`/ops/vendors/${v.id}`)}
        rowActions={(v) => [{ label: 'View vendor', icon: Eye, href: `/ops/vendors/${v.id}` }]}
      />
    </div>
  )
}
