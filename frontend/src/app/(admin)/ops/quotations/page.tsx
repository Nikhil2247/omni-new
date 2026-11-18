'use client'

import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  ArrowRightCircle,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Printer,
} from 'lucide-react'
import { PageHeader, DataTable, FilterSelect, StatusBadge, TwoLineCell, StatCard, StatGrid, type DataColumn } from '@/components/dashboard'
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
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CONVERTED', label: 'Converted' },
]

const STATUS_CONFIG: Record<string, { label: string }> = {
  DRAFT: { label: 'Draft' },
  SENT: { label: 'Sent' },
  ACCEPTED: { label: 'Accepted' },
  REJECTED: { label: 'Rejected' },
  EXPIRED: { label: 'Expired' },
  CONVERTED: { label: 'Converted' },
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

function QuotationStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status }
  return <StatusBadge status={status}>{config.label}</StatusBadge>
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
    await deleteQuotation.mutateAsync(quotation.id)
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

  const columns: DataColumn<QuotationResponse>[] = [
    {
      id: 'number',
      header: 'Quotation #',
      label: 'Quotation #',
      cell: (q) => <span className="font-medium">{q.quotationNumber}</span>,
      sortValue: (q) => q.quotationNumber,
      exportValue: (q) => q.quotationNumber,
    },
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (q) => q.vendorAgreement?.vendorName || '-',
      sortValue: (q) => q.vendorAgreement?.vendorName,
      exportValue: (q) => q.vendorAgreement?.vendorName,
    },
    {
      id: 'client',
      header: 'Client / Event',
      label: 'Client / Event',
      hideBelow: 'md',
      cell: (q) => (
        <TwoLineCell
          title={q.vendorAgreement?.activeEvent?.clientName || '-'}
          subtitle={q.vendorAgreement?.activeEvent?.eventType || '-'}
        />
      ),
      sortValue: (q) => q.vendorAgreement?.activeEvent?.clientName,
      exportValue: (q) => q.vendorAgreement?.activeEvent?.clientName,
    },
    {
      id: 'amount',
      header: 'Amount',
      label: 'Amount',
      align: 'right',
      cell: (q) => <span className="font-semibold">{formatCurrency(q.totalAmount, q.currency)}</span>,
      sortValue: (q) => Number(q.totalAmount) || 0,
      exportValue: (q) => Number(q.totalAmount) || 0,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (q) => <QuotationStatusBadge status={q.status} />,
      sortValue: (q) => q.status,
      exportValue: (q) => q.status,
    },
    {
      id: 'date',
      header: 'Date',
      label: 'Date',
      hideBelow: 'lg',
      cell: (q) => format(new Date(q.createdAt), 'MMM d, yyyy'),
      sortValue: (q) => new Date(q.createdAt),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title="Quotations"
        actions={
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Quotation
          </Button>
        }
      />

      <StatGrid className="lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={FileText} accent="text-blue-600" />
        <StatCard label="Draft" value={stats.draft} icon={Clock} accent="text-gray-600" />
        <StatCard label="Sent" value={stats.sent} icon={Send} accent="text-blue-600" />
        <StatCard label="Accepted" value={stats.accepted} icon={CheckCircle} accent="text-green-600" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="text-red-600" />
      </StatGrid>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive bg-card p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Failed to load quotations
        </div>
      ) : (
        <DataTable
          data={filteredQuotations}
          columns={columns}
          rowKey={(q) => q.id}
          isLoading={isLoading}
          search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search quotation number, vendor, client...' }}
          filters={
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
              options={STATUS_OPTIONS}
            />
          }
          columnToggle
          exportFilename="quotations"
          emptyTitle="No quotations found"
          emptyIcon={FileText}
          serverPagination={{
            page: currentPage,
            pageSize: 20,
            total: totalQuotations,
            onPageChange: setCurrentPage,
          }}
          rowActions={(q) => [
            { label: 'View details', icon: Eye, onClick: () => openDetailsDialog(q) },
            { label: 'Print / Download', icon: Printer, onClick: () => openPreviewDialog(q) },
            {
              label: 'Send to vendor',
              icon: Send,
              onClick: () => openSendDialog(q),
              visible: q.status === 'DRAFT',
            },
            {
              label: 'Mark accepted',
              icon: CheckCircle,
              onClick: () => handleAccept(q),
              visible: q.status === 'SENT',
            },
            {
              label: 'Mark rejected',
              icon: XCircle,
              onClick: () => openRejectDialog(q),
              visible: q.status === 'SENT',
            },
            {
              label: 'Convert to invoice',
              icon: ArrowRightCircle,
              onClick: () => handleConvert(q),
              visible: q.status === 'ACCEPTED' && !q.invoice,
            },
            { label: 'View invoice', icon: DollarSign, href: '/ops/invoices', visible: !!q.invoice },
            {
              label: 'Delete quotation',
              icon: Trash2,
              danger: true,
              onClick: () => handleDelete(q),
              visible: q.status === 'DRAFT',
              confirm: {
                title: 'Delete quotation?',
                description: `Quotation ${q.quotationNumber} will be permanently deleted. This action cannot be undone.`,
              },
            },
          ]}
        />
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
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                  <QuotationStatusBadge status={selectedQuotation.status} />
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

              <div className="border-t pt-3">
                <h4 className="font-medium mb-2">Line Items</h4>
                <DataTable
                  data={selectedQuotation.items}
                  rowKey={(item) => `${item.description}-${item.quantity}-${item.rate}`}
                  defaultPageSize={10}
                  maxHeight="40dvh"
                  columns={[
                    { id: 'description', header: 'Description', label: 'Description', cell: (item) => item.description },
                    { id: 'quantity', header: 'Qty', label: 'Qty', align: 'right', cell: (item) => item.quantity },
                    {
                      id: 'rate',
                      header: 'Rate',
                      label: 'Rate',
                      align: 'right',
                      cell: (item) => formatCurrency(item.rate, selectedQuotation.currency),
                    },
                    {
                      id: 'amount',
                      header: 'Amount',
                      label: 'Amount',
                      align: 'right',
                      cell: (item) => formatCurrency(item.amount, selectedQuotation.currency),
                    },
                  ]}
                />
              </div>

              <div className="border-t pt-3 space-y-1.5">
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
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(selectedQuotation.totalAmount, selectedQuotation.currency)}</span>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="border-t pt-3">
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
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
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
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
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
          <div className="space-y-3 py-2">
            {/* Event Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-1.5">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={createFormNotes}
                  onChange={(e) => setCreateFormNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
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
