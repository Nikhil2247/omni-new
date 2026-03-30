'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useOpsInvoices,
  useOpsAllInvoices,
  useCreateInvoice,
  useMarkInvoicePaid,
  useDeleteInvoice,
  useOpsAgreements,
} from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreVertical,
  Trash2,
  Loader2,
  Receipt,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Building,
  Calendar,
  ExternalLink,
  Printer,
} from 'lucide-react'
import { QuotationPreviewDialog } from './quotation-preview-dialog'
import type { QuotationTemplateData } from './quotation-template'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  PARTIALLY_PAID: { label: 'Partially paid', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: <CreditCard className="h-3 w-3" /> },
  PAID: { label: 'Paid', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: <CheckCircle2 className="h-3 w-3" /> },
  OVERDUE: { label: 'Overdue', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <AlertCircle className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: <AlertCircle className="h-3 w-3" /> },
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

  if (!vendorAgreementId && !activeEventId) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">Select an agreement to view invoices</p>
          <p className="text-sm text-muted-foreground mt-1">Invoices are linked to vendor agreements.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-destructive">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-medium">Failed to load invoices</p>
      </div>
    )
  }

  const totalAmount = data?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0
  const paidAmount = data?.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0
  const pendingAmount = totalAmount - paidAmount
  const paidCount = data?.filter(inv => inv.status === 'PAID').length || 0
  const isCreateDisabled = !invoiceForm.vendorAgreementId || !invoiceForm.invoiceNumber || !invoiceForm.amount || createInvoice.isPending

  return (
    <div className="space-y-2">
      {/* Header */}
      {showCreateButton && (vendorAgreementId || (agreements && agreements.length > 0)) && (
        <div className="flex justify-end mb-2">
          <Button size="sm" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Invoice
          </Button>
        </div>
      )}

      {/* Invoices List */}
      {!data?.length ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No invoices yet
        </div>
      ) : (
        <div className="divide-y">
          {data.map((invoice) => {
            const status = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING
            const amount = Number(invoice.amount) || 0
            const canMarkPaid = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED'

            return (
              <div key={invoice.id} className="flex items-center justify-between py-2 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {invoice.vendorAgreement && (
                      <span>{invoice.vendorAgreement.vendorName}</span>
                    )}
                    {invoice.issuedAt && (
                      <span>{new Date(invoice.issuedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">${amount.toLocaleString()}</span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => openPreview(invoice)}
                    >
                      Print
                    </Button>

                    {canMarkPaid && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleMarkPaid(invoice.id)}
                        disabled={markPaid.isPending}
                      >
                        {markPaid.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark Paid'}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/ops/invoices/${invoice.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(invoice.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a vendor agreement.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!vendorAgreementId && agreements && agreements.length > 0 && (
              <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                placeholder="INV-001"
                value={invoiceForm.invoiceNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
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
