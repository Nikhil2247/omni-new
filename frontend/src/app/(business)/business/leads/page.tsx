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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Manage inquiries from event planners and convert them to events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {leads.length} Total Leads
          </Badge>
          {statusCounts['NEW'] > 0 && (
            <Badge className="bg-blue-500 text-white">
              {statusCounts['NEW']} New
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, event type, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-full justify-start md:w-auto">
            {LEAD_STATUSES.map((status) => (
              <TabsTrigger
                key={status.value}
                value={status.value}
                className="relative whitespace-nowrap"
              >
                {status.label}
                {statusCounts[status.value] > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({statusCounts[status.value]})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>
      </Tabs>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <div className="rounded-full bg-muted p-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">No leads found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusFilter !== 'ALL'
                  ? `No ${statusFilter.toLowerCase().replace('_', ' ')} leads at the moment.`
                  : search
                    ? 'Try adjusting your search terms.'
                    : 'New leads will appear here when planners contact you.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => {
            const config = statusConfig[lead.status] || statusConfig['NEW']
            const StatusIcon = config.icon

            return (
              <Card key={lead.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Left Section - Planner Info */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {getPlannerInitials(lead)}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Header */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{getPlannerName(lead)}</h3>
                            <Badge
                              variant="outline"
                              className={`${config.bg} ${config.text} border-0`}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {lead.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {/* Contact Info */}
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {lead.planner?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {lead.planner.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {getTimeAgo(lead.createdAt)}
                            </span>
                          </div>

                          {/* Event Details */}
                          <div className="mt-3 flex flex-wrap gap-3">
                            {lead.eventType && (
                              <Badge variant="secondary" className="font-normal">
                                {lead.eventType}
                              </Badge>
                            )}
                            {lead.eventDate && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(lead.eventDate)}
                              </span>
                            )}
                            {lead.guestCount && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                {lead.guestCount} guests
                              </span>
                            )}
                            {lead.budget && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                                {formatCurrency(lead.budget)}
                              </span>
                            )}
                          </div>

                          {/* Initial Message */}
                          {lead.initialMessage && (
                            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                              "{lead.initialMessage}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-row items-center gap-2 border-t bg-muted/30 p-4 md:flex-col md:justify-center md:border-l md:border-t-0 md:px-6">
                      {lead.status !== 'WON' && lead.status !== 'LOST' && (
                        <Button
                          size="sm"
                          onClick={() => openAcceptDialog(lead)}
                          className="flex-1 md:w-full md:flex-none"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Accept & Create Event
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMessagePlanner(lead)}
                        className="flex-1 md:w-full md:flex-none"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Button>

                      {lead.status === 'NEW' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(lead, 'CONTACTED')}
                          className="flex-1 md:w-full md:flex-none"
                        >
                          Mark Contacted
                        </Button>
                      )}

                      {lead.status === 'WON' && lead.eventId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/business/agreements?eventId=${lead.eventId}`)}
                          className="flex-1 md:w-full md:flex-none"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Event
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
            <div className="space-y-4">
              {/* Lead Summary */}
              <div className="rounded-lg bg-muted/50 p-4">
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
              <div className="space-y-4">
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
