'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useUmami } from '@/hooks/use-umami'
import { format } from 'date-fns'
import { FileText, DollarSign, Clock, CheckCircle, AlertCircle, Eye, Receipt, Trash2, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  PageHeader,
  DataTable,
  FilterSelect,
  StatusBadge,
  KpiCard,
  KpiGrid,
  TwoLineCell,
  type DataColumn,
} from '@/components/dash'
import { useOpsAllInvoices, useMarkInvoicePaid, useDeleteInvoice } from '@/hooks/queries/use-ops'
import type { OpsInvoice } from '@/lib/api/types/ops.types'
import { QuotationPreviewDialog } from '@/components/features/ops/quotation-preview-dialog'
import type { QuotationTemplateData } from '@/components/features/ops/quotation-template'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

export default function OpsInvoicesPage() {
  const { track } = useUmami()

  useEffect(() => {
    track('ops:invoices:page_view', { section: 'invoices_management' })
  }, [track])

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<OpsInvoice | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  const queryParams = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page: currentPage,
    limit: 20,
  }), [statusFilter, currentPage])

  const { data: invoicesData, isLoading, error, refetch } = useOpsAllInvoices(queryParams)
  const markPaidMutation = useMarkInvoicePaid()
  const deleteMutation = useDeleteInvoice()

  const invoices = invoicesData?.items || []
  const totalInvoices = invoicesData?.total || 0

  // Filter by search query (client-side for invoice number, vendor name, client name)
  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices
    const query = searchQuery.toLowerCase()
    return invoices.filter(inv =>
      inv.invoiceNumber?.toLowerCase().includes(query) ||
      inv.vendorAgreement?.vendorName?.toLowerCase().includes(query) ||
      inv.vendorAgreement?.activeEvent?.clientName?.toLowerCase().includes(query) ||
      inv.vendorAgreement?.vendorProfile?.businessName?.toLowerCase().includes(query)
    )
  }, [invoices, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const amt = (i: OpsInvoice) => {
      const n = typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
      return n || 0
    }
    const sumBy = (status: string) =>
      invoices.filter(i => i.status === status).reduce((sum, i) => sum + amt(i), 0)
    const countBy = (status: string) => invoices.filter(i => i.status === status).length
    return {
      pending: countBy('PENDING'),
      paid: countBy('PAID'),
      overdue: countBy('OVERDUE'),
      totalAmount: invoices.reduce((sum, i) => sum + amt(i), 0),
      paidAmount: sumBy('PAID'),
      pendingAmount: sumBy('PENDING'),
      overdueAmount: sumBy('OVERDUE'),
    }
  }, [invoices])

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return
    try {
      await markPaidMutation.mutateAsync(selectedInvoice.id)
      setShowMarkPaidDialog(false)
      setSelectedInvoice(null)
      refetch()
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedInvoice) return
    try {
      await deleteMutation.mutateAsync(selectedInvoice.id)
      setShowDeleteDialog(false)
      setSelectedInvoice(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    }
  }

  // Convert invoice data to template format
  const getTemplateData = (invoice: OpsInvoice): QuotationTemplateData => {
    const amount = typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : (invoice.amount || 0)
    return {
      quotationNumber: invoice.invoiceNumber,
      dateIssued: invoice.issuedAt || new Date().toISOString(),
      clientName: invoice.vendorAgreement?.activeEvent?.clientName || 'N/A',
      vendorName: invoice.vendorAgreement?.vendorProfile?.businessName || invoice.vendorAgreement?.vendorName || 'N/A',
      items: [{
        description: `${invoice.vendorAgreement?.activeEvent?.eventType || 'Service'} - Vendor Services`,
        quantity: 1,
        rate: amount,
        amount: amount,
      }],
      subtotal: amount,
      grandTotal: amount,
      tokenMoneyPaid: invoice.status === 'PAID' ? amount : 0,
    }
  }

  const columns: DataColumn<OpsInvoice>[] = [
    {
      id: 'invoiceNumber',
      header: 'Invoice #',
      label: 'Invoice #',
      cell: (invoice) => <span className="font-mono text-[13px]">{invoice.invoiceNumber}</span>,
      sortValue: (invoice) => invoice.invoiceNumber,
      exportValue: (invoice) => invoice.invoiceNumber,
    },
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (invoice) => (
        <TwoLineCell
          title={invoice.vendorAgreement?.vendorProfile?.businessName || invoice.vendorAgreement?.vendorName || '-'}
          subtitle={invoice.invoiceNumber}
        />
      ),
      sortValue: (invoice) =>
        invoice.vendorAgreement?.vendorProfile?.businessName || invoice.vendorAgreement?.vendorName,
      exportValue: (invoice) =>
        invoice.vendorAgreement?.vendorProfile?.businessName || invoice.vendorAgreement?.vendorName,
    },
    {
      id: 'event',
      header: 'Event / Client',
      label: 'Event / Client',
      hideBelow: 'md',
      cell: (invoice) => {
        const ev = invoice.vendorAgreement?.activeEvent
        if (!ev) return <span className="text-muted-foreground">-</span>
        return (
          <div className="min-w-0 leading-tight" onClick={(e) => e.stopPropagation()}>
            <Link href={`/ops/events/${ev.id}`} className="truncate text-sm font-medium text-primary hover:underline">
              {ev.clientName}
            </Link>
            <div className="truncate text-xs text-muted-foreground">
              {ev.eventType}
              {ev.eventDate && <> - {format(new Date(ev.eventDate), 'MMM d, yyyy')}</>}
            </div>
          </div>
        )
      },
      sortValue: (invoice) => invoice.vendorAgreement?.activeEvent?.clientName,
      exportValue: (invoice) => invoice.vendorAgreement?.activeEvent?.clientName,
    },
    {
      id: 'amount',
      header: 'Amount',
      label: 'Amount',
      align: 'right',
      cell: (invoice) => <span className="font-semibold">{formatCurrency(invoice.amount)}</span>,
      sortValue: (invoice) => Number(invoice.amount) || 0,
      exportValue: (invoice) => Number(invoice.amount) || 0,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (invoice) => <StatusBadge status={invoice.status} />,
      sortValue: (invoice) => invoice.status,
      exportValue: (invoice) => invoice.status,
    },
    {
      id: 'issued',
      header: 'Issued',
      label: 'Issued',
      hideBelow: 'lg',
      cell: (invoice) => (invoice.issuedAt ? format(new Date(invoice.issuedAt), 'MMM d, yyyy') : '-'),
      sortValue: (invoice) => (invoice.issuedAt ? new Date(invoice.issuedAt) : null),
    },
    {
      id: 'paid',
      header: 'Paid',
      label: 'Paid',
      hideBelow: 'lg',
      cell: (invoice) => (invoice.paidAt ? format(new Date(invoice.paidAt), 'MMM d, yyyy') : '-'),
      sortValue: (invoice) => (invoice.paidAt ? new Date(invoice.paidAt) : null),
    },
  ]

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="Invoices" />
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Failed to load invoices. Please try again later.
          </div>
          <Button size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Invoices" />

      <KpiGrid cols={4}>
        <KpiCard label="Total value" value={formatCurrency(stats.totalAmount)} icon={DollarSign} hint={`${totalInvoices} invoices overall`} />
        <KpiCard label="Paid" value={formatCurrency(stats.paidAmount)} icon={CheckCircle} hint={`${stats.paid} on this page`} />
        <KpiCard label="Pending" value={formatCurrency(stats.pendingAmount)} icon={Clock} hint={`${stats.pending} on this page`} />
        <KpiCard label="Overdue" value={formatCurrency(stats.overdueAmount)} icon={AlertCircle} hint={`${stats.overdue} on this page`} />
      </KpiGrid>

      <DataTable
        data={filteredInvoices}
        columns={columns}
        rowKey={(invoice) => invoice.id}
        isLoading={isLoading}
        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search invoices...' }}
        filters={
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
            options={STATUS_OPTIONS}
          />
        }
        columnToggle
        exportFilename="invoices"
        emptyTitle="No invoices found"
        emptyIcon={Receipt}
        serverPagination={{
          page: currentPage,
          pageSize: 20,
          total: totalInvoices,
          onPageChange: setCurrentPage,
        }}
        rowActions={(invoice) => [
          {
            label: 'View details',
            icon: Eye,
            onClick: () => {
              setSelectedInvoice(invoice)
              setShowDetailsDialog(true)
            },
          },
          {
            label: 'Print',
            icon: Printer,
            onClick: () => {
              setSelectedInvoice(invoice)
              setShowPreviewDialog(true)
            },
          },
          {
            label: 'Mark as paid',
            icon: CheckCircle,
            onClick: () => {
              setSelectedInvoice(invoice)
              setShowMarkPaidDialog(true)
            },
            visible: invoice.status === 'PENDING',
          },
          {
            label: 'Delete invoice',
            icon: Trash2,
            danger: true,
            onClick: () => {
              setSelectedInvoice(invoice)
              setShowDeleteDialog(true)
            },
            visible: invoice.status === 'PENDING' || invoice.status === 'CANCELLED',
          },
        ]}
      />

      {/* Invoice Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1"><StatusBadge status={selectedInvoice.status} /></div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Vendor Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Business:</span> {selectedInvoice.vendorAgreement?.vendorProfile?.businessName || '-'}</p>
                  <p><span className="text-muted-foreground">Agreement Vendor:</span> {selectedInvoice.vendorAgreement?.vendorName || '-'}</p>
                  <p><span className="text-muted-foreground">Agreement Amount:</span> {formatCurrency(selectedInvoice.vendorAgreement?.agreedAmount)}</p>
                </div>
              </div>

              {selectedInvoice.vendorAgreement?.activeEvent && (
                <div className="border-t pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Event Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Client:</span> {selectedInvoice.vendorAgreement.activeEvent.clientName}</p>
                    <p><span className="text-muted-foreground">Event Type:</span> {selectedInvoice.vendorAgreement.activeEvent.eventType}</p>
                    {selectedInvoice.vendorAgreement.activeEvent.eventDate && (
                      <p><span className="text-muted-foreground">Event Date:</span> {format(new Date(selectedInvoice.vendorAgreement.activeEvent.eventDate), 'MMMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Timeline</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Issued:</span> {selectedInvoice.issuedAt ? format(new Date(selectedInvoice.issuedAt), 'MMMM d, yyyy h:mm a') : '-'}</p>
                  <p><span className="text-muted-foreground">Paid:</span> {selectedInvoice.paidAt ? format(new Date(selectedInvoice.paidAt), 'MMMM d, yyyy h:mm a') : '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedInvoice?.vendorAgreement?.activeEvent && (
              <Button variant="outline" asChild>
                <Link href={`/ops/events/${selectedInvoice.vendorAgreement.activeEvent.id}`}>
                  View Event
                </Link>
              </Button>
            )}
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Confirmation Dialog */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark invoice {selectedInvoice?.invoiceNumber} as paid?
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="py-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Amount:</span>{' '}
                <span className="font-semibold">{formatCurrency(selectedInvoice.amount)}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Vendor:</span>{' '}
                {selectedInvoice.vendorAgreement?.vendorProfile?.businessName || selectedInvoice.vendorAgreement?.vendorName}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Invoice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview/Print Dialog */}
      <QuotationPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        data={selectedInvoice ? getTemplateData(selectedInvoice) : null}
        type="invoice"
      />
    </div>
  )
}
