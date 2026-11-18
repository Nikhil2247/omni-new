'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Receipt,
  Building,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  CreditCard,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useMarkInvoicePaid } from '@/hooks/queries/use-ops'
import { PageHeader, DataTable, StatusBadge, type DataColumn } from '@/components/dash'
import { QuotationPreviewDialog } from '@/components/features/ops/quotation-preview-dialog'
import type { QuotationTemplateData } from '@/components/features/ops/quotation-template'

interface InvoiceDetail {
  id: string
  invoiceNumber: string
  amount: string | number
  status: string
  currency: string
  items: Array<{ description: string; quantity: number; rate: number; amount: number }>
  issuedAt: string
  dueDate: string | null
  paidAt: string | null
  vendorAgreement?: {
    id: string
    vendorName: string
    agreedAmount: string | number
    activeEvent?: {
      id: string
      clientName: string
      clientEmail?: string
      clientPhone?: string
      eventType: string
      eventDate: string
      venueName?: string
    }
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'bg-warning/10 text-warning border-warning/40', icon: <Clock className="h-4 w-4" /> },
  PARTIALLY_PAID: { label: 'Partially Paid', color: 'bg-primary/10 text-primary border-primary/40', icon: <CreditCard className="h-4 w-4" /> },
  PAID: { label: 'Paid', color: 'bg-success/10 text-success border-success/40', icon: <CheckCircle className="h-4 w-4" /> },
  OVERDUE: { label: 'Overdue', color: 'bg-destructive/10 text-destructive border-destructive/40', icon: <AlertCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-muted-foreground/10 text-foreground border-border', icon: <AlertCircle className="h-4 w-4" /> },
}

function formatCurrency(amount: number | string | null | undefined, currency = 'INR'): string {
  if (amount === null || amount === undefined) return '-'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num)
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params?.id as string
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  const { data: invoice, isLoading, error } = useQuery<InvoiceDetail>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: InvoiceDetail }>(`/ops/invoices/${invoiceId}`)
      return response.data.data
    },
    enabled: !!invoiceId,
  })

  const markPaid = useMarkInvoicePaid()

  const handleMarkPaid = async () => {
    await markPaid.mutateAsync(invoiceId)
  }

  const getTemplateData = (): QuotationTemplateData | null => {
    if (!invoice) return null

    const amount = typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount

    return {
      quotationNumber: invoice.invoiceNumber,
      dateIssued: invoice.issuedAt,
      validUntil: invoice.dueDate,
      clientName: invoice.vendorAgreement?.activeEvent?.clientName || 'N/A',
      clientEmail: invoice.vendorAgreement?.activeEvent?.clientEmail,
      clientPhone: invoice.vendorAgreement?.activeEvent?.clientPhone,
      vendorName: invoice.vendorAgreement?.vendorName || 'N/A',
      items: invoice.items?.length ? invoice.items : [
        { description: 'Services as per agreement', quantity: 1, rate: amount, amount: amount }
      ],
      subtotal: amount,
      grandTotal: amount,
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-2" />
        <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">The invoice you're looking for doesn't exist or has been deleted.</p>
        <Button variant="outline" onClick={() => router.push('/ops/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.PENDING
  const amount = typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount
  const canMarkPaid = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED'

  const itemColumns: DataColumn<InvoiceDetail['items'][number]>[] = [
    { id: 'description', header: 'Description', label: 'Description', cell: (item) => item.description, sortValue: (item) => item.description },
    { id: 'quantity', header: 'Qty', label: 'Qty', align: 'center', cell: (item) => item.quantity, sortValue: (item) => item.quantity },
    { id: 'rate', header: 'Rate', label: 'Rate', align: 'right', cell: (item) => formatCurrency(item.rate, invoice.currency), sortValue: (item) => item.rate },
    { id: 'amount', header: 'Amount', label: 'Amount', align: 'right', cell: (item) => <span className="font-medium">{formatCurrency(item.amount, invoice.currency)}</span>, sortValue: (item) => item.amount },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title={invoice.invoiceNumber}
        leading={
          <Button variant="ghost" size="icon" className="size-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
        actions={
          <>
            <StatusBadge status={invoice.status}>{statusConfig.label}</StatusBadge>
            <Button variant="outline" size="sm" onClick={() => setShowPreviewDialog(true)}>
              <Printer className="mr-1 h-4 w-4" />
              Print / Download
            </Button>
            {canMarkPaid && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="bg-success hover:bg-success">
                    <CreditCard className="mr-1 h-4 w-4" />
                    Mark as Paid
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Invoice as Paid</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark invoice {invoice.invoiceNumber} as paid. This action can be reversed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleMarkPaid}
                      className="bg-success hover:bg-success"
                      disabled={markPaid.isPending}
                    >
                      {markPaid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Payment
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {/* Invoice Details */}
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Receipt className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-success">{formatCurrency(amount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Invoice Number</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={invoice.status}>{statusConfig.label}</StatusBadge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Issued Date</span>
              <span className="font-medium">{format(new Date(invoice.issuedAt), 'PPP')}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">{format(new Date(invoice.dueDate), 'PPP')}</span>
              </div>
            )}
            {invoice.paidAt && (
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Paid Date</span>
                <span className="font-medium text-success">{format(new Date(invoice.paidAt), 'PPP')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor & Event Info */}
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building className="h-5 w-5" />
              Vendor & Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3">
            {invoice.vendorAgreement && (
              <>
                <div className="py-2 border-b">
                  <p className="text-sm text-muted-foreground mb-1">Vendor</p>
                  <p className="font-semibold">{invoice.vendorAgreement.vendorName}</p>
                  <p className="text-sm text-muted-foreground">
                    Agreement: {formatCurrency(invoice.vendorAgreement.agreedAmount)}
                  </p>
                </div>

                {invoice.vendorAgreement.activeEvent && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Event</p>
                      <Link
                        href={`/ops/events/${invoice.vendorAgreement.activeEvent.id}`}
                        className="font-semibold hover:text-primary flex items-center gap-1"
                      >
                        {invoice.vendorAgreement.activeEvent.clientName}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <p className="text-sm text-muted-foreground capitalize">
                        {invoice.vendorAgreement.activeEvent.eventType}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(invoice.vendorAgreement.activeEvent.eventDate), 'PPP')}</span>
                    </div>

                    {invoice.vendorAgreement.activeEvent.venueName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{invoice.vendorAgreement.activeEvent.venueName}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {invoice.items && invoice.items.length > 0 && (
        <div className="space-y-1.5">
          <DataTable
            data={invoice.items}
            rowKey={(item) => `${item.description}-${item.quantity}-${item.rate}`}
            defaultPageSize={10}
            exportFilename="invoice-items"
            columns={itemColumns}
          />
          <div className="flex justify-end gap-3 px-3 text-sm font-semibold">
            <span>Total</span>
            <span>{formatCurrency(amount, invoice.currency)}</span>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <QuotationPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        data={getTemplateData()}
        type="invoice"
      />
    </div>
  )
}
