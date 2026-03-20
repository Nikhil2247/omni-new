'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Eye,
  Megaphone,
  RefreshCcw,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import {
  useAdminCampaigns,
  useAdminCampaignCounts,
  useApproveCampaign,
  useRejectCampaign,
} from '@/hooks/queries/use-admin-campaign'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AdminCampaign,
  CampaignStatus,
  CampaignType,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
} from '@/lib/api/types/admin-campaign.types'

// Status labels and colors
const STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const TYPE_LABELS: Record<CampaignType, string> = {
  PROFILE_BOOST: 'Profile Boost',
  ALBUM_PROMOTION: 'Album Promotion',
  BANNER_AD: 'Banner Ad',
  FEATURED_LISTING: 'Featured Listing',
}

export default function AdminCampaignsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Selected campaign for details modal
  const [selectedCampaign, setSelectedCampaign] = useState<AdminCampaign | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Reject modal state
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectCampaign, setRejectCampaign] = useState<AdminCampaign | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectInternalNotes, setRejectInternalNotes] = useState('')

  const approveMutation = useApproveCampaign()
  const rejectMutation = useRejectCampaign()
  const { data: counts, refetch: refetchCounts } = useAdminCampaignCounts()

  useEffect(() => {
    trackDashboard.sectionView('admin-campaigns', 'admin')
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, type, fromDate, toDate, activeTab])

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      status:
        activeTab === 'pending'
          ? ('PENDING_APPROVAL' as CampaignStatus)
          : status === 'all'
            ? undefined
            : (status as CampaignStatus),
      type: type === 'all' ? undefined : (type as CampaignType),
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: currentPage,
      limit: 20,
    }),
    [search, status, type, fromDate, toDate, currentPage, activeTab]
  )

  const { data, isLoading, refetch } = useAdminCampaigns(params)

  const handleViewDetails = (campaign: AdminCampaign) => {
    setSelectedCampaign(campaign)
    setIsDetailsOpen(true)
  }

  const handleApprove = (campaign: AdminCampaign) => {
    approveMutation.mutate(campaign.id, {
      onSuccess: () => {
        setIsDetailsOpen(false)
        refetchCounts()
      },
    })
  }

  const handleOpenReject = (campaign: AdminCampaign) => {
    setRejectCampaign(campaign)
    setRejectReason('')
    setRejectInternalNotes('')
    setIsRejectOpen(true)
  }

  const handleRejectSubmit = () => {
    if (!rejectCampaign || !rejectReason.trim()) return

    rejectMutation.mutate(
      {
        id: rejectCampaign.id,
        payload: {
          reason: rejectReason.trim(),
          internalNotes: rejectInternalNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsRejectOpen(false)
          setIsDetailsOpen(false)
          setRejectCampaign(null)
          setRejectReason('')
          setRejectInternalNotes('')
          refetchCounts()
        },
      }
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setType('all')
    setFromDate('')
    setToDate('')
  }

  const hasActiveFilters = search || status !== 'all' || type !== 'all' || fromDate || toDate

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaign Approval</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and moderate vendor ad campaigns
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">
                {counts?.PENDING_APPROVAL ?? 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-bold text-green-600">{counts?.ACTIVE ?? 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{counts?.REJECTED ?? 0}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{counts?.TOTAL ?? 0}</p>
            </div>
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Campaign Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'pending')}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {(counts?.PENDING_APPROVAL ?? 0) > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-medium text-white">
                {counts?.PENDING_APPROVAL}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <CampaignTable
            campaigns={data?.data ?? []}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleOpenReject}
            isPending={approveMutation.isPending}
            showVendor
          />
          <Pagination data={data} currentPage={currentPage} setCurrentPage={setCurrentPage} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>All Campaigns</CardTitle>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="From date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full sm:w-36"
                />
                <Input
                  type="date"
                  placeholder="To date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full sm:w-36"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CampaignTable
                campaigns={data?.data ?? []}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onApprove={handleApprove}
                onReject={handleOpenReject}
                isPending={approveMutation.isPending}
                showVendor
                showStatus
              />
              <Pagination data={data} currentPage={currentPage} setCurrentPage={setCurrentPage} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              Review campaign information before approving or rejecting.
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Campaign Name</Label>
                  <p className="font-semibold">{selectedCampaign.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={getStatusVariant(selectedCampaign.status)}>
                      {STATUS_LABELS[selectedCampaign.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="text-sm">{TYPE_LABELS[selectedCampaign.type]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="text-sm font-medium">
                    {selectedCampaign.vendorProfile?.businessName || 'Unknown'}
                  </p>
                </div>
              </div>

              {selectedCampaign.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedCampaign.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/50 p-4">
                <div>
                  <Label className="text-muted-foreground">Daily Budget</Label>
                  <p className="text-lg font-semibold">{selectedCampaign.dailyBudget} credits</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Budget</Label>
                  <p className="text-lg font-semibold">{selectedCampaign.totalBudget} credits</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Credits Spent</Label>
                  <p className="text-lg font-semibold">{selectedCampaign.creditsSpent} credits</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="text-sm">{formatDate(selectedCampaign.startDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="text-sm">
                    {selectedCampaign.endDate ? formatDate(selectedCampaign.endDate) : 'No end date'}
                  </p>
                </div>
              </div>

              {selectedCampaign.submittedAt && (
                <div>
                  <Label className="text-muted-foreground">Submitted At</Label>
                  <p className="text-sm">{formatDate(selectedCampaign.submittedAt)}</p>
                </div>
              )}

              {selectedCampaign.status === 'REJECTED' && selectedCampaign.rejectionReason && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <Label className="text-destructive">Rejection Reason</Label>
                  <p className="text-sm">{selectedCampaign.rejectionReason}</p>
                  {selectedCampaign.rejectedBy && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Rejected by {selectedCampaign.rejectedBy.firstName || selectedCampaign.rejectedBy.email}{' '}
                      on {selectedCampaign.rejectedAt ? formatDate(selectedCampaign.rejectedAt) : 'N/A'}
                    </p>
                  )}
                </div>
              )}

              {selectedCampaign.status === 'APPROVED' && selectedCampaign.approvedBy && (
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                  <Label className="text-green-700">Approved</Label>
                  <p className="text-sm text-muted-foreground">
                    Approved by {selectedCampaign.approvedBy.firstName || selectedCampaign.approvedBy.email}{' '}
                    on {selectedCampaign.approvedAt ? formatDate(selectedCampaign.approvedAt) : 'N/A'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Impressions</Label>
                  <p className="font-medium">{selectedCampaign.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Clicks</Label>
                  <p className="font-medium">{selectedCampaign.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Conversions</Label>
                  <p className="font-medium">{selectedCampaign.conversions.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedCampaign?.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleOpenReject(selectedCampaign)
                  }}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedCampaign)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this campaign. The vendor will see this reason.
            </DialogDescription>
          </DialogHeader>
          {rejectCampaign && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="font-medium">{rejectCampaign.name}</p>
                <p className="text-sm text-muted-foreground">
                  {rejectCampaign.vendorProfile?.businessName || 'Unknown Vendor'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-reason">Rejection Reason *</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter the reason for rejection (visible to vendor)..."
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
// Campaign Table Component
// ============================================================================

function CampaignTable({
  campaigns,
  isLoading,
  onViewDetails,
  onApprove,
  onReject,
  isPending,
  showVendor = false,
  showStatus = false,
}: {
  campaigns: AdminCampaign[]
  isLoading: boolean
  onViewDetails: (campaign: AdminCampaign) => void
  onApprove: (campaign: AdminCampaign) => void
  onReject: (campaign: AdminCampaign) => void
  isPending: boolean
  showVendor?: boolean
  showStatus?: boolean
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

  if (!campaigns.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Megaphone className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium">No campaigns found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {showStatus ? 'Try adjusting your search or filters.' : 'No campaigns awaiting approval.'}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          {showVendor && <TableHead>Vendor</TableHead>}
          <TableHead>Type</TableHead>
          <TableHead>Budget</TableHead>
          {showStatus && <TableHead>Status</TableHead>}
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id}>
            <TableCell>
              <div className="font-medium">{campaign.name}</div>
              {campaign.description && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {campaign.description}
                </div>
              )}
            </TableCell>
            {showVendor && (
              <TableCell>
                <div className="text-sm">
                  {campaign.vendorProfile?.businessName || 'Unknown'}
                </div>
              </TableCell>
            )}
            <TableCell>
              <Badge variant="outline">{TYPE_LABELS[campaign.type]}</Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <span className="font-medium">{campaign.totalBudget}</span>
                <span className="text-muted-foreground"> credits</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {campaign.dailyBudget}/day
              </div>
            </TableCell>
            {showStatus && (
              <TableCell>
                <Badge variant={getStatusVariant(campaign.status)}>
                  {STATUS_LABELS[campaign.status]}
                </Badge>
              </TableCell>
            )}
            <TableCell className="text-sm text-muted-foreground">
              {campaign.submittedAt ? formatDate(campaign.submittedAt) : formatDate(campaign.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(campaign)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {campaign.status === 'PENDING_APPROVAL' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApprove(campaign)}
                      disabled={isPending}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(campaign)}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ============================================================================
// Pagination Component
// ============================================================================

function Pagination({
  data,
  currentPage,
  setCurrentPage,
  isLoading,
}: {
  data: { meta?: { totalPages: number; page: number; total: number; hasPreviousPage: boolean; hasNextPage: boolean } } | undefined
  currentPage: number
  setCurrentPage: (page: number | ((prev: number) => number)) => void
  isLoading: boolean
}) {
  if (!data?.meta?.totalPages || data.meta.totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Page {data.meta.page} of {data.meta.totalPages} - {data.meta.total} campaigns
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!data.meta.hasPreviousPage || isLoading}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!data.meta.hasNextPage || isLoading}
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

function getStatusVariant(status: CampaignStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<CampaignStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    DRAFT: 'secondary',
    PENDING_APPROVAL: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
    SCHEDULED: 'secondary',
    ACTIVE: 'default',
    PAUSED: 'secondary',
    COMPLETED: 'outline',
    CANCELLED: 'destructive',
  }
  return variants[status] ?? 'secondary'
}
