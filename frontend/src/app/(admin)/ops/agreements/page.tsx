'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useOpsActiveEvents,
  useOpsAgreements,
  useOpsVendors,
  useCreateVendorAgreement,
  useSendAgreement,
  useAcceptAgreement,
  useDeclineAgreement,
  useDeleteVendorAgreement,
} from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  FileText,
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Store,
  ExternalLink,
  Trash2,
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
} from '@/components/dash'

const statusConfig: Record<string, { label: string }> = {
  DRAFT: { label: 'Draft' },
  SENT: { label: 'Sent' },
  ACCEPTED: { label: 'Accepted' },
  DECLINED: { label: 'Declined' },
  COMPLETED: { label: 'Completed' },
  CANCELLED: { label: 'Cancelled' },
}

export default function OpsAgreementsPage() {
  const { data: events, isLoading: eventsLoading } = useOpsActiveEvents()
  const { data: vendors } = useOpsVendors()
  const createAgreement = useCreateVendorAgreement()
  const sendAgreement = useSendAgreement()
  const acceptAgreement = useAcceptAgreement()
  const declineAgreement = useDeclineAgreement()
  const deleteAgreement = useDeleteVendorAgreement()

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch agreements for selected event
  const { data: agreements, isLoading: agreementsLoading } = useOpsAgreements(selectedEventId || '')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  const [newAgreement, setNewAgreement] = useState({
    vendorProfileId: '',
    vendorName: '',
    agreedAmount: '',
    advancePaid: '',
    contractUrl: '',
  })

  const filteredEvents = events?.filter((event) => {
    const matchesSearch = !searchTerm ||
      event.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventType?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  const filteredAgreements = agreements?.filter((agreement) => {
    const matchesStatus = statusFilter === 'all' || agreement.status === statusFilter
    return matchesStatus
  }) || []

  const handleCreateAgreement = () => {
    if (!selectedEventId || !newAgreement.vendorProfileId) return

    const vendor = vendors?.find(v => v.id === newAgreement.vendorProfileId)
    const agreedAmount = Number(newAgreement.agreedAmount) || 0
    const advancePaid = Number(newAgreement.advancePaid) || 0

    // Note: balanceDue is calculated by the backend (agreedAmount - advancePaid)
    // contractUrl is not in the DTO - use contractTerms instead if needed
    createAgreement.mutate(
      {
        activeEventId: selectedEventId,
        vendorProfileId: newAgreement.vendorProfileId,
        vendorName: vendor?.businessName || newAgreement.vendorName || 'Unknown Vendor',
        agreedAmount,
        advancePaid,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false)
          setNewAgreement({
            vendorProfileId: '',
            vendorName: '',
            agreedAmount: '',
            advancePaid: '',
            contractUrl: '',
          })
        },
      }
    )
  }

  const handleSendAgreement = (id: string) => {
    sendAgreement.mutate(id)
  }

  const handleAcceptAgreement = (id: string) => {
    acceptAgreement.mutate(id)
  }

  const openDeclineDialog = (id: string) => {
    setSelectedAgreementId(id)
    setDeclineDialogOpen(true)
  }

  const handleDeclineAgreement = () => {
    if (!selectedAgreementId) return
    declineAgreement.mutate(
      { id: selectedAgreementId, reason: declineReason },
      {
        onSuccess: () => {
          setDeclineDialogOpen(false)
          setSelectedAgreementId(null)
          setDeclineReason('')
        },
      }
    )
  }

  const handleDeleteAgreement = (id: string) => {
    deleteAgreement.mutate(id)
  }

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return '₹0'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const selectedEvent = events?.find(e => e.id === selectedEventId)

  // Stats
  const totalAgreed = agreements?.reduce((sum, a) => sum + (Number(a.agreedAmount) || 0), 0) || 0
  const totalPaid = agreements?.reduce((sum, a) => sum + (Number(a.advancePaid) || 0), 0) || 0
  const acceptedCount = agreements?.filter(a => a.status === 'ACCEPTED').length || 0
  const pendingCount = agreements?.filter(a => a.status === 'SENT' || a.status === 'DRAFT').length || 0

  type EventRow = NonNullable<typeof events>[number]
  type AgreementRow = NonNullable<typeof agreements>[number]

  const eventColumns: DataColumn<EventRow>[] = [
    {
      id: 'event',
      header: 'Event',
      label: 'Event',
      cell: (event) => (
        <div className="flex items-center gap-2">
          <span
            className={`size-1.5 shrink-0 rounded-full ${selectedEventId === event.id ? 'bg-primary' : 'bg-transparent'}`}
          />
          <TwoLineCell
            title={event.clientName || 'Unnamed Client'}
            subtitle={`${event.eventType || 'Event'} · ${event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'No date'}`}
          />
        </div>
      ),
      sortValue: (event) => event.clientName,
      exportValue: (event) => event.clientName,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (event) => <StatusBadge status={event.status || 'Unknown'} />,
      sortValue: (event) => event.status,
      exportValue: (event) => event.status,
    },
  ]

  const agreementColumns: DataColumn<AgreementRow>[] = [
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (a) => (
        <TwoLineCell
          title={a.vendorProfile?.businessName || a.vendorName || 'Unknown Vendor'}
          subtitle={`ID: ${a.id.substring(0, 8)}...`}
        />
      ),
      sortValue: (a) => a.vendorProfile?.businessName || a.vendorName,
      exportValue: (a) => a.vendorProfile?.businessName || a.vendorName,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (a) => (
        <StatusBadge status={a.status || 'DRAFT'}>
          {(statusConfig[a.status || 'DRAFT'] || { label: a.status || 'Draft' }).label}
        </StatusBadge>
      ),
      sortValue: (a) => a.status,
      exportValue: (a) => a.status,
    },
    {
      id: 'agreed',
      header: 'Agreed',
      label: 'Agreed',
      align: 'right',
      cell: (a) => formatCurrency(a.agreedAmount),
      sortValue: (a) => Number(a.agreedAmount) || 0,
    },
    {
      id: 'advance',
      header: 'Advance',
      label: 'Advance',
      align: 'right',
      hideBelow: 'md',
      cell: (a) => <span className="text-success">{formatCurrency(a.advancePaid)}</span>,
      sortValue: (a) => Number(a.advancePaid) || 0,
    },
    {
      id: 'balance',
      header: 'Balance',
      label: 'Balance',
      align: 'right',
      hideBelow: 'md',
      cell: (a) => <span className="text-warning">{formatCurrency(a.balanceDue)}</span>,
      sortValue: (a) => Number(a.balanceDue) || 0,
    },
    {
      id: 'created',
      header: 'Created',
      label: 'Created',
      hideBelow: 'lg',
      cell: (a) => new Date(a.createdAt || '').toLocaleDateString(),
      sortValue: (a) => (a.createdAt ? new Date(a.createdAt) : null),
    },
  ]

  if (eventsLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Vendor Agreements" />
        <DataTable data={[]} columns={eventColumns} rowKey={(e) => e.id} isLoading />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Vendor Agreements"
        actions={
          selectedEventId ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ops/events/${selectedEventId}`}>View Event</Link>
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Agreement
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Left: Events */}
        <DataTable
          data={filteredEvents}
          columns={eventColumns}
          rowKey={(e) => e.id}
          search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search events...' }}
          emptyTitle="No events found"
          emptyIcon={Calendar}
          onRowClick={(event) => setSelectedEventId(event.id)}
          defaultPageSize={10}
          pageSizeOptions={[10, 20, 50]}
          maxHeight="calc(100dvh - 8rem)"
        />

        {/* Right: Agreements */}
        <div className="lg:col-span-2 space-y-3">
          {!selectedEventId ? (
            <div className="rounded-lg border bg-card py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">Select an event</p>
            </div>
          ) : (
            <>
              <StatGrid>
                <StatCard label="Total Agreed" value={formatCurrency(totalAgreed)} icon={DollarSign} />
                <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon={CheckCircle} accent="text-success" />
                <StatCard label="Accepted" value={acceptedCount} icon={FileText} accent="text-success" />
                <StatCard label="Pending" value={pendingCount} icon={Clock} accent="text-warning" />
              </StatGrid>

              <DataTable
                data={filteredAgreements}
                columns={agreementColumns}
                rowKey={(a) => a.id}
                isLoading={agreementsLoading}
                filters={
                  <FilterSelect
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'COMPLETED'].map((v) => ({
                      value: v,
                      label: statusConfig[v].label,
                    }))}
                  />
                }
                exportFilename="vendor-agreements"
                emptyTitle="No agreements found"
                emptyIcon={FileText}
                rowActions={(a) => [
                  {
                    label: 'Send',
                    icon: Send,
                    onClick: () => handleSendAgreement(a.id),
                    disabled: sendAgreement.isPending,
                    visible: a.status === 'DRAFT',
                  },
                  {
                    label: 'Accept',
                    icon: CheckCircle,
                    onClick: () => handleAcceptAgreement(a.id),
                    disabled: acceptAgreement.isPending,
                    visible: a.status === 'SENT',
                  },
                  {
                    label: 'Decline',
                    icon: XCircle,
                    onClick: () => openDeclineDialog(a.id),
                    visible: a.status === 'SENT',
                  },
                  {
                    label: 'View contract',
                    icon: ExternalLink,
                    href: a.contractUrl || undefined,
                    visible: !!a.contractUrl,
                  },
                  { label: 'View vendor', icon: Store, href: `/ops/vendors/${a.vendorProfileId}` },
                  {
                    label: 'Delete agreement',
                    icon: Trash2,
                    danger: true,
                    onClick: () => handleDeleteAgreement(a.id),
                    confirm: {
                      title: 'Delete agreement?',
                      description: 'This agreement will be permanently deleted. This action cannot be undone.',
                    },
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>

      {/* Create Agreement Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Vendor Agreement</DialogTitle>
            <DialogDescription>
              Add a new vendor agreement for {selectedEvent?.clientName}'s event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="vendor">Vendor</Label>
              <Select
                value={newAgreement.vendorProfileId}
                onValueChange={(value) =>
                  setNewAgreement((prev) => ({ ...prev, vendorProfileId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.businessName || 'Unnamed Vendor'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="agreedAmount">Agreed Amount</Label>
                <Input
                  id="agreedAmount"
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={newAgreement.agreedAmount}
                  onChange={(e) =>
                    setNewAgreement((prev) => ({ ...prev, agreedAmount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="advancePaid">Advance Paid</Label>
                <Input
                  id="advancePaid"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newAgreement.advancePaid}
                  onChange={(e) =>
                    setNewAgreement((prev) => ({ ...prev, advancePaid: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contractUrl">Contract URL (Optional)</Label>
              <Input
                id="contractUrl"
                type="url"
                placeholder="https://..."
                value={newAgreement.contractUrl}
                onChange={(e) =>
                  setNewAgreement((prev) => ({ ...prev, contractUrl: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAgreement}
              disabled={createAgreement.isPending || !newAgreement.vendorProfileId || !newAgreement.agreedAmount}
            >
              {createAgreement.isPending ? 'Creating...' : 'Create Agreement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Agreement Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Agreement</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this agreement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="declineReason">Reason</Label>
              <Input
                id="declineReason"
                placeholder="Enter reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclineAgreement}
              disabled={declineAgreement.isPending}
            >
              {declineAgreement.isPending ? 'Declining...' : 'Decline Agreement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
