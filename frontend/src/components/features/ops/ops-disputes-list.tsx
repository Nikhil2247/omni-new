'use client'

import { useRouter } from 'next/navigation'
import { useOpsDisputes } from '@/hooks/queries/use-ops'
import { AlertTriangle, Eye } from 'lucide-react'
import {
  DataTable,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
} from '@/components/dash'

export function OpsDisputesList() {
  const router = useRouter()
  const { data, isLoading, error } = useOpsDisputes()
  type Dispute = NonNullable<typeof data>[number]

  const columns: DataColumn<Dispute>[] = [
    {
      id: 'dispute',
      header: 'Dispute',
      label: 'Dispute',
      cell: (d) => (
        <TwoLineCell
          title={d.description?.substring(0, 60) || `Dispute ${d.id.substring(0, 8)}`}
          subtitle={`ID: ${d.id.substring(0, 8)}`}
        />
      ),
      sortValue: (d) => d.description,
      exportValue: (d) => d.description,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (d) => <StatusBadge status={d.status} />,
      sortValue: (d) => d.status,
      exportValue: (d) => d.status,
    },
    {
      id: 'created',
      header: 'Created',
      label: 'Created',
      cell: (d) => (d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'),
      sortValue: (d) => (d.createdAt ? new Date(d.createdAt) : null),
    },
  ]

  if (error) {
    return <div className="text-sm text-destructive">Failed to load disputes. Please try again.</div>
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(d) => d.id}
      isLoading={isLoading}
      exportFilename="disputes"
      emptyTitle="No disputes found"
      emptyIcon={AlertTriangle}
      onRowClick={(d) => router.push(`/ops/disputes/${d.id}`)}
      rowActions={(d) => [{ label: 'View dispute', icon: Eye, href: `/ops/disputes/${d.id}` }]}
    />
  )
}
