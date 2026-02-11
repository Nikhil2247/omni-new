'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays, Calendar, ChevronRight, Plus, Clock, MapPin, Star, Sparkles, ListChecks } from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import { useTimeline } from '@/hooks/queries/use-timeline'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

function getDaysUntil(date: string): number {
  const eventDate = new Date(date)
  const today = new Date()
  const diffTime = eventDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function parseTimelineItems(itemsJson: string | any[]): any[] {
  try {
    let items: any[] = []
    
    if (typeof itemsJson === 'string') {
      items = JSON.parse(itemsJson)
    } else if (Array.isArray(itemsJson)) {
      items = itemsJson
    }
    
    return items
  } catch {
    return []
  }
}

function EventCard({ event }: { event: any }) {
  const { data: timeline } = useTimeline(event.id)
  const daysUntil = event.eventDate ? getDaysUntil(event.eventDate) : null
  const isUpcoming = daysUntil !== null && daysUntil >= 0
  const isToday = daysUntil === 0
  const isSoon = daysUntil !== null && daysUntil > 0 && daysUntil <= 7
  const isPast = daysUntil !== null && daysUntil < 0

  // Parse timeline items
  const timelineItems = timeline?.items ? parseTimelineItems(timeline.items) : []
  const hasTimeline = timelineItems.length > 0

  return (
    <Link href={`/events/${event.id}/timeline`}>
      <Card className={`group h-full cursor-pointer overflow-hidden transition-all hover:shadow-md ${
        isToday ? 'ring-2 ring-primary' : ''
      }`}>
        {/* Top gradient bar */}
        <div className={`h-1 w-full ${
          isToday
            ? 'bg-orange-500 dark:bg-orange-600'
            : isSoon
            ? 'bg-yellow-500 dark:bg-yellow-600'
            : isUpcoming
            ? 'bg-green-500 dark:bg-green-600'
            : 'bg-muted'
        }`} />
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {event.eventDate
                  ? new Date(event.eventDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Date not set'}
              </span>
            </div>
            {daysUntil !== null && isUpcoming && (
              <Badge className={
                isToday
                  ? 'bg-orange-500'
                  : isSoon
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }>
                {isToday
                  ? '🎉 Today!'
                  : daysUntil === 1
                  ? 'Tomorrow'
                  : `${daysUntil}d`}
              </Badge>
            )}
            {isPast && (
              <Badge variant="secondary">Completed</Badge>
            )}
          </div>
          <CardTitle className="text-lg transition-colors group-hover:text-primary">
            {event.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Event details */}
          <div className="space-y-2">
            {event.venue && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate font-medium">{event.venue}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
              {hasTimeline ? (
                <>
                  <ListChecks className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium">
                    {timelineItems.length} schedule {timelineItems.length === 1 ? 'item' : 'items'}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    No timeline yet
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Call to action */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/50 dark:to-pink-950/50 px-4 py-3">
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {hasTimeline 
                ? (isToday ? 'View Today\'s Schedule' : 'View Timeline')
                : 'Create Timeline'
              }
            </span>
            <ChevronRight className="h-5 w-5 text-orange-600 dark:text-orange-400 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function TimelinePage() {
  const router = useRouter()
  const { data: response, isLoading } = useEvents()
  const events = response?.data ?? []

  // If user has only one event, redirect to that event's timeline
  useEffect(() => {
    if (events.length === 1) {
      router.replace(`/events/${events[0].id}/timeline`)
    }
  }, [events, router])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="mx-auto max-w-md border-2 border-dashed text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600">
              <CalendarDays className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">No Events Yet</CardTitle>
            <CardDescription className="text-base">
              Create your first event to start planning your wedding timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/events/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.eventDate) return 1
    if (!b.eventDate) return -1
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  })

  // Get nearest upcoming event
  const nearestEvent = sortedEvents.find(e => e.eventDate && getDaysUntil(e.eventDate) >= 0)
  const daysToNearest = nearestEvent?.eventDate ? getDaysUntil(nearestEvent.eventDate) : null

  const upcomingCount = sortedEvents.filter(e => e.eventDate && getDaysUntil(e.eventDate) >= 0).length
  const pastCount = events.length - upcomingCount

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-rose-950/30 p-6">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Event Timeline</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan every moment of your special day
            </p>
          </div>

          {/* Countdown to nearest event */}
          {nearestEvent && daysToNearest !== null && (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <div className="text-center">
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{daysToNearest}</span>
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {daysToNearest === 0 ? 'TODAY' : daysToNearest === 1 ? 'DAY' : 'DAYS'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Event</p>
                <p className="text-sm font-bold">{nearestEvent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {daysToNearest === 0 ? 'Happening today!' : daysToNearest === 1 ? 'Tomorrow' : `in ${daysToNearest} days`}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Sparkles className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">{upcomingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Star className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Past Events</p>
              <p className="text-2xl font-bold">{pastCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Events Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Events</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  )
}
