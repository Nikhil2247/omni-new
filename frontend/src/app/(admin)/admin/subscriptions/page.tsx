'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowUpDown,
  Ban,
  Calendar,
  CreditCard,
  Edit,
  Eye,
  RefreshCcw,
  Search,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [sortBy, setSortBy] = useState<'createdAt' | 'currentPeriodEnd' | 'status'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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

  const handleSort = (column: 'createdAt' | 'currentPeriodEnd' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all platform subscriptions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Subscriptions table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Subscription list</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, business..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIALING">Trialing</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : data?.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User / Vendor</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('currentPeriodEnd')}
                    >
                      Period End
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {subscription.id.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {subscription.type === 'USER' ? (
                          <User className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Store className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">
                            {subscription.user
                              ? formatUserName(subscription.user)
                              : subscription.vendorProfile?.businessName || '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {subscription.user?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{subscription.plan?.name || '—'}</div>
                      {subscription.price && (
                        <div className="text-xs text-muted-foreground">
                          {formatAmount(subscription.price.amount, subscription.price.currency)} /{' '}
                          {formatBillingCycle(subscription.price.billingCycle)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(subscription.status)}>
                        {formatStatus(subscription.status)}
                      </Badge>
                      {subscription.cancelAtPeriodEnd && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          Cancels soon
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(subscription.currentPeriodEnd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(subscription)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canModify(subscription) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModify(subscription)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canCancel(subscription) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCancel(subscription)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No subscriptions found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          )}

          {data?.meta?.totalPages && data.meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} - {data.meta.total} subscriptions
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
          ) : null}
        </CardContent>
      </Card>

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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Billing</Label>
                  <p className="text-lg font-semibold">
                    {formatAmount(selectedSubscription.price.amount, selectedSubscription.price.currency)}{' '}
                    / {formatBillingCycle(selectedSubscription.price.billingCycle)}
                  </p>
                </div>
              )}

              {selectedSubscription.user && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{formatUserName(selectedSubscription.user)}</p>
                  <p className="text-sm text-muted-foreground">{selectedSubscription.user.email}</p>
                </div>
              )}

              {selectedSubscription.vendorProfile && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{selectedSubscription.vendorProfile.businessName}</p>
                </div>
              )}

              <div className="border-t pt-4">
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
                <div className="border-t pt-4">
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
                <div className="border-t pt-4">
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

              <div className="border-t pt-4 text-xs text-muted-foreground">
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
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
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
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
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
