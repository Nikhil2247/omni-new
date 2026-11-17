'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowUpDown,
  CreditCard,
  DollarSign,
  Eye,
  RefreshCcw,
  Search,
  X,
} from 'lucide-react'
import { useAdminPayments, useRefundPayment } from '@/hooks/queries/use-admin-payment'
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
import { Textarea } from '@/components/ui/textarea'
import type { AdminPayment, PaymentStatus } from '@/lib/api/types/admin-payment.types'

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'status'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Selected payment for details modal
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Refund modal state
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const [refundPayment, setRefundPayment] = useState<AdminPayment | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const refundMutation = useRefundPayment()

  useEffect(() => {
    trackDashboard.sectionView('admin-payments', 'admin')
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, status, fromDate, toDate])

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : (status as PaymentStatus),
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page: currentPage,
      limit: 20,
      sortBy,
      sortOrder,
    }),
    [search, status, fromDate, toDate, currentPage, sortBy, sortOrder]
  )

  const { data, isLoading, refetch } = useAdminPayments(params)

  const handleSort = (column: 'createdAt' | 'amount' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleViewDetails = (payment: AdminPayment) => {
    setSelectedPayment(payment)
    setIsDetailsOpen(true)
  }

  const handleOpenRefund = (payment: AdminPayment) => {
    setRefundPayment(payment)
    setRefundAmount(String(payment.amount - (payment.refundedAmount || 0)))
    setRefundReason('')
    setIsRefundOpen(true)
  }

  const handleRefundSubmit = () => {
    if (!refundPayment || !refundReason.trim()) return

    refundMutation.mutate(
      {
        id: refundPayment.id,
        payload: {
          amount: refundAmount ? parseFloat(refundAmount) : undefined,
          reason: refundReason.trim(),
        },
      },
      {
        onSuccess: () => {
          setIsRefundOpen(false)
          setRefundPayment(null)
          setRefundAmount('')
          setRefundReason('')
        },
      }
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setFromDate('')
    setToDate('')
  }

  const hasActiveFilters = search || status !== 'all' || fromDate || toDate

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all platform payments
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Payments table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Payment history</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, email..."
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
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
                      onClick={() => handleSort('createdAt')}
                    >
                      Date
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {payment.id.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {payment.user
                          ? formatUserName(payment.user)
                          : payment.vendorProfile?.businessName || '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payment.user?.email}
                        {payment.vendorProfile && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            Vendor
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatAmount(payment.amount, payment.currency)}
                      </div>
                      {(payment.refundedAmount ?? 0) > 0 && (
                        <div className="text-xs text-destructive">
                          Refunded: {formatAmount(payment.refundedAmount!, payment.currency)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(payment.status)}>
                        {formatStatus(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canRefund(payment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRefund(payment)}
                            className="text-destructive hover:text-destructive"
                          >
                            <RefreshCcw className="h-4 w-4" />
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
              <p className="mt-4 text-sm font-medium">No payments found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          )}

          {data?.meta?.totalPages && data.meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} - {data.meta.total} payments
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

      {/* Payment Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View detailed information about this payment.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Payment ID</Label>
                  <p className="font-mono text-sm">{selectedPayment.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant={getStatusVariant(selectedPayment.status)}>
                      {formatStatus(selectedPayment.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-lg font-semibold">
                    {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Purpose</Label>
                  <p className="text-sm">{selectedPayment.purpose}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="text-sm">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="text-sm">{selectedPayment.paymentMethod || 'N/A'}</p>
                </div>
              </div>

              {selectedPayment.user && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{formatUserName(selectedPayment.user)}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.user.email}</p>
                </div>
              )}

              {selectedPayment.vendorProfile && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{selectedPayment.vendorProfile.businessName}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Gateway Details</Label>
                <div className="mt-1 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Order ID:</span>{' '}
                    <code className="rounded bg-muted px-1">{selectedPayment.gatewayOrderId}</code>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Payment ID:</span>{' '}
                    <code className="rounded bg-muted px-1">{selectedPayment.gatewayPaymentId}</code>
                  </p>
                </div>
              </div>

              {(selectedPayment.refundedAmount ?? 0) > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Refund Details</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Refunded Amount:</span>{' '}
                      <span className="text-destructive">
                        {formatAmount(selectedPayment.refundedAmount!, selectedPayment.currency)}
                      </span>
                    </p>
                    {selectedPayment.refundReason && (
                      <p>
                        <span className="text-muted-foreground">Reason:</span>{' '}
                        {selectedPayment.refundReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedPayment && canRefund(selectedPayment) && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsDetailsOpen(false)
                  handleOpenRefund(selectedPayment)
                }}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refund
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Modal */}
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              Process a refund for this payment. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {refundPayment && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Original Amount</p>
                    <p className="text-lg font-semibold">
                      {formatAmount(refundPayment.amount, refundPayment.currency)}
                    </p>
                  </div>
                  {(refundPayment.refundedAmount ?? 0) > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Already Refunded</p>
                      <p className="text-lg font-semibold text-destructive">
                        {formatAmount(refundPayment.refundedAmount!, refundPayment.currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-amount">Refund Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="refund-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={refundPayment.amount - (refundPayment.refundedAmount || 0)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="pl-9"
                    placeholder="Enter amount to refund"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum refundable:{' '}
                  {formatAmount(
                    refundPayment.amount - (refundPayment.refundedAmount || 0),
                    refundPayment.currency
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason for Refund *</Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter the reason for this refund..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefundSubmit}
              disabled={!refundReason.trim() || refundMutation.isPending}
            >
              {refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
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
  return format(date, 'MMM d, yyyy h:mm a')
}

function getStatusVariant(status: PaymentStatus) {
  const variants: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    SUCCEEDED: 'default',
    PENDING: 'secondary',
    PROCESSING: 'secondary',
    FAILED: 'destructive',
    REFUNDED: 'outline',
    PARTIALLY_REFUNDED: 'outline',
  }
  return variants[status] ?? 'secondary'
}

function formatStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SUCCEEDED: 'Succeeded',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
    PARTIALLY_REFUNDED: 'Partial Refund',
  }
  return labels[status] ?? status
}

function canRefund(payment: AdminPayment): boolean {
  if (payment.status !== 'SUCCEEDED' && payment.status !== 'PARTIALLY_REFUNDED') {
    return false
  }
  const remainingAmount = payment.amount - (payment.refundedAmount || 0)
  return remainingAmount > 0
}
