'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarPlus,
  CalendarDays,
  Users,
  MapPin,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
} from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { EventStatus, EventSummary } from '@/lib/api/types/event.types'

const statusOptions: { label: string; value: EventStatus | 'ALL' }[] = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const statusConfig: Record<EventStatus, {
  bg: string
  text: string
  border: string
  icon: React.ReactNode
  gradient: string
}> = {
  PLANNING: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900/50',
    icon: <Clock className="h-3.5 w-3.5" />,
    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20',
  },
  CONFIRMED: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900/50',
    icon: <PlayCircle className="h-3.5 w-3.5" />,
    gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20',
  },
  COMPLETED: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-900/50',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    gradient: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/20',
  },
  CANCELLED: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-900/50',
    icon: <XCircle className="h-3.5 w-3.5" />,
    gradient: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20',
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
}

export function EventsList() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const { data, isLoading, error } = useEvents({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-dashed border-destructive/50 bg-destructive/5 p-8 text-center"
      >
        <p className="text-sm text-destructive">Failed to load events.</p>
      </motion.div>
    )
  }

  if (!data?.data?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Empty className="border-dashed rounded-2xl">
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
      </motion.div>
    )
  }

  const events = data.data

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header with View Toggle and Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your events</h2>
          <p className="text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              onClick={() => setViewMode('card')}
              className="h-8 gap-1.5 px-3 rounded-r-none"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-8 gap-1.5 px-3 rounded-l-none border-l"
            >
              <ListIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>

          {/* Status Filter */}
          <Select onValueChange={(value) => setStatusFilter(value as EventStatus | 'ALL')} value={statusFilter}>
            <SelectTrigger className="w-36 h-8">
              <Filter className="mr-2 h-3.5 w-3.5" />
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

          {/* New Event Button */}
          <Button asChild size="sm" className="h-8">
            <Link href="/events/new">
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              New
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Events Display */}
      {viewMode === 'card' ? (
        <CardView events={events} />
      ) : (
        <ListView events={events} />
      )}
    </motion.div>
  )
}

// Card View Component
function CardView({ events }: { events: EventSummary[] }) {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <AnimatePresence mode="popLayout">
        {events.map((event) => {
          const config = statusConfig[event.status]
          const eventDate = event.date || event.eventDate

          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/events/${event.id}`}>
                <div className={`group relative rounded-xl border ${config.border} bg-gradient-to-br ${config.gradient} p-3 transition-all hover:shadow-lg cursor-pointer h-full`}>
                  {/* Status Badge */}
                  <Badge className={`mb-2 ${config.bg} ${config.text} text-[10px] px-1.5 py-0 border-0 gap-1`}>
                    {config.icon}
                    {event.status.replace(/_/g, ' ')}
                  </Badge>

                  {/* Event Name */}
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>

                  {/* Event Details */}
                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {eventDate
                          ? new Date(eventDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Date TBD'}
                      </span>
                    </div>

                    {event.venueName && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.venueName}</span>
                      </div>
                    )}

                    {event.guestCount ? (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>{event.guestCount} guests</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// List View Component
function ListView({ events }: { events: EventSummary[] }) {
  return (
    <Card className="border-muted/60 overflow-hidden">
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 bg-muted/50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground border-b">
            <div className="col-span-4">Event</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Venue</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Guests</div>
          </div>

          <AnimatePresence mode="popLayout">
            {events.map((event) => {
              const config = statusConfig[event.status]
              const eventDate = event.date || event.eventDate

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Link href={`/events/${event.id}`}>
                    <div className="grid grid-cols-12 items-center gap-2 border-b last:border-0 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer group">
                      <div className="col-span-4 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {event.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          ID: {event.id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="col-span-2 text-sm">
                        {eventDate
                          ? new Date(eventDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'TBD'}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground truncate">
                        {event.venueName || '-'}
                      </div>
                      <div className="col-span-2">
                        <Badge className={`${config.bg} ${config.text} text-[10px] border-0 gap-1`}>
                          {config.icon}
                          {event.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right text-sm">
                        {event.guestCount || 0}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y">
          <AnimatePresence mode="popLayout">
            {events.map((event) => {
              const config = statusConfig[event.status]
              const eventDate = event.date || event.eventDate

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Link href={`/events/${event.id}`}>
                    <div className="p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${config.bg} ${config.text} text-[9px] px-1.5 py-0 border-0 gap-0.5`}>
                              {config.icon}
                              {event.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm truncate">{event.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              <span>
                                {eventDate
                                  ? new Date(eventDate).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                    })
                                  : 'TBD'}
                              </span>
                            </div>
                            {event.guestCount ? (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{event.guestCount}</span>
                              </div>
                            ) : null}
                            {event.venueName && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">{event.venueName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
