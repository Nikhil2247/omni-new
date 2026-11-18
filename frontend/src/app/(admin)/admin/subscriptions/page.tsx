'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  Ban,
  CreditCard,
  Edit,
  Eye,
  RefreshCcw,
  User,
  Store,
  X,
} from 'lucide-react'
import {
  useAdminSubscriptions,
  useModifySubscription,
  useCancelSubscription,
} from '@/hooks/queries/use-admin-payment'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  CopyCell,
  DataTable,
  FilterSelect,
  PageHeader,
  StatusBadge,
  TwoLineCell,
  UserCell,
  type DataColumn,
} from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  AdminSubscription,
  AdminSubscriptionType,
  ModifySubscriptionRequest,
} from '@/lib/api/types/admin-payment.types'
import type { SubscriptionStatus } from '@/lib/api/types/subscription.types'

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const sortBy = 'createdAt' as const
  const sortOrder = 'desc' as const

  // Selected subscription for details modal
  const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscription | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Modify modal state
  const [isModifyOpen, setIsModifyOpen] = useState(false)
  const [modifySubscription, setModifySubscription] = useState<AdminSubscription | null>(null)
  const [modifyData, setModifyData] = useState<ModifySubscriptionRequest>({})

  // Cancel modal state
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelSubscription, setCancelSubscription] = useState<AdminSubscription | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [refundProrated, setRefundProrated] = useState(false)

  const modifyMutation = useModifySubscription()
  const cancelMutation = useCancelSubscription()

  useEffect(() => {
    trackDashboard.sectionView('admin-subscriptions', 'admin')
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, type])

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : (status as SubscriptionStatus),
      type: type === 'all' ? undefined : (type as AdminSubscriptionType),
      page: currentPage,
      limit: 20,
      sortBy,
      sortOrder,
    }),
    [search, status, type, currentPage, sortBy, sortOrder]
  )

  const { data, isLoading, refetch } = useAdminSubscriptions(params)

  const handleViewDetails = (subscription: AdminSubscription) => {
    setSelectedSubscription(subscription)
    setIsDetailsOpen(true)
  }

  const handleOpenModify = (subscription: AdminSubscription) => {
    setModifySubscription(subscription)
    setModifyData({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    })
    setIsModifyOpen(true)
  }

  const handleModifySubmit = () => {
    if (!modifySubscription) return

    modifyMutation.mutate(
      {
        id: modifySubscription.id,
        payload: modifyData,
      },
      {
        onSuccess: () => {
          setIsModifyOpen(false)
          setModifySubscription(null)
          setModifyData({})
        },
      }
    )
  }

  const handleOpenCancel = (subscription: AdminSubscription) => {
    setCancelSubscription(subscription)
    setCancelReason('')
    setCancelImmediately(false)
    setRefundProrated(false)
    setIsCancelOpen(true)
  }

  const handleCancelSubmit = () => {
    if (!cancelSubscription || !cancelReason.trim()) return

    cancelMutation.mutate(
      {
        id: cancelSubscription.id,
        payload: {
          reason: cancelReason.trim(),
          cancelImmediately,
          refundProrated,
        },
      },
      {
        onSuccess: () => {
          setIsCancelOpen(false)
          setCancelSubscription(null)
          setCancelReason('')
          setCancelImmediately(false)
          setRefundProrated(false)
        },
      }
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setType('all')
  }

  const hasActiveFilters = search || status !== 'all' || type !== 'all'

  const columns: DataColumn<AdminSubscription>[] = [
    {
      id: 'id',
      header: 'ID',
      label: 'ID',
      cell: (s) => <CopyCell value={s.id.slice(0, 8)} />,
      exportValue: (s) => s.id,
    },
    {
      id: 'party',
      header: 'User / Vendor',
      label: 'User / Vendor',
      cell: (s) => (
        <UserCell
          name={s.user ? formatUserName(s.user) : s.vendorProfile?.businessName || '—'}
          subtitle={s.user?.email ?? (s.type === 'USER' ? 'User' : 'Vendor')}
        />
      ),
      sortValue: (s) => (s.user ? formatUserName(s.user) : s.vendorProfile?.businessName || ''),
      exportValue: (s) => (s.user ? formatUserName(s.user) : s.vendorProfile?.businessName || ''),
    },
    {
      id: 'plan',
      header: 'Plan',
      label: 'Plan',
      cell: (s) => (
        <TwoLineCell
          title={s.plan?.name || '—'}
          subtitle={
            s.price
              ? `${formatAmount(s.price.amount, s.price.currency)} / ${formatBillingCycle(s.price.billingCycle)}`
              : undefined
          }
        />
      ),
      sortValue: (s) => s.plan?.name ?? '',
      exportValue: (s) => s.plan?.name ?? '',
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (s) => (
        <div className="flex items-center gap-1">
          <StatusBadge status={s.status}>{formatStatus(s.status)}</StatusBadge>
          {s.cancelAtPeriodEnd && <StatusBadge tone="warning">Cancels soon</StatusBadge>}
        </div>
      ),
      sortValue: (s) => s.status,
      exportValue: (s) => formatStatus(s.status),
    },
    {
      id: 'periodEnd',
      header: 'Period End',
      label: 'Period End',
      cell: (s) => <span className="text-sm text-muted-foreground">{formatDate(s.currentPeriodEnd)}</span>,
      sortValue: (s) => s.currentPeriodEnd,
      exportValue: (s) => formatDate(s.currentPeriodEnd),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title="Subscriptions"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        search={{ value: search, onChange: setSearch, placeholder: 'Search by email, business...' }}
        filters={
          <>
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'TRIALING', label: 'Trialing' },
                { value: 'PAST_DUE', label: 'Past Due' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'EXPIRED', label: 'Expired' },
              ]}
            />
            <FilterSelect
              label="Type"
              value={type}
              onChange={setType}
              options={[
                { value: 'USER', label: 'User' },
                { value: 'VENDOR', label: 'Vendor' },
              ]}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </>
        }
        rowActions={(s) => [
          { label: 'View details', icon: Eye, onClick: () => handleViewDetails(s) },
          { label: 'Modify', icon: Edit, visible: canModify(s), onClick: () => handleOpenModify(s) },
          {
            label: 'Cancel subscription',
            icon: Ban,
            danger: true,
            visible: canCancel(s),
            onClick: () => handleOpenCancel(s),
          },
        ]}
        serverPagination={{
          page: data?.meta?.page ?? currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? data?.data?.length ?? 0,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No subscriptions found"
        emptyIcon={CreditCard}
        exportFilename="admin-subscriptions"
      />

      {/* Subscription Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              View detailed information about this subscription.
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground">Subscription ID</Label>
                  <p className="font-mono text-sm">{selectedSubscription.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <Badge variant="outline">
                    {selectedSubscription.type === 'USER' ? 'User' : 'Vendor'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={getStatusVariant(selectedSubscription.status)}>
                      {formatStatus(selectedSubscription.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plan</Label>
                  <p className="font-medium">{selectedSubscription.plan?.name || '—'}</p>
                </div>
              </div>

              {selectedSubscription.price && (
                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">Billing</Label>
                  <p className="text-lg font-semibold">
                    {formatAmount(selectedSubscription.price.amount, selectedSubscription.price.currency)}{' '}
                    / {formatBillingCycle(selectedSubscription.price.billingCycle)}
                  </p>
                </div>
              )}

              {selectedSubscription.user && (
                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{formatUserName(selectedSubscription.user)}</p>
                  <p className="text-sm text-muted-foreground">{selectedSubscription.user.email}</p>
                </div>
              )}

              {selectedSubscription.vendorProfile && (
                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{selectedSubscription.vendorProfile.businessName}</p>
                </div>
              )}

              <div className="border-t pt-3">
                <Label className="text-muted-foreground">Period</Label>
                <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start:</span>{' '}
                    {formatDate(selectedSubscription.currentPeriodStart)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span>{' '}
                    {formatDate(selectedSubscription.currentPeriodEnd)}
                  </div>
                </div>
              </div>

              {selectedSubscription.trialEnd && (
                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">Trial</Label>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start:</span>{' '}
                      {selectedSubscription.trialStart
                        ? formatDate(selectedSubscription.trialStart)
                        : '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>{' '}
                      {formatDate(selectedSubscription.trialEnd)}
                    </div>
                  </div>
                </div>
              )}

              {selectedSubscription.cancelledAt && (
                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">Cancellation</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Cancelled at:</span>{' '}
                      {formatDate(selectedSubscription.cancelledAt)}
                    </p>
                    {selectedSubscription.cancelReason && (
                      <p>
                        <span className="text-muted-foreground">Reason:</span>{' '}
                        {selectedSubscription.cancelReason}
                      </p>
                    )}
                    {selectedSubscription.cancelAtPeriodEnd && (
                      <Badge variant="outline" className="mt-1">
                        Will cancel at period end
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-3 text-xs text-muted-foreground">
                <p>Created: {formatDate(selectedSubscription.createdAt)}</p>
                <p>Updated: {formatDate(selectedSubscription.updatedAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedSubscription && canModify(selectedSubscription) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailsOpen(false)
                  handleOpenModify(selectedSubscription)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Modify
              </Button>
            )}
            {selectedSubscription && canCancel(selectedSubscription) && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsDetailsOpen(false)
                  handleOpenCancel(selectedSubscription)
                }}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modify Subscription Modal */}
      <Dialog open={isModifyOpen} onOpenChange={setIsModifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Subscription</DialogTitle>
            <DialogDescription>
              Update subscription settings and status.
            </DialogDescription>
          </DialogHeader>
          {modifySubscription && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  {modifySubscription.type === 'USER' ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Store className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {modifySubscription.user
                        ? formatUserName(modifySubscription.user)
                        : modifySubscription.vendorProfile?.businessName || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {modifySubscription.plan?.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modify-status">Status</Label>
                <Select
                  value={modifyData.status || modifySubscription.status}
                  onValueChange={(value) =>
                    setModifyData({ ...modifyData, status: value as SubscriptionStatus })
                  }
                >
                  <SelectTrigger id="modify-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="TRIALING">Trialing</SelectItem>
                    <SelectItem value="PAST_DUE">Past Due</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cancel-at-period-end"
                  checked={modifyData.cancelAtPeriodEnd ?? modifySubscription.cancelAtPeriodEnd}
                  onCheckedChange={(checked) =>
                    setModifyData({ ...modifyData, cancelAtPeriodEnd: checked === true })
                  }
                />
                <Label htmlFor="cancel-at-period-end">Cancel at period end</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modify-notes">Notes (optional)</Label>
                <Textarea
                  id="modify-notes"
                  value={modifyData.notes || ''}
                  onChange={(e) => setModifyData({ ...modifyData, notes: e.target.value })}
                  placeholder="Add a note about this modification..."
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModifyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleModifySubmit} disabled={modifyMutation.isPending}>
              {modifyMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Cancel this subscription. This action may affect the user's access.
            </DialogDescription>
          </DialogHeader>
          {cancelSubscription && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  {cancelSubscription.type === 'USER' ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Store className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {cancelSubscription.user
                        ? formatUserName(cancelSubscription.user)
                        : cancelSubscription.vendorProfile?.businessName || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cancelSubscription.plan?.name} -{' '}
                      {formatAmount(
                        cancelSubscription.price?.amount || 0,
                        cancelSubscription.price?.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter the reason for this cancellation..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cancel-immediately"
                  checked={cancelImmediately}
                  onCheckedChange={(checked) => setCancelImmediately(checked === true)}
                />
                <Label htmlFor="cancel-immediately">Cancel immediately (don't wait for period end)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="refund-prorated"
                  checked={refundProrated}
                  onCheckedChange={(checked) => setRefundProrated(checked === true)}
                />
                <Label htmlFor="refund-prorated">Issue prorated refund</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
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

function formatUserName(user: { firstName?: string | null; lastName?: string | null; email: string }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

function formatAmount(amount: number, currency: string = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return format(date, 'MMM d, yyyy')
}

function formatBillingCycle(cycle: string) {
  const labels: Record<string, string> = {
    MONTHLY: 'month',
    QUARTERLY: 'quarter',
    YEARLY: 'year',
    LIFETIME: 'lifetime',
  }
  return labels[cycle] ?? cycle.toLowerCase()
}

function getStatusVariant(status: SubscriptionStatus) {
  const variants: Record<SubscriptionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default',
    TRIALING: 'secondary',
    PENDING: 'secondary',
    PAST_DUE: 'destructive',
    CANCELLED: 'outline',
    PAUSED: 'outline',
    EXPIRED: 'outline',
  }
  return variants[status] ?? 'secondary'
}

function formatStatus(status: SubscriptionStatus) {
  const labels: Record<SubscriptionStatus, string> = {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    TRIALING: 'Trialing',
    PAST_DUE: 'Past Due',
    CANCELLED: 'Cancelled',
    PAUSED: 'Paused',
    EXPIRED: 'Expired',
  }
  return labels[status] ?? status
}

function canModify(subscription: AdminSubscription): boolean {
  return subscription.status !== 'EXPIRED'
}

function canCancel(subscription: AdminSubscription): boolean {
  return (
    subscription.status === 'ACTIVE' ||
    subscription.status === 'TRIALING' ||
    subscription.status === 'PAST_DUE'
  )
}
