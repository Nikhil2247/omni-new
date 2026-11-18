'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader, DataTable, StatusBadge, TwoLineCell, StatCard, StatGrid } from '@/components/dash';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  FileText,
  CreditCard,
  History,
  ExternalLink,
  TrendingUp,
  Coins,
  Sparkles,
  Receipt,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  useBusinessPaymentHistory,
  useBusinessPaymentDetail,
} from '@/hooks/queries/use-payment';
import { useBusinessInvoices, useDownloadBusinessInvoice } from '@/hooks/queries/use-invoice';
import { useAdCreditBalance } from '@/hooks/queries/use-subscription';
import {
  useBusinessPaymentMethods,
  useAddBusinessPaymentMethod,
  useSetDefaultBusinessPaymentMethod,
  useRemoveBusinessPaymentMethod,
} from '@/hooks/queries/use-payment-method';
import { RefundRequestModal } from '@/components/payment/refund-request-modal';
import { RefundHistory } from '@/components/payment/refund-history';
import { PaymentMethodList, AddPaymentMethodModal } from '@/components/payment';
import { PaymentRecord } from '@/lib/api/types/payment.types';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Status badge colors for payments
const statusColors: Record<string, string> = {
  SUCCEEDED: 'bg-success/10 text-success',
  PENDING: 'bg-warning/10 text-warning',
  PROCESSING: 'bg-primary/10 text-primary',
  FAILED: 'bg-destructive/10 text-destructive',
  REFUNDED: 'bg-primary/10 text-primary',
};

// Status badge colors for invoices
const invoiceStatusColors: Record<string, string> = {
  PAID: 'bg-success/10 text-success',
  OPEN: 'bg-warning/10 text-warning',
  VOIDED: 'bg-muted text-foreground',
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

export default function BusinessBillingPage() {
  const router = useRouter();
  const { data: payments, isLoading, error } = useBusinessPaymentHistory(20);
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useBusinessInvoices(20);
  const { data: adCredits, isLoading: adCreditsLoading } = useAdCreditBalance();
  const downloadInvoice = useDownloadBusinessInvoice();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
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
  } = useBusinessPaymentMethods();
  const addPaymentMethod = useAddBusinessPaymentMethod();
  const setDefaultPaymentMethod = useSetDefaultBusinessPaymentMethod();
  const removePaymentMethod = useRemoveBusinessPaymentMethod();

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
      const response = await fetch(`/api/business/invoices/${paymentId}/pdf`, {
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
  const filteredInvoices = invoices.filter((i) => {
    const q = invoiceSearch.trim().toLowerCase();
    return !q || i.invoiceNumber.toLowerCase().includes(q) || i.status.toLowerCase().includes(q);
  });
  const filteredPayments = payments?.filter((p) => {
    const q = paymentSearch.trim().toLowerCase();
    return !q || getPurposeDisplay(p.metadata).toLowerCase().includes(q) || p.status.toLowerCase().includes(q) || (p.gatewayPaymentId ?? '').toLowerCase().includes(q);
  });

  // Calculate statistics
  const totalSpent = payments?.reduce(
    (sum, p) => (p.status === 'SUCCEEDED' ? sum + p.amount : sum),
    0
  ) || 0;

  const subscriptionPayments = payments?.filter(
    (p) => p.metadata?.purpose === 'SUBSCRIPTION' || p.metadata?.purpose === 'SUBSCRIPTION_UPGRADE'
  ).length || 0;

  const adCreditPayments = payments?.filter(
    (p) => p.metadata?.purpose === 'AD_CREDITS'
  ).length || 0;

  return (
    <div className="space-y-3">
      <PageHeader title="Billing & Invoices" />

      <StatGrid>
        <StatCard
          label="Total Payments"
          icon={CreditCard}
          value={isLoading ? <Skeleton className="h-6 w-16" /> : payments?.length || 0}
        />
        <StatCard
          label="Total Spent"
          icon={TrendingUp}
          value={isLoading ? <Skeleton className="h-6 w-16" /> : formatCurrency(totalSpent, 'INR')}
        />
        <StatCard
          label="Subscriptions"
          icon={History}
          value={isLoading ? <Skeleton className="h-6 w-16" /> : subscriptionPayments}
          hint="payments"
        />
        <StatCard
          label="Ad Credits"
          icon={Coins}
          value={adCreditsLoading ? <Skeleton className="h-6 w-16" /> : adCredits?.balance?.toLocaleString() || 0}
          hint="available"
        />
      </StatGrid>

      {/* Ad Credits Card */}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10">
              <Coins className="h-4 w-4 text-warning" />
            </div>
            <div>
              {adCreditsLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className="text-base font-semibold">
                  {adCredits?.balance?.toLocaleString() || 0} credits
                </p>
              )}
              <p className="text-xs text-muted-foreground">Ad credits balance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/business/advertising')}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Create Campaign
            </Button>
            <Button size="sm" disabled>Buy Credits</Button>
          </div>
        </CardContent>
      </Card>

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
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Payment History</h2>
        <DataTable<PaymentRecord>
          data={filteredPayments}
          isLoading={isLoading}
          rowKey={(p) => p.id}
          search={{ value: paymentSearch, onChange: setPaymentSearch, placeholder: 'Search payments...' }}
          exportFilename="payments"
          emptyTitle={error ? 'Failed to load payment history' : 'No payment history yet'}
          emptyIcon={FileText}
          columns={[
            {
              id: 'date',
              header: 'Date',
              label: 'Date',
              sortValue: (p) => new Date(p.createdAt),
              exportValue: (p) => p.createdAt,
              cell: (p) => <span className="text-sm">{format(new Date(p.createdAt), 'MMM dd, yyyy')}</span>,
            },
            {
              id: 'description',
              header: 'Description',
              label: 'Description',
              exportValue: (p) => getPurposeDisplay(p.metadata),
              cell: (p) => (
                <TwoLineCell
                  title={getPurposeDisplay(p.metadata)}
                  subtitle={p.gatewayPaymentId ? `ID: ${p.gatewayPaymentId.slice(0, 12)}...` : undefined}
                />
              ),
            },
            {
              id: 'amount',
              header: 'Amount',
              label: 'Amount',
              align: 'right',
              sortValue: (p) => p.amount,
              exportValue: (p) => p.amount,
              cell: (p) => <span className="text-sm font-medium">{formatCurrency(p.amount, p.currency)}</span>,
            },
            {
              id: 'status',
              header: 'Status',
              label: 'Status',
              sortValue: (p) => p.status,
              exportValue: (p) => p.status,
              cell: (p) => <StatusBadge status={p.status} />,
            },
          ]}
          rowActions={(p) => [
            {
              label: 'Download invoice',
              icon: Download,
              visible: p.status === 'SUCCEEDED',
              disabled: downloadingId === p.id,
              onClick: () => handleDownloadInvoice(p.id),
            },
            {
              label: 'Request refund',
              icon: RotateCcw,
              visible: isEligibleForRefund(p),
              onClick: () => handleRequestRefund(p),
            },
          ]}
        />
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Invoices</h2>
        <DataTable
          data={filteredInvoices}
          isLoading={invoicesLoading}
          rowKey={(i) => i.id}
          search={{ value: invoiceSearch, onChange: setInvoiceSearch, placeholder: 'Search invoices...' }}
          exportFilename="invoices"
          emptyTitle={invoicesError ? 'Failed to load invoices' : 'No invoices yet'}
          emptyIcon={Receipt}
          columns={[
            {
              id: 'number',
              header: 'Invoice #',
              label: 'Invoice #',
              sortValue: (i) => i.invoiceNumber,
              exportValue: (i) => i.invoiceNumber,
              cell: (i) => <span className="text-sm font-medium">{i.invoiceNumber}</span>,
            },
            {
              id: 'issued',
              header: 'Issued',
              label: 'Issued',
              sortValue: (i) => new Date(i.issuedAt),
              exportValue: (i) => i.issuedAt,
              cell: (i) => <span className="text-sm">{format(new Date(i.issuedAt), 'MMM dd, yyyy')}</span>,
            },
            {
              id: 'due',
              header: 'Due date',
              label: 'Due date',
              hideBelow: 'md',
              sortValue: (i) => new Date(i.dueDate),
              exportValue: (i) => i.dueDate,
              cell: (i) => <span className="text-sm">{format(new Date(i.dueDate), 'MMM dd, yyyy')}</span>,
            },
            {
              id: 'amount',
              header: 'Amount',
              label: 'Amount',
              align: 'right',
              sortValue: (i) => i.totalAmount,
              exportValue: (i) => i.totalAmount,
              cell: (i) => <span className="text-sm font-medium">{formatCurrency(i.totalAmount, i.currency)}</span>,
            },
            {
              id: 'status',
              header: 'Status',
              label: 'Status',
              sortValue: (i) => i.status,
              exportValue: (i) => i.status,
              cell: (i) => <StatusBadge status={i.status} />,
            },
          ]}
          rowActions={(i) => [
            {
              label: 'Download',
              icon: Download,
              disabled: downloadInvoice.isPending,
              onClick: () => handleInvoiceDownload(i.id, i.invoiceNumber),
            },
          ]}
        />
      </div>

      {/* Refund Requests */}
      <RefundHistory isBusinessView={true} />

      {/* Help Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Need help with billing?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            If you have questions about your business billing, invoices, or need assistance
            with payments, please reach out to our business support team.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:business-support@omnicassion.com">
                Contact Business Support
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/business/settings/subscription">
                Manage Subscription
              </a>
            </Button>
          </div>
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
        isBusinessPayment={true}
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
        isBusinessPayment={true}
      />
    </div>
  );
}
