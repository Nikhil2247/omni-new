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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  FileText,
  Calendar,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Store,
  ExternalLink,
  Trash2,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' },
  SENT: { label: 'Sent', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-500/10 text-green-700 border-green-500/20' },
  DECLINED: { label: 'Declined', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
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
    if (confirm('Are you sure you want to delete this agreement?')) {
      deleteAgreement.mutate(id)
    }
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

  if (eventsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vendor Agreements</h1>
          <p className="text-muted-foreground">Manage vendor contracts and agreements.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Vendor Agreements</h1>
        <p className="text-muted-foreground">Manage vendor contracts and agreements.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Events List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No events found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedEventId === event.id ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{event.clientName || 'Unnamed Client'}</p>
                        <p className="text-xs text-muted-foreground">{event.eventType || 'Event'}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {event.eventDate
                            ? new Date(event.eventDate).toLocaleDateString()
                            : 'No date'}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.status?.replace(/_/g, ' ') || 'Unknown'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right: Agreements Panel */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedEventId ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Select an Event</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose an event from the list to view or manage vendor agreements.
                </p>
              </CardContent>
            </Card>
          ) : agreementsLoading ? (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Vendor Agreements</CardTitle>
                      <CardDescription>
                        {selectedEvent?.clientName} - {selectedEvent?.eventType}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/ops/events/${selectedEventId}`}>
                        <Button variant="outline" size="sm">
                          View Event
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Agreement
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Agreed</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalAgreed)}</p>
                      </div>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Accepted</p>
                        <p className="text-2xl font-bold text-emerald-600">{acceptedCount}</p>
                      </div>
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                      </div>
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="DECLINED">Declined</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Agreements List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agreements ({filteredAgreements.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredAgreements.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No agreements found.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Agreement
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAgreements.map((agreement) => {
                        const agreementStatus = statusConfig[agreement.status || 'DRAFT'] || {
                          label: agreement.status || 'Draft',
                          color: 'bg-gray-500/10 text-gray-700',
                        }
                        return (
                          <div
                            key={agreement.id}
                            className="flex items-start justify-between p-4 rounded-lg border"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Store className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {agreement.vendorProfile?.businessName || agreement.vendorName || 'Unknown Vendor'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {agreement.id.substring(0, 8)}...
                                  </p>
                                </div>
                                <Badge variant="outline" className={agreementStatus.color}>
                                  {agreementStatus.label}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Agreed Amount</p>
                                  <p className="font-medium">{formatCurrency(agreement.agreedAmount)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Advance Paid</p>
                                  <p className="font-medium text-green-600">
                                    {formatCurrency(agreement.advancePaid)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Balance Due</p>
                                  <p className="font-medium text-orange-600">
                                    {formatCurrency(agreement.balanceDue)}
                                  </p>
                                </div>
                              </div>

                              {agreement.contractUrl && (
                                <a
                                  href={agreement.contractUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Contract
                                </a>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Created: {new Date(agreement.createdAt || '').toLocaleDateString()}</span>
                                {agreement.sentAt && (
                                  <span>Sent: {new Date(agreement.sentAt).toLocaleDateString()}</span>
                                )}
                                {agreement.acceptedAt && (
                                  <span className="text-green-600">
                                    Accepted: {new Date(agreement.acceptedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {agreement.status === 'DRAFT' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendAgreement(agreement.id)}
                                  disabled={sendAgreement.isPending}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send
                                </Button>
                              )}
                              {agreement.status === 'SENT' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptAgreement(agreement.id)}
                                    disabled={acceptAgreement.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openDeclineDialog(agreement.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/ops/vendors/${agreement.vendorProfileId}`}>
                                      View Vendor
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAgreement(agreement.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
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
          <div className="space-y-4">
            <div className="space-y-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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

            <div className="space-y-2">
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
          <div className="space-y-4">
            <div className="space-y-2">
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
