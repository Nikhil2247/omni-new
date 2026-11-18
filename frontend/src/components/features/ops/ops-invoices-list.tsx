'use client'

import { useState } from 'react'
import {
  useOpsInvoices,
  useOpsAllInvoices,
  useCreateInvoice,
  useMarkInvoicePaid,
  useDeleteInvoice,
  useOpsAgreements,
} from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Plus,
  Trash2,
  Loader2,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Eye,
  Printer,
} from 'lucide-react'
import { DataTable, StatusBadge, TwoLineCell, type DataColumn } from '@/components/dash'
import { QuotationPreviewDialog } from './quotation-preview-dialog'
import type { QuotationTemplateData } from './quotation-template'

const STATUS_CONFIG: Record<string, { label: string }> = {
  PENDING: { label: 'Pending' },
  PARTIALLY_PAID: { label: 'Partially paid' },
  PAID: { label: 'Paid' },
  OVERDUE: { label: 'Overdue' },
  CANCELLED: { label: 'Cancelled' },
}

interface OpsInvoicesListProps {
  activeEventId?: string
  vendorAgreementId?: string
  showCreateButton?: boolean
}

export function OpsInvoicesList({ activeEventId, vendorAgreementId, showCreateButton = true }: OpsInvoicesListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<QuotationTemplateData | null>(null)
  const [invoiceForm, setInvoiceForm] = useState({
    vendorAgreementId: vendorAgreementId || '',
    amount: '',
    invoiceNumber: '',
  })

  // Use useOpsAllInvoices when activeEventId is provided, otherwise use useOpsInvoices for vendorAgreementId
  const byAgreementQuery = useOpsInvoices(vendorAgreementId || '')
  const byEventQuery = useOpsAllInvoices(activeEventId ? { activeEventId } : undefined)

  const data = vendorAgreementId
    ? byAgreementQuery.data
    : (activeEventId ? byEventQuery.data?.items : undefined)
  const isLoading = vendorAgreementId ? byAgreementQuery.isLoading : byEventQuery.isLoading
  const error = vendorAgreementId ? byAgreementQuery.error : byEventQuery.error

  const { data: agreements } = useOpsAgreements(activeEventId || '')
  const createInvoice = useCreateInvoice()
  const markPaid = useMarkInvoicePaid()
  const deleteInvoice = useDeleteInvoice()

  const resetForm = () => {
    setInvoiceForm({
      vendorAgreementId: vendorAgreementId || '',
      amount: '',
      invoiceNumber: '',
    })
  }

  const handleCreate = async () => {
    await createInvoice.mutateAsync({
      vendorAgreementId: invoiceForm.vendorAgreementId,
      amount: Number(invoiceForm.amount),
      invoiceNumber: invoiceForm.invoiceNumber,
    })
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleMarkPaid = async (id: string) => {
    await markPaid.mutateAsync(id)
  }

  const handleDelete = async (id: string) => {
    await deleteInvoice.mutateAsync(id)
  }

  const openPreview = (invoice: any) => {
    const data: QuotationTemplateData = {
      quotationNumber: invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
      dateIssued: invoice.issuedAt,
      validUntil: invoice.dueDate,
      clientName: invoice.vendorAgreement?.activeEvent?.clientName || 'N/A',
      clientEmail: invoice.vendorAgreement?.activeEvent?.clientEmail,
      clientPhone: invoice.vendorAgreement?.activeEvent?.clientPhone,
      vendorName: invoice.vendorAgreement?.vendorName || 'N/A',
      items: invoice.items?.length ? invoice.items : [{ description: 'Services as per agreement', quantity: 1, rate: Number(invoice.amount), amount: Number(invoice.amount) }],
      subtotal: Number(invoice.amount),
      grandTotal: Number(invoice.amount),
    }
    setPreviewData(data)
    setShowPreview(true)
  }

  type Invoice = NonNullable<typeof data>[number]

  const columns: DataColumn<Invoice>[] = [
    {
      id: 'invoice',
      header: 'Invoice',
      label: 'Invoice',
      cell: (inv) => (
        <TwoLineCell
          title={inv.invoiceNumber || `INV-${inv.id.slice(0, 8).toUpperCase()}`}
          subtitle={inv.vendorAgreement?.vendorName}
        />
      ),
      sortValue: (inv) => inv.invoiceNumber,
      exportValue: (inv) => inv.invoiceNumber || inv.id,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (inv) => (
        <StatusBadge status={inv.status}>{(STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING).label}</StatusBadge>
      ),
      sortValue: (inv) => inv.status,
      exportValue: (inv) => inv.status,
    },
    {
      id: 'issued',
      header: 'Issued',
      label: 'Issued',
      hideBelow: 'sm',
      cell: (inv) => (inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '-'),
      sortValue: (inv) => (inv.issuedAt ? new Date(inv.issuedAt) : null),
    },
    {
      id: 'amount',
      header: 'Amount',
      label: 'Amount',
      align: 'right',
      cell: (inv) => <span className="font-semibold">${(Number(inv.amount) || 0).toLocaleString()}</span>,
      sortValue: (inv) => Number(inv.amount) || 0,
      exportValue: (inv) => Number(inv.amount) || 0,
    },
  ]

  if (!vendorAgreementId && !activeEventId) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="font-medium">Select an agreement to view invoices</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p className="font-medium">Failed to load invoices</p>
      </div>
    )
  }

  const isCreateDisabled = !invoiceForm.vendorAgreementId || !invoiceForm.invoiceNumber || !invoiceForm.amount || createInvoice.isPending

  return (
    <div className="space-y-2">
      <DataTable
        data={data}
        columns={columns}
        rowKey={(inv) => inv.id}
        isLoading={isLoading}
        exportFilename="invoices"
        emptyTitle="No invoices yet"
        emptyIcon={Receipt}
        toolbarRight={
          showCreateButton && (vendorAgreementId || (agreements && agreements.length > 0)) ? (
            <Button size="sm" className="h-8" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Invoice
            </Button>
          ) : undefined
        }
        rowActions={(inv) => [
          { label: 'Print', icon: Printer, onClick: () => openPreview(inv) },
          {
            label: 'Mark paid',
            icon: CheckCircle2,
            onClick: () => handleMarkPaid(inv.id),
            disabled: markPaid.isPending,
            visible: inv.status !== 'PAID' && inv.status !== 'CANCELLED',
          },
          { label: 'View details', icon: Eye, href: `/ops/invoices/${inv.id}` },
          {
            label: 'Delete invoice',
            icon: Trash2,
            danger: true,
            onClick: () => handleDelete(inv.id),
            confirm: {
              title: 'Delete invoice?',
              description: 'This invoice will be permanently deleted. This action cannot be undone.',
            },
          },
        ]}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a vendor agreement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {!vendorAgreementId && agreements && agreements.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="vendorAgreementId">Vendor Agreement</Label>
                <Select
                  value={invoiceForm.vendorAgreementId}
                  onValueChange={(v) => setInvoiceForm({ ...invoiceForm, vendorAgreementId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agreement" />
                  </SelectTrigger>
                  <SelectContent>
                    {agreements.map((agreement) => (
                      <SelectItem key={agreement.id} value={agreement.id}>
                        {agreement.vendorName} - ₹{Number(agreement.agreedAmount).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                placeholder="INV-001"
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="₹0"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreateDisabled}
            >
              {createInvoice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <QuotationPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        data={previewData}
        type="invoice"
      />
    </div>
  )
}
