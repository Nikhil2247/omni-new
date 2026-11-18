'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle,
  Clock,
  Eye,
  ExternalLink,
  FileCheck,
  FileText,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  useAdminClaims,
  useAdminClaimCounts,
  useApproveClaim,
  useRejectClaim,
} from '@/hooks/queries/use-admin-claims'
import { trackDashboard } from '@/lib/analytics/umami'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PageHeader,
  DataTable,
  StatusBadge,
  TwoLineCell,
  UserCell,
  StatCard,
  StatGrid,
  type DataColumn,
} from '@/components/dashboard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdminClaimResponse,
  ClaimStatusCounts,
} from '@/lib/api/types/admin-claim.types'
import type { ClaimStatus, ClaimVerificationMethod } from '@/lib/api/types/vendor-claim.types'
import {
  CLAIM_STATUS_LABELS,
  VERIFICATION_METHOD_LABELS,
} from '@/lib/api/types/vendor-claim.types'

type StatusFilter = 'all' | ClaimStatus

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminClaimsPage() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 20

  // Selected claim for details modal
  const [selectedClaim, setSelectedClaim] = useState<AdminClaimResponse | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Approve confirmation modal state
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [approveClaim, setApproveClaim] = useState<AdminClaimResponse | null>(null)

  // Reject modal state
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectClaim, setRejectClaim] = useState<AdminClaimResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectInternalNotes, setRejectInternalNotes] = useState('')

  const approveMutation = useApproveClaim()
  const rejectMutation = useRejectClaim()
  const { data: counts, refetch: refetchCounts } = useAdminClaimCounts()

  useEffect(() => {
    trackDashboard.sectionView('admin-claims', 'ops')
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  const params = useMemo(
    () => ({
      status: activeTab === 'all' ? undefined : activeTab,
      limit,
      offset: (currentPage - 1) * limit,
    }),
    [activeTab, currentPage]
  )

  const { data, isLoading, refetch } = useAdminClaims(params)

  const handleViewDetails = (claim: AdminClaimResponse) => {
    setSelectedClaim(claim)
    setIsDetailsOpen(true)
  }

  const handleOpenApprove = (claim: AdminClaimResponse) => {
    setApproveClaim(claim)
    setIsApproveOpen(true)
  }

  const handleApproveSubmit = () => {
    if (!approveClaim) return

    approveMutation.mutate(
      { id: approveClaim.id },
      {
        onSuccess: () => {
          setIsApproveOpen(false)
          setIsDetailsOpen(false)
          setApproveClaim(null)
          refetchCounts()
        },
      }
    )
  }

  const handleOpenReject = (claim: AdminClaimResponse) => {
    setRejectClaim(claim)
    setRejectReason('')
    setRejectInternalNotes('')
    setIsRejectOpen(true)
  }

  const handleRejectSubmit = () => {
    if (!rejectClaim || !rejectReason.trim()) return

    rejectMutation.mutate(
      {
        id: rejectClaim.id,
        payload: {
          reason: rejectReason.trim(),
          internalNotes: rejectInternalNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsRejectOpen(false)
          setIsDetailsOpen(false)
          setRejectClaim(null)
          setRejectReason('')
          setRejectInternalNotes('')
          refetchCounts()
        },
      }
    )
  }

  const totalClaims = data?.total ?? 0

  const claimantName = (claim: AdminClaimResponse) =>
    claim.user?.firstName || claim.user?.lastName
      ? `${claim.user?.firstName ?? ''} ${claim.user?.lastName ?? ''}`.trim()
      : claim.user?.email || 'Unknown'

  const columns: DataColumn<AdminClaimResponse>[] = [
    {
      id: 'business',
      header: 'Business Name',
      label: 'Business Name',
      cell: (claim) => (
        <TwoLineCell
          title={claim.vendorProfile?.businessName || 'Unknown'}
          subtitle={claim.vendorProfile?.slug ? `/${claim.vendorProfile.slug}` : undefined}
        />
      ),
      sortValue: (claim) => claim.vendorProfile?.businessName,
      exportValue: (claim) => claim.vendorProfile?.businessName,
    },
    {
      id: 'claimant',
      header: 'Claimant',
      label: 'Claimant',
      cell: (claim) => (
        <UserCell
          name={claimantName(claim)}
          subtitle={claim.user?.firstName ? claim.user?.email : undefined}
        />
      ),
      sortValue: (claim) => claimantName(claim),
      exportValue: (claim) => claim.user?.email,
    },
    {
      id: 'method',
      header: 'Method',
      label: 'Method',
      hideBelow: 'md',
      cell: (claim) => <StatusBadge tone="neutral">{VERIFICATION_METHOD_LABELS[claim.verificationMethod]}</StatusBadge>,
      sortValue: (claim) => claim.verificationMethod,
      exportValue: (claim) => VERIFICATION_METHOD_LABELS[claim.verificationMethod],
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (claim) => (
        <StatusBadge status={claim.status}>{CLAIM_STATUS_LABELS[claim.status]}</StatusBadge>
      ),
      sortValue: (claim) => claim.status,
      exportValue: (claim) => CLAIM_STATUS_LABELS[claim.status],
    },
    {
      id: 'created',
      header: 'Created',
      label: 'Created',
      hideBelow: 'md',
      cell: (claim) => <span className="text-muted-foreground">{formatDate(claim.createdAt)}</span>,
      sortValue: (claim) => new Date(claim.createdAt),
      exportValue: (claim) => formatDate(claim.createdAt),
    },
  ]

  const claimsPending = approveMutation.isPending || rejectMutation.isPending

  return (
    <div className="space-y-3">
      <PageHeader
        title="Vendor Claims"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <StatGrid className="md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Pending" value={counts?.pending ?? 0} icon={Clock} accent="text-gray-600" />
        <StatCard label="Verification Sent" value={counts?.verificationSent ?? 0} icon={FileCheck} accent="text-yellow-600" />
        <StatCard label="Verified" value={counts?.verified ?? 0} icon={ShieldCheck} accent="text-blue-600" />
        <StatCard label="Approved" value={counts?.approved ?? 0} icon={CheckCircle} accent="text-green-600" />
        <StatCard label="Rejected" value={counts?.rejected ?? 0} icon={XCircle} accent="text-red-600" />
        <StatCard label="Expired" value={counts?.expired ?? 0} icon={Clock} accent="text-gray-500" />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING" className="relative">
            Pending
            {(counts?.pending ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-500 px-1 text-[10px] font-medium text-white">
                {counts?.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="VERIFIED" className="relative">
            Verified
            {(counts?.verified ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-medium text-white">
                {counts?.verified}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-2">
          <DataTable
            data={data?.claims ?? []}
            columns={columns}
            rowKey={(claim) => claim.id}
            isLoading={isLoading}
            exportFilename="vendor-claims"
            emptyTitle="No claims found"
            emptyIcon={FileCheck}
            serverPagination={{
              page: currentPage,
              pageSize: limit,
              total: totalClaims,
              onPageChange: setCurrentPage,
            }}
            rowActions={(claim) => [
              { label: 'View details', icon: Eye, onClick: () => handleViewDetails(claim) },
              {
                label: 'Approve',
                icon: CheckCircle,
                onClick: () => handleOpenApprove(claim),
                disabled: claimsPending,
                visible: claim.status === 'PENDING' || claim.status === 'VERIFIED',
              },
              {
                label: 'Reject',
                icon: XCircle,
                danger: true,
                onClick: () => handleOpenReject(claim),
                disabled: claimsPending,
                visible: claim.status === 'PENDING' || claim.status === 'VERIFIED',
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Claim Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              Review claim information before approving or rejecting.
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-3">
              {/* Business Info */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-semibold">
                      {selectedClaim.vendorProfile?.businessName || 'Unknown'}
                    </p>
                    {selectedClaim.vendorProfile?.slug && (
                      <p className="text-xs text-muted-foreground">/{selectedClaim.vendorProfile.slug}</p>
                    )}
                  </div>
                  {selectedClaim.vendorProfile?.contactEmail && (
                    <div>
                      <Label className="text-muted-foreground">Business Email</Label>
                      <p className="text-sm">{selectedClaim.vendorProfile.contactEmail}</p>
                    </div>
                  )}
                  {selectedClaim.vendorProfile?.contactPhone && (
                    <div>
                      <Label className="text-muted-foreground">Business Phone</Label>
                      <p className="text-sm">{selectedClaim.vendorProfile.contactPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Claim Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Claim Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedClaim.status}>
                      {CLAIM_STATUS_LABELS[selectedClaim.status]}
                    </StatusBadge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Verification Method</Label>
                  <p className="text-sm">
                    {VERIFICATION_METHOD_LABELS[selectedClaim.verificationMethod]}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Claimant</Label>
                  <p className="text-sm">
                    {selectedClaim.user?.firstName || selectedClaim.user?.lastName
                      ? `${selectedClaim.user?.firstName ?? ''} ${selectedClaim.user?.lastName ?? ''}`.trim()
                      : selectedClaim.user?.email || 'Unknown'}
                  </p>
                  {selectedClaim.user?.email && (selectedClaim.user?.firstName || selectedClaim.user?.lastName) && (
                    <p className="text-xs text-muted-foreground">{selectedClaim.user.email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="text-sm">{formatDate(selectedClaim.createdAt)}</p>
                </div>
                {selectedClaim.verificationExpiry && (
                  <div>
                    <Label className="text-muted-foreground">Verification Expires</Label>
                    <p className="text-sm">{formatDate(selectedClaim.verificationExpiry)}</p>
                  </div>
                )}
              </div>

              {selectedClaim.status === 'REJECTED' && selectedClaim.reviewNotes && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <Label className="text-destructive">Rejection Reason</Label>
                  <p className="text-sm">{selectedClaim.reviewNotes}</p>
                  {selectedClaim.reviewedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Rejected on {formatDate(selectedClaim.reviewedAt)}
                    </p>
                  )}
                </div>
              )}

              {selectedClaim.status === 'APPROVED' && (
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                  <Label className="text-green-700">Approved</Label>
                  {selectedClaim.reviewedAt && (
                    <p className="text-sm text-muted-foreground">
                      Approved on {formatDate(selectedClaim.reviewedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Documents Section */}
              {selectedClaim.documents && selectedClaim.documents.length > 0 && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Supporting Documents</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedClaim.documents.length} file{selectedClaim.documents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedClaim.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc.fileName || getFileNameFromUrl(doc.url)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">{doc.type?.toLowerCase().replace('_', ' ')}</span>
                              {doc.fileSize && (
                                <span>({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                              )}
                              {doc.status === 'VERIFIED' && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                  Verified
                                </Badge>
                              )}
                              {doc.status === 'REJECTED' && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                                  Rejected
                                </Badge>
                              )}
                              {doc.status === 'PENDING' && (
                                <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-500/20">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            {doc.rejectionReason && doc.status === 'REJECTED' && (
                              <p className="mt-1 text-xs text-destructive">
                                {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 shrink-0"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedClaim &&
              (selectedClaim.status === 'PENDING' || selectedClaim.status === 'VERIFIED') && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleOpenReject(selectedClaim)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleOpenApprove(selectedClaim)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this vendor claim?
            </DialogDescription>
          </DialogHeader>
          {approveClaim && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="font-medium">
                {approveClaim.vendorProfile?.businessName || 'Unknown Vendor'}
              </p>
              <p className="text-sm text-muted-foreground">
                Claimant:{' '}
                {approveClaim.user?.firstName || approveClaim.user?.lastName
                  ? `${approveClaim.user?.firstName ?? ''} ${approveClaim.user?.lastName ?? ''}`.trim()
                  : approveClaim.user?.email || 'Unknown'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveSubmit} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this claim. The claimant will see this reason.
            </DialogDescription>
          </DialogHeader>
          {rejectClaim && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="font-medium">
                  {rejectClaim.vendorProfile?.businessName || 'Unknown Vendor'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Claimant:{' '}
                  {rejectClaim.user?.firstName || rejectClaim.user?.lastName
                    ? `${rejectClaim.user?.firstName ?? ''} ${rejectClaim.user?.lastName ?? ''}`.trim()
                    : rejectClaim.user?.email || 'Unknown'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reject-reason">Rejection Reason *</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter the reason for rejection (visible to claimant)..."
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="internal-notes">Internal Notes (optional)</Label>
                <Textarea
                  id="internal-notes"
                  value={rejectInternalNotes}
                  onChange={(e) => setRejectInternalNotes(e.target.value)}
                  placeholder="Add internal notes (only visible to admins)..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '---'
  }
  return format(date, 'MMM d, yyyy h:mm a')
}

function getFileNameFromUrl(url: string, fallback = 'Document'): string {
  try {
    const pathname = new URL(url).pathname
    const fileName = decodeURIComponent(pathname.split('/').pop() || '')
    // Remove UUID prefix if present (e.g., "1774337802945-29175e70-8858-49ce-a8ee-f162cddae8ca.png")
    const cleanName = fileName.replace(/^\d+-[a-f0-9-]+\./, '.')
    return cleanName.length > 1 ? cleanName : fileName || fallback
  } catch {
    return fallback
  }
}
