'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BudgetPanel } from '@/components/features/events/budget-panel'
import { trackDashboard } from '@/lib/analytics/umami'

export default function BudgetPage() {
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-budget', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <BudgetPanel eventId={eventId} />
    </div>
  )
}
