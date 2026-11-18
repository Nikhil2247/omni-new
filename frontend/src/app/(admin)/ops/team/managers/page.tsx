'use client'

import Link from 'next/link'
import { useOpsManagers } from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Calendar } from 'lucide-react'
import {
  PageHeader,
  DataTable,
  StatCard,
  StatGrid,
  StatusBadge,
  UserCell,
  type DataColumn,
} from '@/components/dash'

export default function OpsManagersPage() {
  const { data: response, isLoading } = useOpsManagers()

  const members = response?.data || []
  type Member = (typeof members)[number]
  const total = members.reduce((sum, m) => sum + (m.managedEventsCount || 0), 0)

  const columns: DataColumn<Member>[] = [
    {
      id: 'member',
      header: 'Manager',
      label: 'Manager',
      cell: (m) => (
        <UserCell
          name={m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
          subtitle={m.email}
        />
      ),
      sortValue: (m) => m.firstName || m.email,
      exportValue: (m) => m.email,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (m) => <StatusBadge status={m.status} />,
      sortValue: (m) => m.status,
      exportValue: (m) => m.status,
    },
    {
      id: 'count',
      header: 'Events Managed',
      label: 'Events Managed',
      align: 'right',
      cell: (m) => m.managedEventsCount || 0,
      sortValue: (m) => m.managedEventsCount || 0,
    },
    {
      id: 'joined',
      header: 'Joined',
      label: 'Joined',
      cell: (m) => new Date(m.createdAt).toLocaleDateString(),
      sortValue: (m) => new Date(m.createdAt),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title="Operational Managers"
        leading={
          <Button variant="ghost" size="icon" className="size-7" asChild>
            <Link href="/ops/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <StatGrid className="lg:grid-cols-3">
        <StatCard label="Total Managers" value={members.length} icon={Users} accent="text-primary" />
        <StatCard label="Total Events Managed" value={total} icon={Calendar} accent="text-primary" />
        <StatCard
          label="Avg per Manager"
          value={members.length > 0 ? Math.round(total / members.length) : 0}
          icon={Calendar}
          accent="text-success"
        />
      </StatGrid>

      <DataTable
        data={members}
        columns={columns}
        rowKey={(m) => m.id}
        isLoading={isLoading}
        exportFilename="managers"
        emptyTitle="No managers yet"
        emptyIcon={Users}
      />
    </div>
  )
}
