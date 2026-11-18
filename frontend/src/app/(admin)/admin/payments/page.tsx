'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  CreditCard,
  DollarSign,
  Eye,
  RefreshCcw,
  X,
} from 'lucide-react'
import { useAdminPayments, useRefundPayment } from '@/hooks/queries/use-admin-payment'
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
} from '@/components/dash'
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
import { Textarea } from '@/components/ui/textarea'
import type { AdminPayment, PaymentStatus } from '@/lib/api/types/admin-payment.types'

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const sortBy = 'createdAt' as const
  const sortOrder = 'desc' as const

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

  const columns: DataColumn<AdminPayment>[] = [
    {
      id: 'id',
      header: 'ID',
      label: 'ID',
      cell: (p) => <CopyCell value={p.id.slice(0, 8)} />,
      exportValue: (p) => p.id,
    },
    {
      id: 'party',
      header: 'User / Vendor',
      label: 'User / Vendor',
      cell: (p) => (
        <UserCell
          name={p.user ? formatUserName(p.user) : p.vendorProfile?.businessName || '—'}
          subtitle={p.user?.email ?? (p.vendorProfile ? 'Vendor' : undefined)}
        />
      ),
      sortValue: (p) => (p.user ? formatUserName(p.user) : p.vendorProfile?.businessName || ''),
      exportValue: (p) => (p.user ? formatUserName(p.user) : p.vendorProfile?.businessName || ''),
    },
    {
      id: 'amount',
      header: 'Amount',
      label: 'Amount',
      cell: (p) => (
        <TwoLineCell
          title={formatAmount(p.amount, p.currency)}
          subtitle={
            (p.refundedAmount ?? 0) > 0 ? (
              <span className="text-destructive">
                Refunded: {formatAmount(p.refundedAmount!, p.currency)}
              </span>
            ) : undefined
          }
        />
      ),
      sortValue: (p) => p.amount,
      exportValue: (p) => p.amount,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (p) => <StatusBadge status={p.status}>{formatStatus(p.status)}</StatusBadge>,
      sortValue: (p) => p.status,
      exportValue: (p) => formatStatus(p.status),
    },
    {
      id: 'date',
      header: 'Date',
      label: 'Date',
      cell: (p) => <span className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</span>,
      sortValue: (p) => p.createdAt,
      exportValue: (p) => formatDate(p.createdAt),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title="Payments"
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
        rowKey={(p) => p.id}
        isLoading={isLoading}
        search={{ value: search, onChange: setSearch, placeholder: 'Search by ID, email...' }}
        filters={
          <>
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'SUCCEEDED', label: 'Succeeded' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REFUNDED', label: 'Refunded' },
                { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
              ]}
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
        }
        rowActions={(p) => [
          { label: 'View details', icon: Eye, onClick: () => handleViewDetails(p) },
          {
            label: 'Refund',
            icon: RefreshCcw,
            danger: true,
            visible: canRefund(p),
            onClick: () => handleOpenRefund(p),
          },
        ]}
        serverPagination={{
          page: data?.meta?.page ?? currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? data?.data?.length ?? 0,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No payments found"
        emptyIcon={CreditCard}
        exportFilename="admin-payments"
      />

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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{formatUserName(selectedPayment.user)}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.user.email}</p>
                </div>
              )}

              {selectedPayment.vendorProfile && (
                <div className="border-t pt-3">
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{selectedPayment.vendorProfile.businessName}</p>
                </div>
              )}

              <div className="border-t pt-3">
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
                <div className="border-t pt-3">
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
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
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
