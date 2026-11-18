'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUmami } from '@/hooks/use-umami'
import { useOpsLeads } from '@/hooks/queries/use-leads'
import { useLeadConversion, useOpsManagers } from '@/hooks/queries/use-ops'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import {
  UserPlus,
  Eye,
  ArrowRightCircle,
  Store,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import {
  PageHeader,
  DataTable,
  FilterSelect,
  StatusBadge,
  UserCell,
  StatCard,
  StatGrid,
  type DataColumn,
} from '@/components/dashboard'
import type { LeadResponse } from '@/lib/api/types/lead.types'

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  CONTACTED: { label: 'Contacted', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  QUALIFIED: { label: 'Qualified', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
  PROPOSAL_SENT: { label: 'Proposal Sent', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20' },
  NEGOTIATING: { label: 'Negotiating', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  WON: { label: 'Won', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  LOST: { label: 'Lost', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
}

const sourceConfig: Record<string, { label: string }> = {
  INQUIRY: { label: 'Website Inquiry' },
  DIRECT_MESSAGE: { label: 'Direct Message' },
  PHONE: { label: 'Phone Call' },
  EXTERNAL: { label: 'External' },
  REFERRAL: { label: 'Referral' },
}

export default function OpsLeadsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: leadsResponse, isLoading, error } = useOpsLeads()
  const { data: managersResponse } = useOpsManagers()
  const convertLead = useLeadConversion()
  const { track } = useUmami()

  useEffect(() => {
    track('ops:leads:page_view', { totalLeads: leadsResponse?.data?.length || 0 })
  }, [leadsResponse, track])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  // Conversion dialog state
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadResponse | null>(null)
  const [conversionData, setConversionData] = useState({
    totalBudget: '',
    opsManagerId: '',
  })

  // Handle the data wrapper structure
  const leads = leadsResponse?.data || []
  const managers = managersResponse?.data || []

  const filteredLeads = leads.filter((lead) => {
    const plannerName = lead.planner
      ? `${lead.planner.firstName || ''} ${lead.planner.lastName || ''}`.toLowerCase()
      : ''
    const matchesSearch = !searchTerm ||
      plannerName.includes(searchTerm.toLowerCase()) ||
      lead.planner?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.eventType?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
    return matchesSearch && matchesStatus && matchesSource
  })

  // Stats calculations
  const newCount = leads.filter(l => l.status === 'NEW').length
  const contactedCount = leads.filter(l => l.status === 'CONTACTED').length
  const qualifiedCount = leads.filter(l => l.status === 'QUALIFIED' || l.status === 'PROPOSAL_SENT').length
  const wonCount = leads.filter(l => l.status === 'WON').length

  const openConvertDialog = (lead: LeadResponse) => {
    setSelectedLead(lead)
    setConversionData({
      totalBudget: lead.budget?.toString() || '',
      opsManagerId: '',
    })
    setConvertDialogOpen(true)
  }

  const handleConvert = () => {
    if (!selectedLead || !user?.id) return

    convertLead.mutate(
      {
        leadId: selectedLead.id,
        opsAdminId: user.id,
        opsManagerId: conversionData.opsManagerId || undefined,
        totalBudget: conversionData.totalBudget ? Number(conversionData.totalBudget) : undefined,
      },
      {
        onSuccess: () => {
          setConvertDialogOpen(false)
          setSelectedLead(null)
          router.push('/ops/events')
        },
      }
    )
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const columns: DataColumn<LeadResponse>[] = [
    {
      id: 'client',
      header: 'Client',
      label: 'Client',
      cell: (lead) => {
        const name = lead.planner
          ? `${lead.planner.firstName || ''} ${lead.planner.lastName || ''}`.trim() || lead.planner.email
          : 'Unknown'
        return <UserCell name={name} subtitle={lead.planner?.email} />
      },
      sortValue: (lead) => lead.planner?.firstName || lead.planner?.email,
      exportValue: (lead) => lead.planner?.email,
    },
    {
      id: 'eventType',
      header: 'Event type',
      label: 'Event type',
      cell: (lead) => lead.eventType || '-',
      sortValue: (lead) => lead.eventType,
    },
    {
      id: 'source',
      header: 'Source',
      label: 'Source',
      hideBelow: 'md',
      cell: (lead) => (sourceConfig[lead.source] || { label: lead.source }).label,
      sortValue: (lead) => lead.source,
    },
    {
      id: 'eventDate',
      header: 'Event date',
      label: 'Event date',
      hideBelow: 'md',
      cell: (lead) => (lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : '-'),
      sortValue: (lead) => (lead.eventDate ? new Date(lead.eventDate) : null),
    },
    {
      id: 'budget',
      header: 'Budget',
      label: 'Budget',
      align: 'right',
      cell: (lead) => formatCurrency(lead.budget),
      sortValue: (lead) => lead.budget,
    },
    {
      id: 'guests',
      header: 'Guests',
      label: 'Guests',
      align: 'right',
      hideBelow: 'lg',
      cell: (lead) => lead.guestCount ?? '-',
      sortValue: (lead) => lead.guestCount,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (lead) => <StatusBadge status={lead.status} />,
      sortValue: (lead) => lead.status,
      exportValue: (lead) => lead.status,
    },
    {
      id: 'received',
      header: 'Received',
      label: 'Received',
      hideBelow: 'lg',
      cell: (lead) => new Date(lead.createdAt).toLocaleDateString(),
      sortValue: (lead) => new Date(lead.createdAt),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Leads" />
        <DataTable data={[]} columns={columns} rowKey={(l) => l.id} isLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="Leads" />
        <Card className="border-destructive">
          <CardContent className="p-3 flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            Failed to load leads. Please try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Leads"
        actions={
          <Button size="sm" asChild>
            <Link href="/ops/events/new">
              <UserPlus className="h-4 w-4 mr-1" />
              Create Direct Booking
            </Link>
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="New Leads" value={newCount} icon={AlertCircle} accent="text-blue-600" />
        <StatCard label="Contacted" value={contactedCount} icon={Phone} accent="text-yellow-600" />
        <StatCard label="Qualified" value={qualifiedCount} icon={MessageSquare} accent="text-purple-600" />
        <StatCard label="Won (Converted)" value={wonCount} icon={CheckCircle} accent="text-green-600" />
      </StatGrid>

      <DataTable
        data={filteredLeads}
        columns={columns}
        rowKey={(l) => l.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search name, email, event type...' }}
        filters={
          <>
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={Object.entries(statusConfig).map(([value, c]) => ({ value, label: c.label }))}
            />
            <FilterSelect
              label="Source"
              value={sourceFilter}
              onChange={setSourceFilter}
              options={Object.entries(sourceConfig).map(([value, c]) => ({ value, label: c.label }))}
            />
          </>
        }
        columnToggle
        exportFilename="leads"
        emptyTitle="No leads found"
        emptyIcon={UserPlus}
        onRowClick={(lead) => router.push(`/ops/leads/${lead.id}`)}
        rowActions={(lead) => [
          { label: 'View details', icon: Eye, href: `/ops/leads/${lead.id}` },
          {
            label: 'View vendor',
            icon: Store,
            href: `/ops/vendors/${lead.vendorProfileId}`,
            visible: !!lead.vendorProfile,
          },
          {
            label: 'Convert to event',
            icon: ArrowRightCircle,
            onClick: () => openConvertDialog(lead),
            visible: lead.status !== 'WON' && lead.status !== 'LOST',
          },
        ]}
      />

      {/* Convert Lead Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Convert Lead to Event</DialogTitle>
            <DialogDescription>
              Convert this lead to an active event. You can assign a manager and set initial details.
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-3">
              {/* Lead Summary */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="font-medium">
                  {selectedLead.planner
                    ? `${selectedLead.planner.firstName || ''} ${selectedLead.planner.lastName || ''}`.trim() ||
                      selectedLead.planner.email
                    : 'Unknown Client'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>Event: {selectedLead.eventType || 'N/A'}</span>
                  <span>
                    Date:{' '}
                    {selectedLead.eventDate
                      ? new Date(selectedLead.eventDate).toLocaleDateString()
                      : 'Not set'}
                  </span>
                  <span>Guests: {selectedLead.guestCount || 'N/A'}</span>
                  <span>Budget: {formatCurrency(selectedLead.budget)}</span>
                </div>
              </div>

              {/* Conversion Fields */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    placeholder="10000"
                    value={conversionData.totalBudget}
                    onChange={(e) =>
                      setConversionData((prev) => ({ ...prev, totalBudget: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opsManagerId">Assign Ops Manager (Optional)</Label>
                  <Select
                    value={conversionData.opsManagerId}
                    onValueChange={(value) =>
                      setConversionData((prev) => ({ ...prev, opsManagerId: value }))
                    }
                  >
                    <SelectTrigger id="opsManagerId">
                      <SelectValue placeholder="Select a manager (can assign later)" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.firstName && manager.lastName
                            ? `${manager.firstName} ${manager.lastName}`
                            : manager.email}
                          {manager.managedEventsCount !== undefined && 
                            ` (${manager.managedEventsCount} events)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to assign a manager later from the event details page.
                  </p>
                </div>
              </div>

              {convertLead.isError && (
                <p className="text-sm text-destructive">
                  Failed to convert lead. Please try again.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertLead.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {convertLead.isPending ? 'Converting...' : 'Convert to Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
