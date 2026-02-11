'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useOpsInvoices,
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
  FileText,
} from 'lucide-react'

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
  const [invoiceForm, setInvoiceForm] = useState({
    vendorAgreementId: vendorAgreementId || '',
    amount: '',
    invoiceNumber: '',
  })

  const { data, isLoading, error } = useOpsInvoices(vendorAgreementId || '')
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
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{data?.length || 0}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-blue-600">${totalAmount.toLocaleString()}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-orange-600">${pendingAmount.toLocaleString()}</p>
          </div>
        </div>

        {showCreateButton && (vendorAgreementId || (agreements && agreements.length > 0)) && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Invoices List */}
      {!data?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No invoices found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {vendorAgreementId ? 'Create the first invoice for this agreement.' : 'No invoices available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((invoice) => {
            const status = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING
            const amount = Number(invoice.amount) || 0
            const canMarkPaid = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED'

            return (
              <Card key={invoice.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded bg-primary/10">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">
                          {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <Badge variant="outline" className={status.color}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-lg text-green-600">${amount.toLocaleString()}</span>
                        </div>

                        {invoice.vendorAgreement && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>{invoice.vendorAgreement.vendorName || 'Unknown Vendor'}</span>
                          </div>
                        )}

                        {invoice.vendorAgreement?.activeEvent && (
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/ops/events/${invoice.vendorAgreement.activeEvent.id}`}
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              {invoice.vendorAgreement.activeEvent.clientName}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {invoice.issuedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {invoice.paidAt && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid: {new Date(invoice.paidAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canMarkPaid && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkPaid(invoice.id)}
                          disabled={markPaid.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {markPaid.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="mr-1 h-3 w-3" />
                              Mark Paid
                            </>
                          )}
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/ops/invoices/${invoice.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this invoice? This action cannot be undone.
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
                </CardContent>
              </Card>
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
                        {agreement.vendorName} - ${Number(agreement.agreedAmount).toLocaleString()}
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
                placeholder="$0"
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
    </div>
  )
}
