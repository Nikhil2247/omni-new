'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackDashboard } from '@/lib/analytics/umami'
import { useBusinessLeads, useAcceptLead, useUpdateLeadStatus } from '@/hooks/queries/use-business'
import { VendorFeatureGate } from '@/components/common/vendor-feature-gate'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader, DataTable, FilterSelect, StatusBadge, UserCell, TwoLineCell } from '@/components/dashboard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  Mail,
  Users,
  DollarSign,
  CheckCircle2,
  MessageSquare,
  Search,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Phone,
  ExternalLink,
  Inbox,
} from 'lucide-react'
import type { BusinessLead, LeadStatus } from '@/lib/api/types/business.types'
import { toast } from 'sonner'


const LEAD_STATUSES = [
  { value: 'ALL', label: 'All Leads' },
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { value: 'NEGOTIATING', label: 'Negotiating' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
]

const statusConfig: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  NEW: { bg: 'bg-blue-500/10', text: 'text-blue-700', icon: Inbox },
  CONTACTED: { bg: 'bg-yellow-500/10', text: 'text-yellow-700', icon: MessageSquare },
  QUALIFIED: { bg: 'bg-purple-500/10', text: 'text-purple-700', icon: TrendingUp },
  PROPOSAL_SENT: { bg: 'bg-indigo-500/10', text: 'text-indigo-700', icon: Mail },
  NEGOTIATING: { bg: 'bg-orange-500/10', text: 'text-orange-700', icon: Clock },
  WON: { bg: 'bg-green-500/10', text: 'text-green-700', icon: CheckCircle2 },
  LOST: { bg: 'bg-red-500/10', text: 'text-red-700', icon: AlertCircle },
}

const getPlannerName = (lead: BusinessLead) => {
  const first = lead.planner?.firstName || ''
  const last = lead.planner?.lastName || ''
  return `${first} ${last}`.trim() || lead.planner?.email || 'Unknown Planner'
}

const getPlannerInitials = (lead: BusinessLead) => {
  const name = getPlannerName(lead)
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatCurrency = (amount?: number | null) => {
  if (!amount) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(dateString)
}

function LeadsPageContent() {
  const router = useRouter()
  const { data: leads = [], isLoading, error, refetch } = useBusinessLeads({ page: 1, limit: 100 })

  useEffect(() => {
    trackDashboard.sectionView('leads', 'vendor')
  }, [])
  const acceptLead = useAcceptLead()
  const updateStatus = useUpdateLeadStatus()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [acceptForm, setAcceptForm] = useState({ venueName: '', totalBudget: '' })

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = leads

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((lead) => lead.status === statusFilter)
    }

    // Filter by search
    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter((lead) => {
        const plannerName = getPlannerName(lead).toLowerCase()
        const eventType = lead.eventType?.toLowerCase() || ''
        const email = lead.planner?.email?.toLowerCase() || ''
        return plannerName.includes(query) || eventType.includes(query) || email.includes(query)
      })
    }

    // Sort by createdAt (newest first)
    return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [leads, statusFilter, search])

  // Count leads by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: leads.length }
    leads.forEach((lead) => {
      counts[lead.status] = (counts[lead.status] || 0) + 1
    })
    return counts
  }, [leads])

  const openAcceptDialog = (lead: BusinessLead) => {
    setSelectedLead(lead)
    setAcceptForm({
      venueName: '',
      totalBudget: lead.budget ? String(lead.budget) : '',
    })
    setAcceptDialogOpen(true)
  }

  const handleAccept = async () => {
    if (!selectedLead) return
    try {
      await acceptLead.mutateAsync({
        id: selectedLead.id,
        payload: {
          venueName: acceptForm.venueName || undefined,
          totalBudget: acceptForm.totalBudget ? Number(acceptForm.totalBudget) : undefined,
        },
      })
      toast.success('Lead accepted! Event created successfully.')
      setAcceptDialogOpen(false)
      setSelectedLead(null)
      refetch()
    } catch (err) {
      toast.error('Failed to accept lead')
    }
  }

  const handleUpdateStatus = async (lead: BusinessLead, newStatus: LeadStatus) => {
    try {
      await updateStatus.mutateAsync({ id: lead.id, status: newStatus })
      toast.success(`Lead status updated to ${newStatus}`)
      refetch()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleMessagePlanner = (lead: BusinessLead) => {
    // Navigate to messages with the planner
    router.push(`/business/messages?userId=${lead.plannerId}`)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">Unable to load leads. Please try again.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Leads"
        actions={
          <>
            <Badge variant="secondary" className="text-xs">
              {leads.length} Total Leads
            </Badge>
            {statusCounts['NEW'] > 0 && (
              <Badge className="bg-blue-500 text-xs text-white">{statusCounts['NEW']} New</Badge>
            )}
          </>
        }
      />

      <DataTable<BusinessLead>
        data={filteredLeads}
        rowKey={(l) => l.id}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search by name, event type, or email...',
        }}
        filters={
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            allValue="ALL"
            allLabel={`All (${statusCounts['ALL'] ?? 0})`}
            options={LEAD_STATUSES.filter((s) => s.value !== 'ALL').map((s) => ({
              value: s.value,
              label: `${s.label} (${statusCounts[s.value] ?? 0})`,
            }))}
          />
        }
        exportFilename="leads"
        columnToggle
        emptyTitle="No leads found"
        emptyIcon={Inbox}
        columns={[
          {
            id: 'planner',
            header: 'Planner',
            label: 'Planner',
            sortValue: (l) => getPlannerName(l),
            exportValue: (l) => getPlannerName(l),
            cell: (l) => <UserCell name={getPlannerName(l)} subtitle={l.planner?.email} />,
          },
          {
            id: 'eventType',
            header: 'Event',
            label: 'Event',
            sortValue: (l) => l.eventType ?? '',
            exportValue: (l) => l.eventType ?? '',
            cell: (l) => <TwoLineCell title={l.eventType || '-'} subtitle={formatDate(l.eventDate)} />,
          },
          {
            id: 'guests',
            header: 'Guests',
            label: 'Guests',
            hideBelow: 'md',
            sortValue: (l) => l.guestCount ?? 0,
            exportValue: (l) => l.guestCount ?? '',
            cell: (l) => <span className="text-sm">{l.guestCount ?? '-'}</span>,
          },
          {
            id: 'budget',
            header: 'Budget',
            label: 'Budget',
            hideBelow: 'md',
            sortValue: (l) => l.budget ?? 0,
            exportValue: (l) => l.budget ?? '',
            cell: (l) => <span className="text-sm">{formatCurrency(l.budget) ?? '-'}</span>,
          },
          {
            id: 'status',
            header: 'Status',
            label: 'Status',
            sortValue: (l) => l.status,
            exportValue: (l) => l.status,
            cell: (l) => <StatusBadge status={l.status} />,
          },
          {
            id: 'received',
            header: 'Received',
            label: 'Received',
            hideBelow: 'lg',
            sortValue: (l) => new Date(l.createdAt),
            exportValue: (l) => l.createdAt,
            cell: (l) => <span className="text-muted-foreground text-sm">{getTimeAgo(l.createdAt)}</span>,
          },
        ]}
        rowActions={(l) => [
          {
            label: 'Accept & create event',
            icon: CheckCircle2,
            onClick: () => openAcceptDialog(l),
            visible: l.status !== 'WON' && l.status !== 'LOST',
          },
          {
            label: 'Mark contacted',
            icon: Phone,
            onClick: () => handleUpdateStatus(l, 'CONTACTED'),
            visible: l.status === 'NEW',
          },
          { label: 'Message', icon: MessageSquare, onClick: () => handleMessagePlanner(l) },
          {
            label: 'View event',
            icon: ExternalLink,
            onClick: () => router.push(`/business/agreements?eventId=${l.eventId}`),
            visible: l.status === 'WON' && !!l.eventId,
          },
        ]}
      />

      {/* Accept Lead Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Accept Lead & Create Event</DialogTitle>
            <DialogDescription>
              Accepting this lead will create a new event and notify the planner.
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-3">
              {/* Lead Summary */}
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {getPlannerInitials(selectedLead)}
                  </div>
                  <div>
                    <p className="font-medium">{getPlannerName(selectedLead)}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLead.eventType || 'Event'} • {formatDate(selectedLead.eventDate)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="venueName">Venue Name (Optional)</Label>
                  <Input
                    id="venueName"
                    value={acceptForm.venueName}
                    onChange={(e) => setAcceptForm((prev) => ({ ...prev, venueName: e.target.value }))}
                    placeholder="Enter venue name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget (Optional)</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    value={acceptForm.totalBudget}
                    onChange={(e) => setAcceptForm((prev) => ({ ...prev, totalBudget: e.target.value }))}
                    placeholder="Enter budget amount"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={acceptLead.isPending}>
              {acceptLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BusinessLeadsPage() {
  return (
    <VendorFeatureGate
      requiredTier="STARTER"
      upgradeTitle="Unlock Lead Management"
      upgradeDescription="Upgrade to Starter or higher to access your leads, track inquiries from event planners, and convert them into events. Manage your sales pipeline efficiently."
    >
      <LeadsPageContent />
    </VendorFeatureGate>
  )
}
