'use client'

import { useRouter } from 'next/navigation'
import { useOpsSupportTickets } from '@/hooks/queries/use-ops'
import { Eye, LifeBuoy } from 'lucide-react'
import {
  DataTable,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
} from '@/components/dash'

export function OpsSupportList() {
  const router = useRouter()
  const { data, isLoading, error } = useOpsSupportTickets()
  type Ticket = NonNullable<typeof data>[number]

  const columns: DataColumn<Ticket>[] = [
    {
      id: 'subject',
      header: 'Ticket',
      label: 'Ticket',
      cell: (t) => <TwoLineCell title={t.subject || `Ticket ${t.id}`} subtitle={`ID: ${String(t.id).slice(0, 8)}`} />,
      sortValue: (t) => t.subject,
      exportValue: (t) => t.subject,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (t) => <StatusBadge status={t.status || 'OPEN'} />,
      sortValue: (t) => t.status,
      exportValue: (t) => t.status || 'OPEN',
    },
    {
      id: 'created',
      header: 'Created',
      label: 'Created',
      cell: (t) => (t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'),
      sortValue: (t) => (t.createdAt ? new Date(t.createdAt) : null),
    },
  ]

  if (error) {
    return <div className="text-sm text-destructive">Failed to load support tickets.</div>
  }

  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(t) => String(t.id)}
      isLoading={isLoading}
      exportFilename="support-tickets"
      emptyTitle="No support tickets found"
      emptyIcon={LifeBuoy}
      onRowClick={(t) => router.push(`/ops/support/${t.id}`)}
      rowActions={(t) => [{ label: 'View ticket', icon: Eye, href: `/ops/support/${t.id}` }]}
    />
  )
}
