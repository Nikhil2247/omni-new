'use client'

import { useEventCreditBalance, useEventCreditTransactions } from '@/hooks/queries/use-subscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Coins, Gift, Plus, ArrowUpRight, ArrowDownLeft, RefreshCcw, Calendar, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { EventCreditTransaction, EventCreditTransactionType, EventTier } from '@/lib/api/types/subscription.types'

// ============================================================================
// Helper Functions
// ============================================================================

function formatTransactionType(type: EventCreditTransactionType): { label: string; icon: React.ReactNode; color: string } {
  switch (type) {
    case 'PURCHASE':
      return { label: 'Purchase', icon: <Plus className="h-4 w-4" />, color: 'text-emerald-600' }
    case 'USAGE':
      return { label: 'Used', icon: <ArrowDownLeft className="h-4 w-4" />, color: 'text-blue-600' }
    case 'REFUND':
      return { label: 'Refund', icon: <RefreshCcw className="h-4 w-4" />, color: 'text-orange-600' }
    case 'FREE_GRANT':
      return { label: 'Free Grant', icon: <Gift className="h-4 w-4" />, color: 'text-purple-600' }
    default:
      return { label: type, icon: <Coins className="h-4 w-4" />, color: 'text-muted-foreground' }
  }
}

function formatTier(tier: EventTier): { label: string; color: string } {
  switch (tier) {
    case 'BASIC':
      return { label: 'Basic', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' }
    case 'PREMIUM':
      return { label: 'Premium', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' }
    default:
      return { label: tier, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' }
  }
}

function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

// ============================================================================
// Balance Card Component
// ============================================================================

function BalanceCard({
  title,
  count,
  tier,
  color
}: {
  title: string
  count: number
  tier: EventTier
  color: string
}) {
  return (
    <Card className={color}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-4xl font-bold mt-1">{count}</p>
            <p className="text-sm opacity-70 mt-1">
              {count === 1 ? 'event credit' : 'event credits'}
            </p>
          </div>
          <div className={`p-4 rounded-full ${tier === 'BASIC' ? 'bg-blue-200 dark:bg-blue-800' : 'bg-purple-200 dark:bg-purple-800'}`}>
            <Coins className={`h-8 w-8 ${tier === 'BASIC' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Free Event Card Component
// ============================================================================

function FreeEventCard({ available }: { available: boolean }) {
  if (!available) {
    return (
      <Card className="bg-gray-50 dark:bg-gray-900 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Free Event</p>
              <p className="text-lg font-semibold text-muted-foreground mt-1">Used</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your free event has been used
              </p>
            </div>
            <div className="p-4 rounded-full bg-gray-200 dark:bg-gray-800">
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Free Event</p>
            <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">1</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              Available to use!
            </p>
          </div>
          <div className="p-4 rounded-full bg-emerald-200 dark:bg-emerald-800">
            <Gift className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Transactions Table Component
// ============================================================================

function TransactionsTable({ transactions, isLoading }: { transactions: EventCreditTransaction[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No transactions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Purchase event credits to see your transaction history
        </p>
        <Button asChild className="mt-4">
          <Link href="/pricing">
            <Plus className="h-4 w-4 mr-2" />
            Buy Credits
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Tier</TableHead>
          <TableHead className="text-right">Credits</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const typeInfo = formatTransactionType(tx.type)
          const tierInfo = formatTier(tx.tier)
          const isPositive = tx.amount > 0

          return (
            <TableRow key={tx.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                </div>
              </TableCell>
              <TableCell>
                <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                  {typeInfo.icon}
                  {typeInfo.label}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={tierInfo.color}>
                  {tierInfo.label}
                </Badge>
              </TableCell>
              <TableCell className={`text-right font-semibold ${isPositive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {isPositive ? '+' : ''}{tx.amount}
              </TableCell>
              <TableCell className="text-right">
                {tx.priceInr ? (
                  <div className="flex items-center justify-end gap-1">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {formatPrice(Number(tx.priceInr))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CreditsPage() {
  const { data: balance, isLoading: isBalanceLoading } = useEventCreditBalance()
  const { data: transactions, isLoading: isTransactionsLoading } = useEventCreditTransactions(20)

  const hasFreeEvent = balance && !balance.freeEventUsed
  const basicCredits = balance?.basicCredits ?? 0
  const premiumCredits = balance?.premiumCredits ?? 0
  const totalCredits = basicCredits + premiumCredits + (hasFreeEvent ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Event Credits</h1>
          <p className="text-muted-foreground mt-1">
            Manage your event credits and view transaction history
          </p>
        </div>
        <Button asChild>
          <Link href="/pricing">
            <Plus className="h-4 w-4 mr-2" />
            Buy More Credits
          </Link>
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Available</p>
              {isBalanceLoading ? (
                <Skeleton className="h-12 w-24 mt-1" />
              ) : (
                <p className="text-5xl font-bold">{totalCredits}</p>
              )}
              <p className="text-muted-foreground mt-1">
                event {totalCredits === 1 ? 'credit' : 'credits'}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/events/new" className="inline-flex items-center gap-2 text-primary hover:underline">
                <ArrowUpRight className="h-4 w-4" />
                Create Event
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 text-primary hover:underline">
                <Plus className="h-4 w-4" />
                Buy Credits
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {isBalanceLoading ? (
          <>
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </>
        ) : (
          <>
            <FreeEventCard available={hasFreeEvent ?? false} />
            <BalanceCard
              title="Basic Credits"
              count={basicCredits}
              tier="BASIC"
              color="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
            />
            <BalanceCard
              title="Premium Credits"
              count={premiumCredits}
              tier="PREMIUM"
              color="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
            />
          </>
        )}
      </div>

      {/* Credit Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Credits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Basic Events</p>
                <p className="text-sm text-muted-foreground">
                  Up to 200 guests, 100 memory uploads, 1GB storage
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <Coins className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Premium Events</p>
                <p className="text-sm text-muted-foreground">
                  Unlimited guests and uploads, 10GB storage, custom templates
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 pt-2 border-t">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
              <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Credits Never Expire</p>
              <p className="text-sm text-muted-foreground">
                Use your credits whenever you are ready. No rush!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your credit purchases, usage, and refunds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} isLoading={isTransactionsLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
