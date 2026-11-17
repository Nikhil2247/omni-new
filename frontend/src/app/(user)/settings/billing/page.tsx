'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, FileText, CreditCard, History, ExternalLink, Receipt, Loader2, RotateCcw } from 'lucide-react';
import { usePaymentHistory } from '@/hooks/queries/use-payment';
import { useUserInvoices, useDownloadInvoice } from '@/hooks/queries/use-invoice';
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useSetDefaultPaymentMethod,
  useRemovePaymentMethod,
} from '@/hooks/queries/use-payment-method';
import { RefundRequestModal } from '@/components/payment/refund-request-modal';
import { RefundHistory } from '@/components/payment/refund-history';
import { PaymentMethodList, AddPaymentMethodModal } from '@/components/payment';
import { PaymentRecord } from '@/lib/api/types/payment.types';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Status badge colors for payments
const statusColors: Record<string, string> = {
  SUCCEEDED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

// Status badge colors for invoices
const invoiceStatusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OPEN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  VOIDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// Format currency with proper locale
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Get purpose display text
function getPurposeDisplay(metadata?: Record<string, any>): string {
  if (!metadata?.purpose) return 'Payment';

  const purposes: Record<string, string> = {
    SUBSCRIPTION: 'Subscription Payment',
    SUBSCRIPTION_UPGRADE: 'Subscription Upgrade',
    AD_CREDITS: 'Ad Credits Purchase',
  };

  return purposes[metadata.purpose] || 'Payment';
}

export default function BillingPage() {
  const { data: payments, isLoading, error } = usePaymentHistory(20);
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useUserInvoices(20);
  const downloadInvoice = useDownloadInvoice();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<PaymentRecord | null>(null);

  // Payment methods state and hooks
  const [addPaymentMethodModalOpen, setAddPaymentMethodModalOpen] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | undefined>(undefined);
  const [removingId, setRemovingId] = useState<string | undefined>(undefined);
  const {
    data: paymentMethods,
    isLoading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethods();
  const addPaymentMethod = useAddPaymentMethod();
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod();
  const removePaymentMethod = useRemovePaymentMethod();

  const handleSetDefaultPaymentMethod = (id: string) => {
    setSettingDefaultId(id);
    setDefaultPaymentMethod.mutate(id, {
      onSettled: () => setSettingDefaultId(undefined),
    });
  };

  const handleRemovePaymentMethod = (id: string) => {
    setRemovingId(id);
    removePaymentMethod.mutate(id, {
      onSettled: () => setRemovingId(undefined),
    });
  };

  // Check if payment is eligible for refund (succeeded and not already refunded)
  const isEligibleForRefund = (payment: PaymentRecord) => {
    return payment.status === 'SUCCEEDED';
  };

  const handleRequestRefund = (payment: PaymentRecord) => {
    setSelectedPaymentForRefund(payment);
    setRefundModalOpen(true);
  };

  // Handle invoice download using the new hook
  const handleInvoiceDownload = (invoiceId: string, invoiceNumber?: string) => {
    downloadInvoice.mutate({ invoiceId, invoiceNumber });
  };

  // Legacy payment invoice download (for payment history section)
  const handleDownloadInvoice = async (paymentId: string) => {
    setDownloadingId(paymentId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/invoices/${paymentId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Failed to download invoice:', err);
      toast.error('Failed to download invoice', {
        description: 'Please try again later or contact support.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const invoices = invoicesData?.invoices || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Billing & Invoices</h1>
        <p className="text-muted-foreground">View your payment history and download invoices</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{payments?.length || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payments?.reduce((sum, p) => p.status === 'SUCCEEDED' ? sum + p.amount : sum, 0) || 0,
                  'INR'
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : payments && payments.length > 0 ? (
              <div className="text-2xl font-bold">
                {format(new Date(payments[0].createdAt), 'MMM dd')}
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Section */}
      <PaymentMethodList
        paymentMethods={paymentMethods}
        isLoading={paymentMethodsLoading}
        error={paymentMethodsError}
        onSetDefault={handleSetDefaultPaymentMethod}
        onRemove={handleRemovePaymentMethod}
        onAddNew={() => setAddPaymentMethodModalOpen(true)}
        isSettingDefault={setDefaultPaymentMethod.isPending}
        isRemoving={removePaymentMethod.isPending}
        settingDefaultId={settingDefaultId}
        removingId={removingId}
      />

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Your recent transactions and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load payment history</p>
              <p className="text-sm">Please try again later</p>
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment history yet</p>
              <p className="text-sm">Your transactions will appear here once you make a payment</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{getPurposeDisplay(payment.metadata)}</span>
                          {payment.gatewayPaymentId && (
                            <span className="text-xs text-muted-foreground">
                              ID: {payment.gatewayPaymentId.slice(0, 12)}...
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payment.status] || 'bg-gray-100 text-gray-800'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.status === 'SUCCEEDED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(payment.id)}
                            disabled={downloadingId === payment.id}
                          >
                            {downloadingId === payment.id ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEligibleForRefund(payment) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestRefund(payment)}
                            title="Request Refund"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoices
          </CardTitle>
          <CardDescription>
            Download and view your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : invoicesError ? (
            <div className="text-center py-4 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load invoices</p>
              <p className="text-sm">Please try again later</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
              <p className="text-sm">Your invoices will appear here after successful payments</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.issuedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={invoiceStatusColors[invoice.status] || 'bg-gray-100 text-gray-800'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInvoiceDownload(invoice.id, invoice.invoiceNumber)}
                          disabled={downloadInvoice.isPending}
                        >
                          {downloadInvoice.isPending && downloadInvoice.variables?.invoiceId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Requests */}
      <RefundHistory isBusinessView={false} />

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need help with billing?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            If you have questions about your billing or need assistance with payments,
            please reach out to our support team.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:support@omnicassion.com">
              Contact Support
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Refund Request Modal */}
      <RefundRequestModal
        isOpen={refundModalOpen}
        onClose={() => {
          setRefundModalOpen(false);
          setSelectedPaymentForRefund(null);
        }}
        payment={selectedPaymentForRefund}
        isBusinessPayment={false}
      />

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={addPaymentMethodModalOpen}
        onClose={() => setAddPaymentMethodModalOpen(false)}
        onAddPaymentMethod={(data) => {
          addPaymentMethod.mutate(data, {
            onSuccess: () => setAddPaymentMethodModalOpen(false),
          });
        }}
        isLoading={addPaymentMethod.isPending}
        isBusinessPayment={false}
      />
    </div>
  );
}
