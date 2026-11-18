'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOpsActiveEvents } from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PartyPopper, Plus, Clock, CheckCircle2, AlertTriangle, Eye } from 'lucide-react'
import {
  DataTable,
  FilterSelect,
  StatCard,
  StatGrid,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
  type StatusTone,
} from '@/components/dash'

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'REQUIREMENTS_SET', label: 'Requirements Set' },
  { value: 'VENDOR_SOURCING', label: 'Vendor Sourcing' },
  { value: 'CONTRACTS_LOCKED', label: 'Contracts Locked' },
  { value: 'EXECUTION', label: 'Execution' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const STATUS_TONE: Record<string, StatusTone> = {
  NEW: 'info',
  ASSIGNED: 'purple',
  REQUIREMENTS_SET: 'purple',
  VENDOR_SOURCING: 'warning',
  CONTRACTS_LOCKED: 'warning',
  EXECUTION: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

export function OpsEventsList() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading, error } = useOpsActiveEvents()
  type OpsEvent = NonNullable<typeof data>[number]

  const filteredEvents = useMemo(() => {
    if (!data) return []
    return data.filter((event) => {
      const matchesSearch =
        searchQuery === '' ||
        event.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venueName?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data, searchQuery, statusFilter])

  const statusStats = useMemo(() => {
    if (!data) return {}
    return data.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [data])

  const columns: DataColumn<OpsEvent>[] = [
    {
      id: 'client',
      header: 'Event',
      label: 'Event',
      cell: (e) => <TwoLineCell title={e.clientName} subtitle={e.eventType} />,
      sortValue: (e) => e.clientName,
      exportValue: (e) => `${e.clientName} - ${e.eventType}`,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (e) => <StatusBadge tone={STATUS_TONE[e.status] ?? 'neutral'}>{e.status.replace(/_/g, ' ')}</StatusBadge>,
      sortValue: (e) => e.status,
      exportValue: (e) => e.status,
    },
    {
      id: 'origin',
      header: 'Origin',
      label: 'Origin',
      hideBelow: 'md',
      cell: (e) => <StatusBadge tone="neutral">{e.origin.replace(/_/g, ' ')}</StatusBadge>,
      sortValue: (e) => e.origin,
      exportValue: (e) => e.origin,
    },
    {
      id: 'date',
      header: 'Event date',
      label: 'Event date',
      cell: (e) => (e.eventDate ? new Date(e.eventDate).toLocaleDateString() : 'TBD'),
      sortValue: (e) => (e.eventDate ? new Date(e.eventDate) : null),
    },
    {
      id: 'venue',
      header: 'Venue',
      label: 'Venue',
      hideBelow: 'lg',
      cell: (e) => e.venueName || '-',
      sortValue: (e) => e.venueName,
    },
    {
      id: 'budget',
      header: 'Budget',
      label: 'Budget',
      align: 'right',
      cell: (e) => (e.totalBudget ? `$${Number(e.totalBudget).toLocaleString()}` : '-'),
      sortValue: (e) => (e.totalBudget ? Number(e.totalBudget) : null),
      exportValue: (e) => (e.totalBudget ? Number(e.totalBudget) : ''),
    },
  ]

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-2 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Failed to load events. Please try again later.
        </CardContent>
      </Card>
    )
  }

  const totalEvents = data?.length || 0
  const activeEvents = data?.filter(e => !['COMPLETED', 'CANCELLED'].includes(e.status)).length || 0

  return (
    <div className="space-y-3">
      <StatGrid>
        <StatCard label="Total Events" value={totalEvents} icon={PartyPopper} accent="text-primary" />
        <StatCard label="Active" value={activeEvents} icon={Clock} accent="text-primary" />
        <StatCard label="Completed" value={statusStats['COMPLETED'] || 0} icon={CheckCircle2} accent="text-success" />
        <StatCard label="In Execution" value={statusStats['EXECUTION'] || 0} icon={AlertTriangle} accent="text-info" />
      </StatGrid>

      <DataTable
        data={filteredEvents}
        columns={columns}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search events...' }}
        filters={
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        }
        toolbarRight={
          <Button size="sm" className="h-8" asChild>
            <Link href="/ops/events/new">
              <Plus className="h-4 w-4 mr-1" />
              New Event
            </Link>
          </Button>
        }
        columnToggle
        exportFilename="events"
        emptyTitle="No events found"
        emptyIcon={PartyPopper}
        onRowClick={(e) => router.push(`/ops/events/${e.id}`)}
        rowActions={(e) => [{ label: 'View event', icon: Eye, href: `/ops/events/${e.id}` }]}
      />
    </div>
  )
}
