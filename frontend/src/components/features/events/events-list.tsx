'use client'

import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import { EventCard } from './event-card'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import type { EventStatus } from '@/lib/api/types/event.types'

const statusOptions: { label: string; value: EventStatus | 'ALL' }[] = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export function EventsList() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL')
  const { data, isLoading, error } = useEvents({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-lg border p-6 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load events.</div>
  }

  if (!data?.data?.length) {
    return (
      <Empty className="border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarPlus className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>No events yet</EmptyTitle>
          <EmptyDescription>
            Create your first event to unlock checklists, budgets, and guest management.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/events/new">Create event</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your events</h2>
          <p className="text-sm text-muted-foreground">Track all upcoming milestones and vendor tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select onValueChange={(value) => setStatusFilter(value as EventStatus | 'ALL')} value={statusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/events/new">New event</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.data?.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
