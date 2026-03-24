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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdminClaimResponse,
  ClaimStatusCounts,
} from '@/lib/api/types/admin-claim.types'
import type { ClaimStatus, ClaimVerificationMethod } from '@/lib/api/types/vendor-claim.types'
import {
  CLAIM_STATUS_LABELS,
  CLAIM_STATUS_COLORS,
  VERIFICATION_METHOD_LABELS,
} from '@/lib/api/types/vendor-claim.types'

// ============================================================================
// Status Badge Color Mapping
// ============================================================================

const STATUS_BADGE_STYLES: Record<ClaimStatus, string> = {
  PENDING: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  VERIFICATION_SENT: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  VERIFIED: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  APPROVED: 'bg-green-500/10 text-green-700 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-700 border-red-500/20',
  EXPIRED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

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

  const pendingCount = (counts?.pending ?? 0) + (counts?.verified ?? 0)
  const totalClaims = data?.total ?? 0
  const totalPages = Math.ceil(totalClaims / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendor Claims</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} claim${pendingCount === 1 ? '' : 's'} pending review`
              : 'Review and approve vendor ownership claims'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{counts?.pending ?? 0}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Verification Sent</p>
              <p className="text-2xl font-bold text-yellow-600">
                {counts?.verificationSent ?? 0}
              </p>
            </div>
            <FileCheck className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold text-blue-600">{counts?.verified ?? 0}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-green-600">{counts?.approved ?? 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{counts?.rejected ?? 0}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-gray-500">{counts?.expired ?? 0}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>
      </div>

      {/* Claims Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING" className="relative">
            Pending
            {(counts?.pending ?? 0) > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-xs font-medium text-white">
                {counts?.pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="VERIFIED" className="relative">
            Verified
            {(counts?.verified ?? 0) > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                {counts?.verified}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Claims' : `${CLAIM_STATUS_LABELS[activeTab as ClaimStatus]} Claims`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClaimsTable
                claims={data?.claims ?? []}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onApprove={handleOpenApprove}
                onReject={handleOpenReject}
                isPending={approveMutation.isPending || rejectMutation.isPending}
              />
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                total={totalClaims}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
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
            <div className="space-y-4">
              {/* Business Info */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-semibold text-lg">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Claim Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={STATUS_BADGE_STYLES[selectedClaim.status]}
                    >
                      {CLAIM_STATUS_LABELS[selectedClaim.status]}
                    </Badge>
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
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
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
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
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
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Supporting Documents</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedClaim.documents.length} file{selectedClaim.documents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
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
            <div className="rounded-lg border bg-muted/50 p-4">
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
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
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

              <div className="space-y-2">
                <Label htmlFor="reject-reason">Rejection Reason *</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter the reason for rejection (visible to claimant)..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
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
// Claims Table Component
// ============================================================================

function ClaimsTable({
  claims,
  isLoading,
  onViewDetails,
  onApprove,
  onReject,
  isPending,
}: {
  claims: AdminClaimResponse[]
  isLoading: boolean
  onViewDetails: (claim: AdminClaimResponse) => void
  onApprove: (claim: AdminClaimResponse) => void
  onReject: (claim: AdminClaimResponse) => void
  isPending: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (!claims.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileCheck className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium">No claims found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No claims match the current filter.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business Name</TableHead>
          <TableHead>Claimant</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claims.map((claim) => {
          const canApproveReject =
            claim.status === 'PENDING' || claim.status === 'VERIFIED'

          return (
            <TableRow key={claim.id}>
              <TableCell>
                <div className="font-medium">
                  {claim.vendorProfile?.businessName || 'Unknown'}
                </div>
                {claim.vendorProfile?.slug && (
                  <div className="text-xs text-muted-foreground">
                    /{claim.vendorProfile.slug}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {claim.user?.firstName || claim.user?.lastName
                    ? `${claim.user?.firstName ?? ''} ${claim.user?.lastName ?? ''}`.trim()
                    : claim.user?.email || 'Unknown'}
                </div>
                {claim.user?.email && claim.user?.firstName && (
                  <div className="text-xs text-muted-foreground">{claim.user.email}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {VERIFICATION_METHOD_LABELS[claim.verificationMethod]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={STATUS_BADGE_STYLES[claim.status]}>
                  {CLAIM_STATUS_LABELS[claim.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(claim.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(claim)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canApproveReject && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(claim)}
                        disabled={isPending}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(claim)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ============================================================================
// Pagination Component
// ============================================================================

function Pagination({
  totalPages,
  currentPage,
  setCurrentPage,
  total,
  isLoading,
}: {
  totalPages: number
  currentPage: number
  setCurrentPage: (page: number | ((prev: number) => number)) => void
  total: number
  isLoading: boolean
}) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} - {total} claims
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
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
