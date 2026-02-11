'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, DollarSign, Clock, CheckCircle, AlertCircle, Search, Filter, ChevronLeft, ChevronRight, Eye, Receipt, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useOpsAllInvoices, useMarkInvoicePaid, useDeleteInvoice } from '@/hooks/queries/use-ops'
import type { OpsInvoice } from '@/lib/api/types/ops.types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
    case 'PARTIALLY_PAID':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Partially Paid</Badge>
    case 'PAID':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>
    case 'OVERDUE':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>
    case 'CANCELLED':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

export default function OpsInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<OpsInvoice | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const queryParams = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page: currentPage,
    limit: 20,
  }), [statusFilter, currentPage])

  const { data: invoicesData, isLoading, error, refetch } = useOpsAllInvoices(queryParams)
  const markPaidMutation = useMarkInvoicePaid()
  const deleteMutation = useDeleteInvoice()

  const invoices = invoicesData?.items || []
  const totalPages = invoicesData?.totalPages || 1
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
    const pending = invoices.filter(i => i.status === 'PENDING').length
    const paid = invoices.filter(i => i.status === 'PAID').length
    const overdue = invoices.filter(i => i.status === 'OVERDUE').length
    const totalAmount = invoices.reduce((sum, i) => {
      const amt = typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
      return sum + (amt || 0)
    }, 0)
    const paidAmount = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => {
        const amt = typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
        return sum + (amt || 0)
      }, 0)
    return { pending, paid, overdue, totalAmount, paidAmount }
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-semibold">Failed to load invoices</h3>
          <p className="text-muted-foreground">Please try again later</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage all vendor invoices across events</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Paid: {formatCurrency(stats.paidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1) }}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            Showing {filteredInvoices.length} of {totalInvoices} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No invoices found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Invoices will appear here once created'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Event / Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.vendorAgreement?.vendorProfile?.businessName || invoice.vendorAgreement?.vendorName || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.vendorAgreement?.activeEvent ? (
                          <div>
                            <Link
                              href={`/ops/events/${invoice.vendorAgreement.activeEvent.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {invoice.vendorAgreement.activeEvent.clientName}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {invoice.vendorAgreement.activeEvent.eventType}
                              {invoice.vendorAgreement.activeEvent.eventDate && (
                                <> - {format(new Date(invoice.vendorAgreement.activeEvent.eventDate), 'MMM d, yyyy')}</>
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.issuedAt ? format(new Date(invoice.issuedAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.paidAt ? format(new Date(invoice.paidAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowDetailsDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setShowMarkPaidDialog(true)
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(invoice.status === 'PENDING' || invoice.status === 'CANCELLED') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Vendor Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Business:</span> {selectedInvoice.vendorAgreement?.vendorProfile?.businessName || '-'}</p>
                  <p><span className="text-muted-foreground">Agreement Vendor:</span> {selectedInvoice.vendorAgreement?.vendorName || '-'}</p>
                  <p><span className="text-muted-foreground">Agreement Amount:</span> {formatCurrency(selectedInvoice.vendorAgreement?.agreedAmount)}</p>
                </div>
              </div>

              {selectedInvoice.vendorAgreement?.activeEvent && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Event Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Client:</span> {selectedInvoice.vendorAgreement.activeEvent.clientName}</p>
                    <p><span className="text-muted-foreground">Event Type:</span> {selectedInvoice.vendorAgreement.activeEvent.eventType}</p>
                    {selectedInvoice.vendorAgreement.activeEvent.eventDate && (
                      <p><span className="text-muted-foreground">Event Date:</span> {format(new Date(selectedInvoice.vendorAgreement.activeEvent.eventDate), 'MMMM d, yyyy')}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Timeline</h4>
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
            <div className="py-4">
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
              className="bg-green-600 hover:bg-green-700"
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
    </div>
  )
}
