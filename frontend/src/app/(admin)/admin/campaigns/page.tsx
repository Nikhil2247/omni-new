'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  CheckCircle,
  Clock,
  Eye,
  Megaphone,
  RefreshCcw,
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
import {
  DataTable,
  FilterSelect,
  PageHeader,
  StatCard,
  StatGrid,
  StatusBadge,
  TwoLineCell,
  type DataColumn,
} from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdminCampaign,
  CampaignStatus,
  CampaignType,
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

  const showStatus = activeTab === 'all'
  const columns: DataColumn<AdminCampaign>[] = [
    {
      id: 'campaign',
      header: 'Campaign',
      label: 'Campaign',
      cell: (c) => <TwoLineCell title={c.name} subtitle={c.description ? <span className="line-clamp-1">{c.description}</span> : undefined} />,
      exportValue: (c) => c.name,
    },
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (c) => <span className="text-sm">{c.vendorProfile?.businessName || 'Unknown'}</span>,
      exportValue: (c) => c.vendorProfile?.businessName || 'Unknown',
    },
    {
      id: 'type',
      header: 'Type',
      label: 'Type',
      cell: (c) => <StatusBadge tone="neutral">{TYPE_LABELS[c.type]}</StatusBadge>,
      exportValue: (c) => TYPE_LABELS[c.type],
    },
    {
      id: 'budget',
      header: 'Budget',
      label: 'Budget',
      cell: (c) => (
        <TwoLineCell title={`${c.totalBudget} credits`} subtitle={`${c.dailyBudget}/day`} />
      ),
      exportValue: (c) => c.totalBudget,
    },
    ...(showStatus
      ? [
          {
            id: 'status',
            header: 'Status',
            label: 'Status',
            cell: (c: AdminCampaign) => <StatusBadge status={c.status}>{STATUS_LABELS[c.status]}</StatusBadge>,
            exportValue: (c: AdminCampaign) => STATUS_LABELS[c.status],
          },
        ]
      : []),
    {
      id: 'submitted',
      header: 'Submitted',
      label: 'Submitted',
      cell: (c) => (
        <span className="text-sm text-muted-foreground">
          {c.submittedAt ? formatDate(c.submittedAt) : formatDate(c.createdAt)}
        </span>
      ),
      exportValue: (c) => (c.submittedAt ? formatDate(c.submittedAt) : formatDate(c.createdAt)),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title="Campaign Approval"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Pending Approval" value={counts?.PENDING_APPROVAL ?? 0} icon={Clock} accent="text-yellow-600" />
        <StatCard label="Active Campaigns" value={counts?.ACTIVE ?? 0} icon={CheckCircle} accent="text-green-600" />
        <StatCard label="Rejected" value={counts?.REJECTED ?? 0} icon={XCircle} accent="text-red-600" />
        <StatCard label="Total Campaigns" value={counts?.TOTAL ?? 0} icon={Megaphone} />
      </StatGrid>

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
      </Tabs>

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        search={
          showStatus
            ? { value: search, onChange: setSearch, placeholder: 'Search campaigns...' }
            : undefined
        }
        filters={
          showStatus ? (
            <>
              <FilterSelect
                label="Status"
                value={status}
                onChange={setStatus}
                options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <FilterSelect
                label="Type"
                value={type}
                onChange={setType}
                options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <Input
                type="date"
                aria-label="From date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 w-36"
              />
              <Input
                type="date"
                aria-label="To date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 w-36"
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </>
          ) : undefined
        }
        rowActions={(c) => [
          { label: 'View details', icon: Eye, onClick: () => handleViewDetails(c) },
          {
            label: 'Approve',
            icon: CheckCircle,
            visible: c.status === 'PENDING_APPROVAL',
            disabled: approveMutation.isPending,
            onClick: () => handleApprove(c),
          },
          {
            label: 'Reject',
            icon: XCircle,
            danger: true,
            visible: c.status === 'PENDING_APPROVAL',
            onClick: () => handleOpenReject(c),
          },
        ]}
        serverPagination={{
          page: data?.meta?.page ?? currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? data?.data?.length ?? 0,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No campaigns found"
        emptyIcon={Megaphone}
        exportFilename="admin-campaigns"
      />

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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/50 p-3">
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

              <div className="grid grid-cols-2 gap-3">
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
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
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
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                  <Label className="text-green-700">Approved</Label>
                  <p className="text-sm text-muted-foreground">
                    Approved by {selectedCampaign.approvedBy.firstName || selectedCampaign.approvedBy.email}{' '}
                    on {selectedCampaign.approvedAt ? formatDate(selectedCampaign.approvedAt) : 'N/A'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
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
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
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
