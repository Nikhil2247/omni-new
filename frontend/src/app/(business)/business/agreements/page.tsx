'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  useBusinessProfile,
  useBusinessAgreements,
  useAcceptAgreement,
  useDeclineAgreement,
} from '@/hooks/queries/use-business'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, DataTable, FilterSelect, StatusBadge, UserCell, StatCard, StatGrid } from '@/components/dash'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Eye,
  Loader2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Send,
} from 'lucide-react'
import type { BusinessAgreement } from '@/lib/api/types/business.types'

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: 'Draft', color: 'bg-muted text-foreground', icon: FileText },
  SENT: { label: 'Sent', color: 'bg-primary/10 text-primary', icon: Send },
  ACCEPTED: { label: 'Accepted', color: 'bg-success/10 text-success', icon: CheckCircle },
  DECLINED: { label: 'Declined', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  CONTRACT_LOCKED: { label: 'Contract Locked', color: 'bg-success/10 text-success', icon: CheckCircle },
  COMPLETED: { label: 'Completed', color: 'bg-primary/10 text-primary', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-muted text-foreground', icon: XCircle },
}

export default function BusinessAgreementsPage() {
  useEffect(() => {
    trackDashboard.sectionView('agreements', 'vendor')
  }, [])

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
    if (amount === undefined || amount === null) return '₹0'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
      <div className="space-y-3">
        <PageHeader title="Vendor Agreements" />
        <Card>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-warning mb-2" />
            <h3 className="text-sm font-semibold">Profile Required</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Please create your business profile first.
            </p>
            <Button size="sm" className="mt-3" onClick={() => window.location.href = '/business/profile'}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Vendor Agreements" />

      <StatGrid>
        <StatCard label="Total Agreements" value={totalAgreements} icon={Handshake} />
        <StatCard label="Active" value={activeAgreements} icon={CheckCircle} accent="text-success" />
        <StatCard label="Awaiting Response" value={pendingAgreements} icon={Clock} accent="text-warning" />
        <StatCard label="Total Value" value={formatCurrency(totalValue)} icon={DollarSign} />
      </StatGrid>

      <DataTable<BusinessAgreement>
        data={filteredAgreements}
        isLoading={agreementsLoading}
        rowKey={(a) => a.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search by client name, event type...' }}
        filters={
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'SENT', label: 'Awaiting Response' },
              { value: 'ACCEPTED', label: 'Accepted' },
              { value: 'DECLINED', label: 'Declined' },
              { value: 'CONTRACT_LOCKED', label: 'Contract Locked' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        }
        exportFilename="agreements"
        columnToggle
        emptyTitle={
          agreements?.length === 0
            ? "You don't have any agreements yet."
            : 'No agreements match your search criteria.'
        }
        emptyIcon={Handshake}
        columns={[
          {
            id: 'client',
            header: 'Client',
            label: 'Client',
            sortValue: (a) => a.activeEvent?.clientName ?? '',
            exportValue: (a) => a.activeEvent?.clientName ?? '',
            cell: (a) => (
              <UserCell name={a.activeEvent?.clientName || 'Event'} subtitle={a.activeEvent?.eventType || undefined} />
            ),
          },
          {
            id: 'date',
            header: 'Event date',
            label: 'Event date',
            hideBelow: 'md',
            sortValue: (a) => (a.activeEvent?.eventDate ? new Date(a.activeEvent.eventDate) : null),
            exportValue: (a) => a.activeEvent?.eventDate ?? '',
            cell: (a) => (
              <span className="text-sm">
                {a.activeEvent?.eventDate ? format(new Date(a.activeEvent.eventDate), 'MMM d, yyyy') : 'TBD'}
              </span>
            ),
          },
          {
            id: 'venue',
            header: 'Venue',
            label: 'Venue',
            hideBelow: 'lg',
            exportValue: (a) => a.activeEvent?.venueName ?? '',
            cell: (a) => <span className="text-sm">{a.activeEvent?.venueName || '-'}</span>,
          },
          {
            id: 'amount',
            header: 'Agreed amount',
            label: 'Agreed amount',
            align: 'right',
            sortValue: (a) => Number(a.agreedAmount) || 0,
            exportValue: (a) => Number(a.agreedAmount) || 0,
            cell: (a) => <span className="text-sm font-medium">{formatCurrency(a.agreedAmount)}</span>,
          },
          {
            id: 'received',
            header: 'Received',
            label: 'Received',
            hideBelow: 'lg',
            sortValue: (a) => new Date(a.createdAt),
            exportValue: (a) => a.createdAt,
            cell: (a) => <span className="text-muted-foreground text-sm">{format(new Date(a.createdAt), 'MMM d, yyyy')}</span>,
          },
          {
            id: 'status',
            header: 'Status',
            label: 'Status',
            sortValue: (a) => a.status,
            exportValue: (a) => statusConfig[a.status]?.label ?? a.status,
            cell: (a) => <StatusBadge status={a.status}>{statusConfig[a.status]?.label}</StatusBadge>,
          },
        ]}
        rowActions={(a) => [
          {
            label: 'Accept',
            icon: ThumbsUp,
            visible: canAcceptOrDecline(a.status),
            onClick: () => {
              setSelectedAgreement(a)
              setShowAcceptConfirm(true)
            },
          },
          {
            label: 'Decline',
            icon: ThumbsDown,
            danger: true,
            visible: canAcceptOrDecline(a.status),
            onClick: () => {
              setSelectedAgreement(a)
              setShowDeclineDialog(true)
            },
          },
          { label: 'Details', icon: Eye, onClick: () => openDetails(a) },
        ]}
      />

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

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
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
                    <p className="font-medium">{selectedAgreement.activeEvent.venueName}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Financial Details</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Agreed Amount</p>
                    <p className="font-semibold text-lg">{formatCurrency(selectedAgreement.agreedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Advance Paid</p>
                    <p className="font-semibold text-lg text-success">{formatCurrency(selectedAgreement.advancePaid)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance Due</p>
                    <p className="font-semibold text-lg text-warning">{formatCurrency(selectedAgreement.balanceDue)}</p>
                  </div>
                </div>
              </div>

              {selectedAgreement.declineReason && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-destructive">Decline Reason</h4>
                  <p className="text-sm bg-destructive/10 p-3 rounded-md">{selectedAgreement.declineReason}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Created: {format(new Date(selectedAgreement.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {selectedAgreement.sentAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>Sent: {format(new Date(selectedAgreement.sentAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedAgreement.acceptedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span>Accepted: {format(new Date(selectedAgreement.acceptedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {selectedAgreement.declinedAt && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span>Declined: {format(new Date(selectedAgreement.declinedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {canAcceptOrDecline(selectedAgreement.status) && (
                <div className="border-t pt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-success hover:bg-success"
                    onClick={() => setShowAcceptConfirm(true)}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Accept Agreement
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
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
              className="bg-success hover:bg-success"
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
          <div className="space-y-3 py-2">
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
