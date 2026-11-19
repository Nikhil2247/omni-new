'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOpsAssistants } from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, CheckSquare } from 'lucide-react'
import {
  PageHeader,
  DataTable,
  KpiCard,
  KpiGrid,
  StatusBadge,
  UserCell,
  type DataColumn,
} from '@/components/dash'

export default function OpsAssistantsPage() {
  const { data: response, isLoading } = useOpsAssistants()

  const [search, setSearch] = useState('')
  const members = response?.data || []
  type Member = (typeof members)[number]
  const total = members.reduce((sum, m) => sum + (m.assignedTasksCount || 0), 0)

  const q = search.trim().toLowerCase()
  const visible = q
    ? members.filter((m) =>
        `${m.firstName ?? ''} ${m.lastName ?? ''} ${m.email ?? ''}`.toLowerCase().includes(q)
      )
    : members

  const columns: DataColumn<Member>[] = [
    {
      id: 'member',
      header: 'Assistant',
      label: 'Assistant',
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
      header: 'Tasks Assigned',
      label: 'Tasks Assigned',
      align: 'right',
      cell: (m) => m.assignedTasksCount || 0,
      sortValue: (m) => m.assignedTasksCount || 0,
    },
    {
      id: 'joined',
      header: 'Joined',
      label: 'Joined',
      cell: (m) => new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      sortValue: (m) => new Date(m.createdAt),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title="Operational Assistants"
        leading={
          <Button variant="ghost" size="icon" className="size-7" asChild>
            <Link href="/ops/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <KpiGrid cols={3}>
        <KpiCard label="Total Assistants" value={members.length} icon={Users} />
        <KpiCard label="Total Tasks Assigned" value={total} icon={CheckSquare} />
        <KpiCard
          label="Avg per Assistant"
          value={members.length > 0 ? Math.round(total / members.length) : 0}
          icon={CheckSquare}
         
        />
      </KpiGrid>

      <DataTable
        data={visible}
        search={{ value: search, onChange: setSearch, placeholder: 'Search by name or email...' }}
        columns={columns}
        rowKey={(m) => m.id}
        isLoading={isLoading}
        exportFilename="assistants"
        emptyTitle="No assistants yet"
        emptyIcon={Users}
      />
    </div>
  )
}
