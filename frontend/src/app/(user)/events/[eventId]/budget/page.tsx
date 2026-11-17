'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BudgetPanel } from '@/components/features/events/budget-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useBudget } from '@/hooks/queries/use-budget'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowLeft, TrendingUp, PiggyBank } from 'lucide-react'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getSpentAmount(items: Array<{ isPaid?: boolean; actualCost?: number | null; estimatedCost?: number | null }> = []): number {
  return items.reduce((sum, item) => {
    if (!item?.isPaid) return sum
    const paidAmount = Number(item.actualCost ?? item.estimatedCost ?? 0)
    return sum + (Number.isFinite(paidAmount) ? paidAmount : 0)
  }, 0)
}

export default function BudgetPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: budget } = useBudget(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-budget', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const totalBudget = Number(budget?.totalBudget || 0)
  const totalSpent = getSpentAmount((budget?.items as Array<{ isPaid?: boolean; actualCost?: number | null; estimatedCost?: number | null }>) || [])
  const remaining = totalBudget - totalSpent
  const itemCount = budget?.items?.length || 0

  return (
    <div className="space-y-4 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/20 sm:p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-yellow-300/30 blur-3xl dark:bg-yellow-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-500/20" />

        <div className="relative">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to event
            </Link>
          </Button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700 shadow-sm dark:bg-amber-950/70 dark:text-amber-200">
                Budget & Calculator
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight sm:text-lg">
                Event Budget
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {event?.name ? (
                  <>Track expenses for <span className="font-medium text-foreground">{event.name}</span></>
                ) : (
                  'Track and manage your event expenses'
                )}
              </p>

              {/* Quick Stats */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-amber-900/50 dark:bg-amber-950/40">
                  <p className="text-[11px] text-muted-foreground">Total Budget</p>
                  <p className="font-semibold">{budget ? formatCurrency(totalBudget) : 'Not set'}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-amber-900/50 dark:bg-amber-950/40">
                  <p className="text-[11px] text-muted-foreground">Spent</p>
                  <p className="font-semibold">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-amber-900/50 dark:bg-amber-950/40 sm:col-span-1">
                  <p className="text-[11px] text-muted-foreground">Remaining</p>
                  <p className={`font-semibold ${remaining < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg self-start lg:self-auto">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Panel */}
      <BudgetPanel eventId={eventId} />
    </div>
  )
}
