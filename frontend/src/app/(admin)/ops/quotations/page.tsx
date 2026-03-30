'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Send,
  ArrowRightCircle,
  Loader2,
  Plus,
  MoreVertical,
  Trash2,
  AlertCircle,
  Printer,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  useOpsQuotations,
  useCreateQuotation,
  useSendQuotation,
  useAcceptQuotation,
  useRejectQuotation,
  useConvertQuotationToInvoice,
  useDeleteQuotation,
  type QuotationResponse,
  type QuotationStatus,
  type CreateQuotationPayload,
} from '@/hooks/queries/use-quotations'
import { useOpsActiveEvents, useOpsAgreements } from '@/hooks/queries/use-ops'
import { QuotationPreviewDialog } from '@/components/features/ops/quotation-preview-dialog'
import type { QuotationTemplateData } from '@/components/features/ops/quotation-template'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CONVERTED', label: 'Converted' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
  EXPIRED: { label: 'Expired', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  CONVERTED: { label: 'Converted', color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '₹',
  EUR: '€',
  GBP: '£',
}

function formatCurrency(amount: number | string | null | undefined, currency = 'INR'): string {
  if (amount === null || amount === undefined) return '-'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  return `${symbol}${num.toLocaleString()}`
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  )
}

export default function OpsQuotationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Dialog states
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationResponse | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [sendMessage, setSendMessage] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  // Create quotation form state
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>('')
  const [createFormItems, setCreateFormItems] = useState([
    { description: '', quantity: 1, rate: 0, amount: 0 },
  ])
  const [createFormNotes, setCreateFormNotes] = useState('')
  const [createFormTerms, setCreateFormTerms] = useState('')

  const queryParams = useMemo(
    () => ({
      status: statusFilter !== 'all' ? (statusFilter as QuotationStatus) : undefined,
      page: currentPage,
      limit: 20,
    }),
    [statusFilter, currentPage]
  )

  const { data: quotationsData, isLoading, error } = useOpsQuotations(queryParams)
  const { data: eventsData } = useOpsActiveEvents()
  const { data: agreementsData } = useOpsAgreements(selectedEventId)
  const createQuotation = useCreateQuotation()
  const sendQuotation = useSendQuotation(selectedQuotation?.id || '')
  const acceptQuotation = useAcceptQuotation(selectedQuotation?.id || '')
  const rejectQuotation = useRejectQuotation(selectedQuotation?.id || '')
  const convertToInvoice = useConvertQuotationToInvoice(selectedQuotation?.id || '')
  const deleteQuotation = useDeleteQuotation()

  const quotations = quotationsData?.items || []
  const totalPages = quotationsData?.totalPages || 1
  const totalQuotations = quotationsData?.total || 0

  // Filter agreements that don't already have quotations
  const availableAgreements = useMemo(() => {
    if (!agreementsData) return []
    return agreementsData.filter((a) => !quotations.some((q) => q.vendorAgreementId === a.id))
  }, [agreementsData, quotations])

  // Filter by search query
  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) return quotations
    const query = searchQuery.toLowerCase()
    return quotations.filter(
      (q) =>
        q.quotationNumber.toLowerCase().includes(query) ||
        q.vendorAgreement?.vendorName?.toLowerCase().includes(query) ||
        q.vendorAgreement?.activeEvent?.clientName?.toLowerCase().includes(query)
    )
  }, [quotations, searchQuery])

  // Stats
  const stats = useMemo(() => {
    return {
      total: totalQuotations,
      draft: quotations.filter((q) => q.status === 'DRAFT').length,
      sent: quotations.filter((q) => q.status === 'SENT').length,
      accepted: quotations.filter((q) => q.status === 'ACCEPTED').length,
      rejected: quotations.filter((q) => q.status === 'REJECTED').length,
    }
  }, [quotations, totalQuotations])

  const handleSend = async () => {
    if (!selectedQuotation) return
    await sendQuotation.mutateAsync(sendMessage || undefined)
    setShowSendDialog(false)
    setSendMessage('')
    setSelectedQuotation(null)
  }

  const handleAccept = async (quotation: QuotationResponse) => {
    setSelectedQuotation(quotation)
    await acceptQuotation.mutateAsync()
    setSelectedQuotation(null)
  }

  const handleReject = async () => {
    if (!selectedQuotation) return
    await rejectQuotation.mutateAsync(rejectReason || undefined)
    setShowRejectDialog(false)
    setRejectReason('')
    setSelectedQuotation(null)
  }

  const handleConvert = async (quotation: QuotationResponse) => {
    setSelectedQuotation(quotation)
    await convertToInvoice.mutateAsync()
    setSelectedQuotation(null)
  }

  const handleDelete = async (quotation: QuotationResponse) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      await deleteQuotation.mutateAsync(quotation.id)
    }
  }

  const openSendDialog = (quotation: QuotationResponse) => {
    setSelectedQuotation(quotation)
    setShowSendDialog(true)
  }

  const openRejectDialog = (quotation: QuotationResponse) => {
    setSelectedQuotation(quotation)
    setShowRejectDialog(true)
  }

  const openDetailsDialog = (quotation: QuotationResponse) => {
    setSelectedQuotation(quotation)
    setShowDetailsDialog(true)
  }

  const openPreviewDialog = (quotation: QuotationResponse) => {
    setSelectedQuotation(quotation)
    setShowPreviewDialog(true)
  }

  const resetCreateForm = () => {
    setSelectedEventId('')
    setSelectedAgreementId('')
    setCreateFormItems([{ description: '', quantity: 1, rate: 0, amount: 0 }])
    setCreateFormNotes('')
    setCreateFormTerms('')
  }

  const handleCreateQuotation = async () => {
    if (!selectedAgreementId) return

    const subtotal = createFormItems.reduce((sum, item) => sum + item.amount, 0)
    const payload: CreateQuotationPayload = {
      vendorAgreementId: selectedAgreementId,
      items: createFormItems.filter((item) => item.description.trim()),
      subtotal,
      totalAmount: subtotal,
      notes: createFormNotes || undefined,
      termsAndConditions: createFormTerms || undefined,
    }

    await createQuotation.mutateAsync(payload)
    setShowCreateDialog(false)
    resetCreateForm()
  }

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...createFormItems]
    newItems[index] = { ...newItems[index], [field]: value }
    // Auto-calculate amount
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate
    }
    setCreateFormItems(newItems)
  }

  const addLineItem = () => {
    setCreateFormItems([...createFormItems, { description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (createFormItems.length > 1) {
      setCreateFormItems(createFormItems.filter((_, i) => i !== index))
    }
  }

  // Convert quotation data to template format
  const getTemplateData = (quotation: QuotationResponse): QuotationTemplateData => ({
    quotationNumber: quotation.quotationNumber,
    dateIssued: quotation.createdAt,
    validUntil: quotation.validUntil,
    clientName: quotation.vendorAgreement?.activeEvent?.clientName || 'N/A',
    vendorName: quotation.vendorAgreement?.vendorName || 'N/A',
    items: quotation.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    })),
    subtotal: quotation.subtotal,
    discount: quotation.discount || undefined,
    discountType: quotation.discountType as 'PERCENTAGE' | 'FIXED' | undefined,
    taxRate: quotation.taxRate,
    taxAmount: quotation.taxAmount,
    grandTotal: quotation.totalAmount,
    notes: quotation.notes,
    termsAndConditions: quotation.termsAndConditions,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-muted-foreground">
            Manage quotations for vendor agreements
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-xs text-muted-foreground">Draft</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by quotation number, vendor, or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
        </CardContent>
      </Card>

      {/* Quotations Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive font-medium">Failed to load quotations</p>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No quotations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Client / Event</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">
                      {quotation.quotationNumber}
                    </TableCell>
                    <TableCell>
                      {quotation.vendorAgreement?.vendorName || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {quotation.vendorAgreement?.activeEvent?.clientName || '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quotation.vendorAgreement?.activeEvent?.eventType || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(quotation.totalAmount, quotation.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={quotation.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(quotation.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailsDialog(quotation)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPreviewDialog(quotation)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print / Download
                          </DropdownMenuItem>

                          {quotation.status === 'DRAFT' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openSendDialog(quotation)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send to Vendor
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(quotation)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}

                          {quotation.status === 'SENT' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAccept(quotation)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Mark Accepted
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openRejectDialog(quotation)}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Mark Rejected
                              </DropdownMenuItem>
                            </>
                          )}

                          {quotation.status === 'ACCEPTED' && !quotation.invoice && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleConvert(quotation)}>
                                <ArrowRightCircle className="mr-2 h-4 w-4 text-purple-600" />
                                Convert to Invoice
                              </DropdownMenuItem>
                            </>
                          )}

                          {quotation.invoice && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/ops/invoices`}>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  View Invoice
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>
              {selectedQuotation?.quotationNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">
                    {selectedQuotation.vendorAgreement?.vendorName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {selectedQuotation.vendorAgreement?.activeEvent?.clientName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedQuotation.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-medium">
                    {selectedQuotation.validUntil
                      ? format(new Date(selectedQuotation.validUntil), 'MMM d, yyyy')
                      : 'Not set'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Line Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.rate, selectedQuotation.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.amount, selectedQuotation.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedQuotation.subtotal, selectedQuotation.currency)}</span>
                </div>
                {selectedQuotation.taxAmount && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({selectedQuotation.taxRate}%)</span>
                    <span>{formatCurrency(selectedQuotation.taxAmount, selectedQuotation.currency)}</span>
                  </div>
                )}
                {selectedQuotation.discount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedQuotation.discount, selectedQuotation.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedQuotation.totalAmount, selectedQuotation.currency)}</span>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{selectedQuotation.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quotation</DialogTitle>
            <DialogDescription>
              Send this quotation to the vendor for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Add a message to the vendor..."
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sendQuotation.isPending}>
              {sendQuotation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
            <DialogDescription>
              Mark this quotation as rejected by the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectQuotation.isPending}
            >
              {rejectQuotation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview/Print Dialog */}
      <QuotationPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        data={selectedQuotation ? getTemplateData(selectedQuotation) : null}
        type="quotation"
      />

      {/* Create Quotation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) resetCreateForm()
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quotation</DialogTitle>
            <DialogDescription>
              Create a new quotation for a vendor agreement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Event Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={selectedEventId} onValueChange={(v) => {
                  setSelectedEventId(v)
                  setSelectedAgreementId('')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventsData?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.clientName} - {event.eventType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor Agreement</Label>
                <Select
                  value={selectedAgreementId}
                  onValueChange={setSelectedAgreementId}
                  disabled={!selectedEventId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agreement" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgreements.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No agreements without quotations
                      </div>
                    ) : (
                      availableAgreements.map((agreement) => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          {agreement.vendorName} - ${Number(agreement.agreedAmount).toLocaleString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {createFormItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      ${item.amount.toLocaleString()}
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={createFormItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right font-bold">
                Total: ${createFormItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={createFormNotes}
                  onChange={(e) => setCreateFormNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions (optional)</Label>
                <Textarea
                  placeholder="Terms and conditions..."
                  value={createFormTerms}
                  onChange={(e) => setCreateFormTerms(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false)
              resetCreateForm()
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateQuotation}
              disabled={!selectedAgreementId || createFormItems.every((i) => !i.description.trim()) || createQuotation.isPending}
            >
              {createQuotation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
