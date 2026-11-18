'use client';

import { useState } from 'react';
import { PageHeader, DataTable, FilterSelect, StatCard, StatGrid } from '@/components/dash';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Coins,
  Plus,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingCart,
  Receipt,
} from 'lucide-react';
import { useAdCreditBalance, useAdCreditHistory, useSpendingSummary, useVendorSubscription, useClaimMonthlyCredits } from '@/hooks/queries/use-subscription';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { PurchaseCreditsModal } from '@/components/credits/purchase-credits-modal';
import type { CreditTransactionType, AdCreditTransaction } from '@/lib/api/types/subscription.types';

// Format number with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString('en-IN');
}

// Format currency helper
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

const transactionTypeConfig: Record<CreditTransactionType, { icon: typeof Gift; color: string; label: string }> = {
  SUBSCRIPTION_GRANT: { icon: Gift, color: 'text-success', label: 'Plan Grant' },
  PURCHASE: { icon: ShoppingCart, color: 'text-primary', label: 'Purchase' },
  CAMPAIGN_SPEND: { icon: TrendingDown, color: 'text-destructive', label: 'Campaign Spend' },
  REFUND: { icon: ArrowUpRight, color: 'text-success', label: 'Refund' },
  ADJUSTMENT: { icon: Receipt, color: 'text-primary', label: 'Adjustment' },
  EXPIRY: { icon: ArrowDownRight, color: 'text-warning', label: 'Expired' },
};

export default function AdCreditsPage() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: balance, isLoading: isLoadingBalance } = useAdCreditBalance();
  const { data: rawHistory, isLoading: isLoadingHistory } = useAdCreditHistory(50);
  const history = rawHistory?.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    const q = search.trim().toLowerCase();
    return !q || (t.description ?? '').toLowerCase().includes(q);
  });
  const { data: spending } = useSpendingSummary(
    subDays(new Date(), 30).toISOString(),
    new Date().toISOString()
  );
  const { data: subscription } = useVendorSubscription();
  const claimMonthlyCredits = useClaimMonthlyCredits();

  // Get plan info from subscription
  const hasActiveSubscription = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
  const planName = subscription?.plan?.name || 'Free';

  // Check if monthly credits can be claimed (from balance response)
  const canClaimMonthlyCredits = balance?.canClaimMonthly ?? false;
  const nextClaimDate = balance?.nextClaimDate ? new Date(balance.nextClaimDate) : null;

  const handleClaimMonthlyCredits = async () => {
    try {
      const result = await claimMonthlyCredits.mutateAsync();
      if (result.success) {
        toast.success(result.message, {
          description: result.creditsGranted ? `+${result.creditsGranted} credits added to your balance` : undefined,
        });
      } else {
        toast.info(result.message);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim monthly credits';
      toast.error(errorMessage);
    }
  };

  // Get monthly credits from plan features (if available)
  const monthlyCredits = subscription?.plan?.features?.find(
    (f) => f.featureKey === 'ad_credits_monthly' || f.featureKey === 'monthly_ad_credits' || f.featureName?.toLowerCase().includes('credit')
  )?.limitValue || 0;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Ad Credits"
        actions={
          <Button size="sm" onClick={() => setIsPurchaseModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Buy Credits
          </Button>
        }
      />

      <StatGrid className="lg:grid-cols-3">
        <StatCard
          label="Total Balance"
          icon={Coins}
          accent="text-primary"
          value={isLoadingBalance ? <Skeleton className="h-6 w-16" /> : formatNumber(balance?.balance || 0)}
          hint="Purchased credits + monthly plan grants, pooled for campaigns"
        />
        <StatCard
          label="30-Day Spending"
          icon={TrendingDown}
          value={formatNumber(spending?.totalSpent || 0)}
        />
        <div className="bg-card flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-xs">Monthly from Plan</p>
            <p className="text-lg leading-tight font-semibold tabular-nums">+{formatNumber(monthlyCredits)}</p>
            <p className="text-muted-foreground truncate text-[11px]">
              {hasActiveSubscription ? `${planName} plan` : 'Upgrade to get monthly credits'}
              {!canClaimMonthlyCredits && nextClaimDate ? ` · Next claim: ${format(nextClaimDate, 'MMM d, yyyy')}` : ''}
            </p>
          </div>
          {canClaimMonthlyCredits && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClaimMonthlyCredits}
              disabled={claimMonthlyCredits.isPending}
            >
              <Gift className="mr-1.5 h-3 w-3" />
              {claimMonthlyCredits.isPending ? 'Claiming...' : 'Claim'}
            </Button>
          )}
        </div>
      </StatGrid>

      {spending?.byCampaignType && Object.keys(spending.byCampaignType).length > 0 && (
        <StatGrid>
          {Object.entries(spending.byCampaignType).map(([type, amount]) => (
            <StatCard key={type} label={type.replace('_', ' ')} value={formatNumber(amount as number)} />
          ))}
        </StatGrid>
      )}

      <DataTable<AdCreditTransaction>
        data={history}
        isLoading={isLoadingHistory}
        rowKey={(t) => t.id}
        search={{ value: search, onChange: setSearch, placeholder: 'Search transactions...' }}
        filters={
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={Object.entries(transactionTypeConfig).map(([value, c]) => ({ value, label: c.label }))}
          />
        }
        exportFilename="credit-transactions"
        emptyTitle="No transactions yet"
        emptyIcon={Coins}
        columns={[
          {
            id: 'type',
            header: 'Type',
            label: 'Type',
            sortValue: (t) => t.type,
            exportValue: (t) => transactionTypeConfig[t.type]?.label ?? t.type,
            cell: (t) => {
              const config = transactionTypeConfig[t.type] || { icon: Receipt, color: 'text-muted-foreground', label: t.type };
              const Icon = config.icon;
              return (
                <div className="flex items-center gap-2 text-sm">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span>{config.label}</span>
                </div>
              );
            },
          },
          {
            id: 'description',
            header: 'Description',
            label: 'Description',
            hideBelow: 'md',
            exportValue: (t) => t.description ?? '',
            cell: (t) => <span className="text-muted-foreground text-sm">{t.description || '-'}</span>,
          },
          {
            id: 'amount',
            header: 'Amount',
            label: 'Amount',
            align: 'right',
            sortValue: (t) => t.amount,
            exportValue: (t) => t.amount,
            cell: (t) => {
              const isCredit = ['SUBSCRIPTION_GRANT', 'PURCHASE', 'REFUND'].includes(t.type);
              return (
                <span className={`text-sm font-medium ${isCredit ? 'text-success' : 'text-destructive'}`}>
                  {isCredit ? '+' : '-'}
                  {formatNumber(Math.abs(t.amount))}
                </span>
              );
            },
          },
          {
            id: 'balance',
            header: 'Balance',
            label: 'Balance',
            align: 'right',
            sortValue: (t) => t.balance,
            exportValue: (t) => t.balance,
            cell: (t) => <span className="text-sm">{formatNumber(t.balance)}</span>,
          },
          {
            id: 'date',
            header: 'Date',
            label: 'Date',
            sortValue: (t) => new Date(t.createdAt),
            exportValue: (t) => t.createdAt,
            cell: (t) => (
              <span className="text-muted-foreground text-sm">{format(new Date(t.createdAt), 'MMM d, yyyy HH:mm')}</span>
            ),
          },
        ]}
      />

      {/* Purchase Credits Modal */}
      <PurchaseCreditsModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
    </div>
  );
}
