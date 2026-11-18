'use client'

import { useEffect, useState } from 'react'
import { useOpsDisputes, useInvestigateDispute, useResolveDispute } from '@/hooks/queries/use-ops'
import { useAuthStore } from '@/store/auth-store'
import { useUmami } from '@/hooks/use-umami'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Eye, PlayCircle, CheckCircle } from 'lucide-react'
import {
  PageHeader,
  DataTable,
  FilterSelect,
  StatusBadge,
  TwoLineCell,
  StatCard,
  StatGrid,
  type DataColumn,
} from '@/components/dash'

const statusConfig: Record<string, { label: string }> = {
  OPEN: { label: 'Open' },
  INVESTIGATING: { label: 'Investigating' },
  RESOLVED: { label: 'Resolved' },
  ESCALATED: { label: 'Escalated' },
  CLOSED: { label: 'Closed' },
}

const typeLabels: Record<string, string> = {
  SERVICE_QUALITY: 'Service Quality',
  PRICING: 'Pricing Issue',
  NO_SHOW: 'No Show',
  HARASSMENT: 'Harassment',
  FRAUD: 'Fraud',
  OTHER: 'Other',
}

export default function OpsDisputesPage() {
  const { user } = useAuthStore()
  const { data: disputes, isLoading, error } = useOpsDisputes()
  const investigateDispute = useInvestigateDispute()
  const resolveDispute = useResolveDispute()
  const { track, ui } = useUmami()

  useEffect(() => {
    track('ops:disputes:page_view', { section: 'disputes_management' })
  }, [])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  const filteredDisputes = disputes?.filter((dispute) => {
    const matchesSearch = !searchTerm ||
      dispute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const handleInvestigate = (id: string) => {
    investigateDispute.mutate(id)
  }

  const handleResolve = () => {
    if (selectedDisputeId && resolution && user?.id) {
      resolveDispute.mutate(
        { id: selectedDisputeId, resolution, resolvedBy: user.id },
        {
          onSuccess: () => {
            setResolveDialogOpen(false)
            setSelectedDisputeId(null)
            setResolution('')
          },
        }
      )
    }
  }

  const openResolveDialog = (id: string) => {
    setSelectedDisputeId(id)
    setResolveDialogOpen(true)
  }

  const openCount = disputes?.filter(d => d.status === 'OPEN').length || 0
  const investigatingCount = disputes?.filter(d => d.status === 'INVESTIGATING').length || 0
  const resolvedCount = disputes?.filter(d => d.status === 'RESOLVED').length || 0

  type Dispute = NonNullable<typeof disputes>[number]

  const columns: DataColumn<Dispute>[] = [
    {
      id: 'type',
      header: 'Dispute',
      label: 'Dispute',
      cell: (d) => (
        <TwoLineCell
          title={typeLabels[d.type || ''] || d.type || 'Unknown'}
          subtitle={<span className="line-clamp-1">{d.description || 'No description provided'}</span>}
        />
      ),
      sortValue: (d) => d.type,
      exportValue: (d) => `${typeLabels[d.type || ''] || d.type || ''}: ${d.description || ''}`,
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
    {
      id: 'resolved',
      header: 'Resolved',
      label: 'Resolved',
      hideBelow: 'md',
      cell: (d) => (d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString() : '-'),
      sortValue: (d) => (d.resolvedAt ? new Date(d.resolvedAt) : null),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Disputes" />
        <DataTable data={[]} columns={columns} rowKey={(d) => d.id} isLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="Disputes" />
        <div className="text-sm text-destructive">Failed to load disputes. Please try again.</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Disputes" />

      <StatGrid className="lg:grid-cols-3">
        <StatCard label="Open" value={openCount} icon={AlertTriangle} accent="text-destructive" />
        <StatCard label="Investigating" value={investigatingCount} icon={Eye} accent="text-warning" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle} accent="text-success" />
      </StatGrid>

      <DataTable
        data={filteredDisputes}
        columns={columns}
        rowKey={(d) => d.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search disputes...' }}
        filters={
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'].map((v) => ({
              value: v,
              label: statusConfig[v].label,
            }))}
          />
        }
        exportFilename="disputes"
        emptyTitle="No disputes found"
        emptyIcon={AlertTriangle}
        rowActions={(d) => [
          { label: 'View dispute', icon: Eye, href: `/ops/disputes/${d.id}` },
          {
            label: 'Investigate',
            icon: PlayCircle,
            onClick: () => handleInvestigate(d.id),
            disabled: investigateDispute.isPending,
            visible: d.status === 'OPEN',
          },
          {
            label: 'Resolve',
            icon: CheckCircle,
            onClick: () => openResolveDialog(d.id),
            visible: d.status === 'INVESTIGATING',
          },
        ]}
      />

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Provide a resolution summary for this dispute.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Enter resolution details..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolution || resolveDispute.isPending}
            >
              {resolveDispute.isPending ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
