'use client'

import { useEventCreditBalance } from '@/hooks/queries/use-subscription'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Coins, Gift, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// ============================================================================
// Compact Credit Badge (for header)
// ============================================================================

interface CreditBadgeProps {
  variant?: 'default' | 'minimal'
}

export function CreditBadge({ variant = 'default' }: CreditBadgeProps) {
  const { isAuthenticated } = useAuth()
  const { data: balance, isLoading } = useEventCreditBalance({
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return <Skeleton className="h-8 w-24 rounded-full" />
  }

  const totalCredits = (balance?.basicCredits ?? 0) + (balance?.premiumCredits ?? 0)
  const hasFreeEvent = balance && !balance.freeEventUsed

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/settings/credits">
              <Badge variant="outline" className="gap-1 px-2 py-1 cursor-pointer hover:bg-muted">
                <Coins className="h-3 w-3" />
                <span>{totalCredits}</span>
                {hasFreeEvent && (
                  <Gift className="h-3 w-3 text-emerald-600 ml-1" />
                )}
              </Badge>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {totalCredits} event {totalCredits === 1 ? 'credit' : 'credits'}
              {hasFreeEvent && ' + 1 free event'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Coins className="h-4 w-4" />
          <span>{totalCredits} Credits</span>
          {hasFreeEvent && (
            <Badge variant="secondary" className="ml-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1">
              <Gift className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <CreditBalanceDetails balance={balance} compact />
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// Credit Balance Details (for popover and sidebar)
// ============================================================================

interface CreditBalanceDetailsProps {
  balance?: {
    basicCredits: number
    premiumCredits: number
    freeEventUsed: boolean
  } | null
  compact?: boolean
}

function CreditBalanceDetails({ balance, compact = false }: CreditBalanceDetailsProps) {
  const hasFreeEvent = balance && !balance.freeEventUsed

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Event Credits</h4>
        <Link href="/settings/credits" className="text-xs text-primary hover:underline">
          View Details
        </Link>
      </div>

      <div className="space-y-2">
        {/* Free Event */}
        {hasFreeEvent && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Free Event</span>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              Available
            </Badge>
          </div>
        )}

        {/* Basic Credits */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">Basic</span>
          </div>
          <span className="font-semibold">{balance?.basicCredits ?? 0}</span>
        </div>

        {/* Premium Credits */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm">Premium</span>
          </div>
          <span className="font-semibold">{balance?.premiumCredits ?? 0}</span>
        </div>
      </div>

      <Button asChild className="w-full" size={compact ? 'sm' : 'default'}>
        <Link href="/pricing">
          <Plus className="h-4 w-4 mr-2" />
          Buy More Credits
        </Link>
      </Button>
    </div>
  )
}

// ============================================================================
// Credit Balance Card (for dashboard/sidebar)
// ============================================================================

export function CreditBalanceCard() {
  const { isAuthenticated } = useAuth()
  const { data: balance, isLoading } = useEventCreditBalance({
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }

  const hasFreeEvent = balance && !balance.freeEventUsed
  const totalCredits = (balance?.basicCredits ?? 0) + (balance?.premiumCredits ?? 0)

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Event Credits</h3>
        </div>
        <Link
          href="/settings/credits"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          Manage
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {/* Free Event Banner */}
        {hasFreeEvent && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-800">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
              <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Free Event Available</p>
              <p className="text-xs text-muted-foreground">Create your first Basic event free!</p>
            </div>
          </div>
        )}

        {/* Credit Summary */}
        <div className="grid grid-cols-2 gap-3">
          {/* Basic Credits */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Basic</span>
            </div>
            <p className="text-2xl font-bold">{balance?.basicCredits ?? 0}</p>
          </div>

          {/* Premium Credits */}
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Premium</span>
            </div>
            <p className="text-2xl font-bold">{balance?.premiumCredits ?? 0}</p>
          </div>
        </div>

        {/* No Credits Message */}
        {totalCredits === 0 && !hasFreeEvent && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              No credits remaining. Purchase more to create events.
            </p>
          </div>
        )}

        {/* Buy Button */}
        <Button asChild className="w-full" variant={totalCredits === 0 && !hasFreeEvent ? 'default' : 'outline'}>
          <Link href="/pricing">
            <Plus className="h-4 w-4 mr-2" />
            Buy Credits
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Inline Credit Indicator (for event forms)
// ============================================================================

interface CreditIndicatorProps {
  tier: 'BASIC' | 'PREMIUM'
}

export function CreditIndicator({ tier }: CreditIndicatorProps) {
  const { isAuthenticated } = useAuth()
  const { data: balance, isLoading } = useEventCreditBalance({
    enabled: isAuthenticated,
  })

  if (!isAuthenticated || isLoading) {
    return null
  }

  const hasFreeEvent = balance && !balance.freeEventUsed
  const credits = tier === 'BASIC' ? balance?.basicCredits ?? 0 : balance?.premiumCredits ?? 0
  const hasCredits = credits > 0 || (hasFreeEvent && tier === 'BASIC')

  return (
    <div className={`text-sm flex items-center gap-2 ${hasCredits ? 'text-emerald-600' : 'text-destructive'}`}>
      {hasCredits ? (
        <>
          <Coins className="h-4 w-4" />
          {hasFreeEvent && tier === 'BASIC' ? (
            <span>Free event available</span>
          ) : (
            <span>{credits} {tier.toLowerCase()} {credits === 1 ? 'credit' : 'credits'} remaining</span>
          )}
        </>
      ) : (
        <>
          <Coins className="h-4 w-4" />
          <span>No {tier.toLowerCase()} credits - </span>
          <Link href="/pricing" className="underline hover:no-underline">
            Buy credits
          </Link>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Export components
// ============================================================================

export { CreditBalanceDetails }
