'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import type { CreditTransactionType } from '@/lib/api/types/subscription.types';

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
  SUBSCRIPTION_GRANT: { icon: Gift, color: 'text-green-600', label: 'Plan Grant' },
  PURCHASE: { icon: ShoppingCart, color: 'text-blue-600', label: 'Purchase' },
  CAMPAIGN_SPEND: { icon: TrendingDown, color: 'text-red-600', label: 'Campaign Spend' },
  REFUND: { icon: ArrowUpRight, color: 'text-green-600', label: 'Refund' },
  ADJUSTMENT: { icon: Receipt, color: 'text-purple-600', label: 'Adjustment' },
  EXPIRY: { icon: ArrowDownRight, color: 'text-orange-600', label: 'Expired' },
};

export default function AdCreditsPage() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const { data: balance, isLoading: isLoadingBalance } = useAdCreditBalance();
  const { data: history, isLoading: isLoadingHistory } = useAdCreditHistory(50);
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
    <div className="container py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold">Ad Credits</h1>
          <p className="text-muted-foreground">Manage your advertising credits</p>
        </div>
        <Button onClick={() => setIsPurchaseModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buy Credits
        </Button>
      </div>

      {/* Balance Overview */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Total Balance - Main */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
              </div>
              {isLoadingBalance ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="text-4xl font-bold">{formatNumber(balance?.balance || 0)}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Available for campaigns
              </p>
            </div>

            {/* Stats */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">30-Day Spending</span>
                </div>
                <div className="text-2xl font-bold">{formatNumber(spending?.totalSpent || 0)}</div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Monthly from Plan</span>
                </div>
                <div className="text-2xl font-bold">+{formatNumber(monthlyCredits)}</div>
                <p className="text-xs text-muted-foreground">
                  {hasActiveSubscription ? `${planName} plan` : 'Upgrade to get monthly credits'}
                </p>
                {canClaimMonthlyCredits ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={handleClaimMonthlyCredits}
                    disabled={claimMonthlyCredits.isPending}
                  >
                    <Gift className="mr-2 h-3 w-3" />
                    {claimMonthlyCredits.isPending ? 'Claiming...' : 'Claim Monthly Credits'}
                  </Button>
                ) : nextClaimDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Next claim: {format(nextClaimDate, 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Your total balance includes purchased credits + monthly plan grants. All credits are pooled together for campaign use.
          </div>
        </CardContent>
      </Card>

      {/* Spending by Campaign Type */}
      {spending?.byCampaignType && Object.keys(spending.byCampaignType).length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Spending by Campaign Type</CardTitle>
            <CardDescription>Last 30 days breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(spending.byCampaignType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm">{type.replace('_', ' ')}</span>
                  <span className="font-semibold">{formatNumber(amount as number)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent credit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((transaction) => {
                  const config = transactionTypeConfig[transaction.type] || {
                    icon: Receipt,
                    color: 'text-gray-600',
                    label: transaction.type,
                  };
                  const Icon = config.icon;
                  const isCredit = ['SUBSCRIPTION_GRANT', 'PURCHASE', 'REFUND'].includes(transaction.type);

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span>{config.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={isCredit ? 'text-green-600' : 'text-red-600'}>
                          {isCredit ? '+' : '-'}{formatNumber(Math.abs(transaction.amount))}
                        </span>
                      </TableCell>
                      <TableCell>{formatNumber(transaction.balance)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Purchase Credits Modal */}
      <PurchaseCreditsModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
    </div>
  );
}
