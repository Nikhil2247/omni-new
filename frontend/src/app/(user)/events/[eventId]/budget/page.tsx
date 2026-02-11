'use client'

import { useParams } from 'next/navigation'
import { BudgetPanel } from '@/components/features/events/budget-panel'

export default function BudgetPage() {
  const params = useParams()
  const eventId = params.eventId as string

  if (!eventId) {
    return null
  }

  return (
    <div className="space-y-6">
      <BudgetPanel eventId={eventId} />
    </div>
  )
}
