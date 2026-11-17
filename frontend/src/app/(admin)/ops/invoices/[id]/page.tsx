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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  PENDING: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: <Clock className="h-4 w-4" /> },
  PARTIALLY_PAID: { label: 'Partially Paid', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: <CreditCard className="h-4 w-4" /> },
  PAID: { label: 'Paid', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: <CheckCircle className="h-4 w-4" /> },
  OVERDUE: { label: 'Overdue', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <AlertCircle className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20', icon: <AlertCircle className="h-4 w-4" /> },
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
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{invoice.invoiceNumber}</h1>
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Issued {format(new Date(invoice.issuedAt), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreviewDialog(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Print / Download
          </Button>
          {canMarkPaid && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <CreditCard className="mr-2 h-4 w-4" />
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
                    className="bg-green-600 hover:bg-green-700"
                    disabled={markPaid.isPending}
                  >
                    {markPaid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Payment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(amount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Invoice Number</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Issued Date</span>
              <span className="font-medium">{format(new Date(invoice.issuedAt), 'PPP')}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">{format(new Date(invoice.dueDate), 'PPP')}</span>
              </div>
            )}
            {invoice.paidAt && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Paid Date</span>
                <span className="font-medium text-green-600">{format(new Date(invoice.paidAt), 'PPP')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor & Event Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Vendor & Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.vendorAgreement && (
              <>
                <div className="py-3 border-b">
                  <p className="text-sm text-muted-foreground mb-1">Vendor</p>
                  <p className="font-semibold text-lg">{invoice.vendorAgreement.vendorName}</p>
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
                        className="font-semibold text-lg hover:text-primary flex items-center gap-1"
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
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="text-center py-3">{item.quantity}</td>
                    <td className="text-right py-3">{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="text-right py-3 font-medium">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={3} className="text-right py-3">Total</td>
                  <td className="text-right py-3">{formatCurrency(amount, invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
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
