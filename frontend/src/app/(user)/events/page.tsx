'use client'

import { EventsList } from '@/components/features/events/events-list'
import { useEvents } from '@/hooks/queries/use-events'
import { Card } from '@/components/ui/card'
import { Calendar, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { useMemo } from 'react'

export default function EventsPage() {
  const { data } = useEvents()
  const events = data?.data ?? []

  const stats = useMemo(() => {
    const total = events.length
    const upcoming = events.filter(e => e.eventDate && new Date(e.eventDate) >= new Date()).length
    const completed = events.filter(e => e.status === 'COMPLETED').length
    const planning = events.filter(e => e.status === 'PLANNING').length
    
    return { total, upcoming, completed, planning }
  }, [events])

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 p-6 md:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold md:text-3xl">Your Dream Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every celebration starts with perfect planning
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">{stats.upcoming}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planning</p>
              <p className="text-2xl font-bold">{stats.planning}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Events List */}
      <EventsList />
    </div>
  )
}
