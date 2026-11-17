'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { BudgetPanel } from '@/components/features/events/budget-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useBudget } from '@/hooks/queries/use-budget'
import { Brush, Eyebrow, Paper, SketchButton } from '@/components/sketch'
import { ArrowLeft } from 'lucide-react'

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

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <SketchButton variant="ghost" size="sm" asChild className="mb-3">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
        </SketchButton>

        <Eyebrow>Budget &amp; Calculator</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Event <Brush>Budget</Brush>
        </h1>
        <p className="text-ink-soft mt-3 max-w-2xl">
          {event?.name ? (
            <>Track expenses for <span className="text-ink font-medium">{event.name}</span></>
          ) : (
            'Track and manage your event expenses'
          )}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-2xl">
          <Paper className="px-4 py-3">
            <p className="sk-eyebrow">Total Budget</p>
            <p className="font-display mt-1 text-2xl font-semibold">{budget ? formatCurrency(totalBudget) : 'Not set'}</p>
          </Paper>
          <Paper className="px-4 py-3">
            <p className="sk-eyebrow">Spent</p>
            <p className="font-display mt-1 text-2xl font-semibold">{formatCurrency(totalSpent)}</p>
          </Paper>
          <Paper className="col-span-2 px-4 py-3 sm:col-span-1">
            <p className="sk-eyebrow">Remaining</p>
            <p className={`font-display mt-1 text-2xl font-semibold ${remaining < 0 ? 'text-rose' : ''}`}>
              {formatCurrency(remaining)}
            </p>
          </Paper>
        </div>
      </div>

      {/* Budget Panel */}
      <BudgetPanel eventId={eventId} />
    </div>
  )
}
