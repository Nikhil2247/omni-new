'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOpsLeads } from '@/hooks/queries/use-leads'
import { useLeadConversion, useOpsManagers } from '@/hooks/queries/use-ops'
import { useAuthStore } from '@/store/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  UserPlus,
  Search,
  MoreVertical,
  Eye,
  ArrowRightCircle,
  Calendar,
  DollarSign,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage incoming leads and convert to events.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error Loading Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Failed to load leads. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage incoming leads and convert to events.</p>
        </div>
        <Link href="/ops/events/new">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Direct Booking
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold text-blue-600">{newCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold text-yellow-600">{contactedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Phone className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold text-purple-600">{qualifiedCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Won (Converted)</p>
                <p className="text-2xl font-bold text-green-600">{wonCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, event type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="QUALIFIED">Qualified</SelectItem>
            <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
            <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
            <SelectItem value="WON">Won</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="INQUIRY">Website Inquiry</SelectItem>
            <SelectItem value="DIRECT_MESSAGE">Direct Message</SelectItem>
            <SelectItem value="PHONE">Phone Call</SelectItem>
            <SelectItem value="EXTERNAL">External</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <UserPlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No leads found.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Leads will appear here when customers submit inquiries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const status = statusConfig[lead.status] || { label: lead.status, color: 'bg-gray-500/10 text-gray-700' }
            const source = sourceConfig[lead.source] || { label: lead.source }
            const plannerName = lead.planner
              ? `${lead.planner.firstName || ''} ${lead.planner.lastName || ''}`.trim() || lead.planner.email
              : 'Unknown'

            return (
              <Card key={lead.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/ops/leads/${lead.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {plannerName}
                        </Link>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {source.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{lead.planner?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {lead.eventDate
                              ? new Date(lead.eventDate).toLocaleDateString()
                              : 'No date set'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(lead.budget)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{lead.guestCount ? `${lead.guestCount} guests` : 'N/A'}</span>
                        </div>
                      </div>

                      {lead.eventType && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Event Type: </span>
                          <span className="font-medium">{lead.eventType}</span>
                        </p>
                      )}

                      {lead.initialMessage && (
                        <p className="text-sm text-muted-foreground line-clamp-2 italic">
                          "{lead.initialMessage}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Received: {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                        {lead.respondedAt && (
                          <span className="text-green-600">
                            Responded: {new Date(lead.respondedAt).toLocaleDateString()}
                          </span>
                        )}
                        {lead.convertedAt && (
                          <span className="text-purple-600">
                            Converted: {new Date(lead.convertedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {lead.status !== 'WON' && lead.status !== 'LOST' && (
                        <Button
                          size="sm"
                          onClick={() => openConvertDialog(lead)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ArrowRightCircle className="h-4 w-4 mr-1" />
                          Convert
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/ops/leads/${lead.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {lead.vendorProfile && (
                            <DropdownMenuItem asChild>
                              <Link href={`/ops/vendors/${lead.vendorProfileId}`}>
                                View Vendor
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {lead.status !== 'WON' && lead.status !== 'LOST' && (
                            <DropdownMenuItem onClick={() => openConvertDialog(lead)}>
                              <ArrowRightCircle className="h-4 w-4 mr-2" />
                              Convert to Event
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
            <div className="space-y-4">
              {/* Lead Summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
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
              <div className="space-y-4">
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
