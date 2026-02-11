'use client'

import Link from 'next/link'
import { CalendarDays, Users, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EventSummary, EventStatus } from '@/lib/api/types/event.types'

const statusStyles: Record<EventStatus, string> = {
  PLANNING: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  CONFIRMED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  COMPLETED: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
  CANCELLED: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
}

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{event.name}</CardTitle>
            <Badge variant="outline" className={statusStyles[event.status]}>
              {event.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Event ID: {event.id}</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}</span>
          </div>
          {event.venueName && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{event.venueName}</span>
            </div>
          )}
          {event.guestCount ? (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{event.guestCount} guests expected</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}
