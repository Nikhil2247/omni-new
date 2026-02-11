'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  useBusinessProfile,
  useBusinessAgreements,
  useAcceptAgreement,
  useDeclineAgreement,
} from '@/hooks/queries/use-business'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Handshake,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Loader2,
  AlertTriangle,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react'
import type { BusinessAgreement } from '@/lib/api/types/business.types'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: XCircle },
  CONTRACT_LOCKED: { label: 'Contract Locked', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircle },
}

export default function BusinessAgreementsPage() {
  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const { data: agreements, isLoading: agreementsLoading } = useBusinessAgreements(profile?.id || '')
  const acceptAgreement = useAcceptAgreement()
  const declineAgreement = useDeclineAgreement()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedAgreement, setSelectedAgreement] = useState<BusinessAgreement | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)

  const filteredAgreements = agreements?.filter(agreement => {
    const matchesSearch = !searchTerm ||
      agreement.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.activeEvent?.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.activeEvent?.eventType?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || agreement.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return '$0'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const openDetails = (agreement: BusinessAgreement) => {
    setSelectedAgreement(agreement)
    setShowDetailsDialog(true)
  }

  const handleAccept = async () => {
    if (!selectedAgreement) return
    await acceptAgreement.mutateAsync(selectedAgreement.id)
    setShowAcceptConfirm(false)
    setShowDetailsDialog(false)
    setSelectedAgreement(null)
  }

  const handleDecline = async () => {
    if (!selectedAgreement) return
    await declineAgreement.mutateAsync({ id: selectedAgreement.id, reason: declineReason })
    setShowDeclineDialog(false)
    setShowDetailsDialog(false)
    setSelectedAgreement(null)
    setDeclineReason('')
  }

  const canAcceptOrDecline = (status: string) => {
    return status === 'SENT'
  }

  // Stats
  const totalAgreements = agreements?.length || 0
  const activeAgreements = agreements?.filter(a => ['ACCEPTED', 'CONTRACT_LOCKED'].includes(a.status)).length || 0
  const pendingAgreements = agreements?.filter(a => a.status === 'SENT').length || 0
  const totalValue = agreements?.reduce((sum, a) => {
    const amount = typeof a.agreedAmount === 'string' ? parseFloat(a.agreedAmount) : (a.agreedAmount || 0)
    return sum + amount
  }, 0) || 0

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vendor Agreements</h1>
          <p className="text-muted-foreground">View your agreements with event organizers</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-2">
              Please create your business profile first.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/business/profile'}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Vendor Agreements</h1>
        <p className="text-muted-foreground">View and respond to agreements from event organizers</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agreements</p>
                <p className="text-2xl font-bold">{totalAgreements}</p>
              </div>
              <Handshake className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeAgreements}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Response</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingAgreements}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name, event type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SENT">Awaiting Response</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
                <SelectItem value="CONTRACT_LOCKED">Contract Locked</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agreements List */}
      {agreementsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAgreements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Handshake className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Agreements Found</h3>
            <p className="text-muted-foreground mt-2">
              {agreements?.length === 0
                ? 'You don\'t have any agreements yet. They will appear here when event organizers send agreements to you.'
                : 'No agreements match your search criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAgreements.map((agreement) => {
            const status = statusConfig[agreement.status] || statusConfig.DRAFT
            const StatusIcon = status.icon
            const showActions = canAcceptOrDecline(agreement.status)

            return (
              <Card key={agreement.id} className={showActions ? 'border-yellow-300 bg-yellow-50/30' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {agreement.activeEvent?.clientName || 'Event'}
                        </h3>
                        <Badge className={status.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                        {showActions && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Action Required
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-muted-foreground">Event Type</p>
                          <p className="font-medium">{agreement.activeEvent?.eventType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Event Date</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {agreement.activeEvent?.eventDate
                              ? format(new Date(agreement.activeEvent.eventDate), 'MMM d, yyyy')
                              : 'TBD'}
                          </p>
                        </div>
                        {agreement.activeEvent?.venueName && (
                          <div>
                            <p className="text-muted-foreground">Venue</p>
                            <p className="font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {agreement.activeEvent.venue}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Agreed Amount</p>
                          <p className="font-medium text-green-600">{formatCurrency(agreement.agreedAmount)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span>Received: {format(new Date(agreement.createdAt), 'MMM d, yyyy')}</span>
                        {agreement.sentAt && (
                          <span>Sent: {format(new Date(agreement.sentAt), 'MMM d, yyyy')}</span>
                        )}
                        {agreement.acceptedAt && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Accepted: {format(new Date(agreement.acceptedAt), 'MMM d')}
                          </Badge>
                        )}
                        {agreement.declinedAt && (
                          <Badge variant="outline" className="text-xs text-red-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            Declined: {format(new Date(agreement.declinedAt), 'MMM d')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {showActions && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => { setSelectedAgreement(agreement); setShowAcceptConfirm(true) }}
                          >
                            <ThumbsUp className="mr-1 h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => { setSelectedAgreement(agreement); setShowDeclineDialog(true) }}
                          >
                            <ThumbsDown className="mr-1 h-4 w-4" />
                            Decline
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openDetails(agreement)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agreement Details</DialogTitle>
            <DialogDescription>
              {selectedAgreement?.activeEvent?.clientName} - {selectedAgreement?.activeEvent?.eventType}
            </DialogDescription>
          </DialogHeader>
          {selectedAgreement && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[selectedAgreement.status]?.color || ''}>
                  {statusConfig[selectedAgreement.status]?.label || selectedAgreement.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Event Date</p>
                  <p className="font-medium">
                    {selectedAgreement.activeEvent?.eventDate
                      ? format(new Date(selectedAgreement.activeEvent.eventDate), 'MMMM d, yyyy')
                      : 'TBD'}
                  </p>
                </div>
                {selectedAgreement.activeEvent?.venueName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{selectedAgreement.activeEvent.venue}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Financial Details</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Agreed Amount</p>
                    <p className="font-semibold text-lg">{formatCurrency(selectedAgreement.agreedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Advance Paid</p>
                    <p className="font-semibold text-lg text-green-600">{formatCurrency(selectedAgreement.advancePaid)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance Due</p>
                    <p className="font-semibold text-lg text-orange-600">{formatCurrency(selectedAgreement.balanceDue)}</p>
                  </div>
                </div>
              </div>

              {selectedAgreement.declineReason && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-red-600">Decline Reason</h4>
                  <p className="text-sm bg-red-50 p-3 rounded-md">{selectedAgreement.declineReason}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Created: {format(new Date(selectedAgreement.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {selectedAgreement.sentAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Sent: {format(new Date(selectedAgreement.sentAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedAgreement.acceptedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Accepted: {format(new Date(selectedAgreement.acceptedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedAgreement.declinedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Declined: {format(new Date(selectedAgreement.declinedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {canAcceptOrDecline(selectedAgreement.status) && (
                <div className="border-t pt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setShowAcceptConfirm(true)}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Accept Agreement
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => setShowDeclineDialog(true)}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Confirmation */}
      <AlertDialog open={showAcceptConfirm} onOpenChange={setShowAcceptConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Agreement?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept this agreement for{' '}
              <strong>{formatCurrency(selectedAgreement?.agreedAmount)}</strong>?
              This will confirm your participation in the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAccept}
              disabled={acceptAgreement.isPending}
            >
              {acceptAgreement.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Accept Agreement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Agreement</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this agreement (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="declineReason">Reason for Declining</Label>
              <Textarea
                id="declineReason"
                placeholder="e.g., Schedule conflict, pricing concerns..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineAgreement.isPending}
            >
              {declineAgreement.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Decline Agreement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
