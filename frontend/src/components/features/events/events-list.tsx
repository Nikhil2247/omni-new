'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEvents } from '@/hooks/queries/use-events'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BrushBar, Ico, ICONS, PaintedScene, Paper, SketchButton, Stamp } from '@/components/sketch'
import type { EventStatus, EventSummary } from '@/lib/api/types/event.types'

const statusOptions: { label: string; value: EventStatus | 'ALL' }[] = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const statusTone: Record<EventStatus, 'ok' | 'wait' | 'late'> = {
  PLANNING: 'wait',
  CONFIRMED: 'ok',
  IN_PROGRESS: 'wait',
  COMPLETED: 'ok',
  CANCELLED: 'late',
}

/** A stable number from a string, so an event always gets the same painted scene. */
function hashSeed(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h) % 997
}

const QUICK_LINKS = [
  { label: 'Guestlist', href: 'guestlist' },
  { label: 'Checklist', href: 'checklist' },
  { label: 'Budget', href: 'budget' },
  { label: 'Timeline', href: 'timeline' },
  { label: 'Memories', href: 'memories' },
]

function formatDate(eventDate: string | null | undefined, withYear = true) {
  return eventDate
    ? new Date(eventDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        ...(withYear ? { year: 'numeric' as const } : {}),
      })
    : 'Date TBD'
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
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Paper className="p-8 text-center">
          <Stamp tone="late">Error</Stamp>
          <p className="text-ink-soft mt-3 text-sm">Failed to load events.</p>
        </Paper>
      </motion.div>
    )
  }

  if (!data?.data?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Paper className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Ico d={ICONS.calendar} className="h-12 w-12" />
          <h3 className="font-display text-xl font-semibold">No events yet</h3>
          <p className="text-ink-soft max-w-md text-sm">
            Create your first event to unlock checklists, budgets, and guest management.
          </p>
          <SketchButton asChild>
            <Link href="/events/new">Create event</Link>
          </SketchButton>
        </Paper>
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
          <h2 className="font-display text-2xl font-semibold">Your events</h2>
          <p className="text-ink-soft text-sm">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1.5">
            <SketchButton
              size="sm"
              variant={viewMode === 'card' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('card')}
              aria-pressed={viewMode === 'card'}
            >
              Cards
            </SketchButton>
            <SketchButton
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'ghost'}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              List
            </SketchButton>
          </div>

          {/* Status Filter */}
          <Select onValueChange={(value) => setStatusFilter(value as EventStatus | 'ALL')} value={statusFilter}>
            <SelectTrigger className="h-8 w-36" aria-label="Filter by status">
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
          <SketchButton asChild size="sm">
            <Link href="/events/new">New</Link>
          </SketchButton>
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {events.map((event) => {
          const eventDate = event.date || event.eventDate
          const seed = hashSeed(event.id)
          const progress = Math.round(event.checklistProgress ?? 0)

          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Paper className="group flex h-full flex-col gap-3 p-3 transition-transform hover:-translate-y-1">
                <Link href={`/events/${event.id}`} className="flex flex-1 flex-col gap-3">
                  <div className="bg-sky1 relative aspect-[16/9] overflow-hidden rounded-[18px_120px_20px_110px/115px_18px_125px_16px]">
                    <PaintedScene seed={seed} motif={seed % 5} />
                    <Stamp tone={statusTone[event.status]} className="absolute top-2 left-2">
                      {event.status.replace(/_/g, ' ')}
                    </Stamp>
                  </div>

                  <div className="px-1">
                    <h3 className="font-display line-clamp-2 text-xl leading-tight font-semibold">{event.name}</h3>
                    <div className="text-ink-soft mt-2 space-y-1 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Ico d={ICONS.calendar} className="h-4 w-4" />
                        <span className="truncate">{formatDate(eventDate)}</span>
                      </div>
                      {event.venueName && (
                        <div className="flex items-center gap-1.5">
                          <Ico d={ICONS.venue} className="h-4 w-4" />
                          <span className="truncate">{event.venueName}</span>
                        </div>
                      )}
                      {event.guestCount ? (
                        <div className="flex items-center gap-1.5">
                          <Ico d={ICONS.guests} className="h-4 w-4" />
                          <span>{event.guestCount} guests</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <div className="text-ink-soft mb-1 flex items-center justify-between text-xs font-semibold">
                        <span>Checklist</span>
                        <span>{progress}%</span>
                      </div>
                      <BrushBar value={progress} tone="green" />
                    </div>
                  </div>
                </Link>

                <div className="flex flex-wrap gap-1.5 px-1 pb-1">
                  {QUICK_LINKS.map((q) => (
                    <SketchButton key={q.href} asChild variant="ghost" size="sm">
                      <Link href={`/events/${event.id}/${q.href}`}>{q.label}</Link>
                    </SketchButton>
                  ))}
                </div>
              </Paper>
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
    <Paper className="overflow-hidden p-0">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="sk-eyebrow border-ink grid grid-cols-12 border-b-2 px-4 py-3">
          <div className="col-span-4">Event</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Venue</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Guests</div>
        </div>

        <AnimatePresence mode="popLayout">
          {events.map((event) => {
            const eventDate = event.date || event.eventDate

            return (
              <motion.div key={event.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Link href={`/events/${event.id}`}>
                  <div className="border-line hover:bg-blue-wash grid cursor-pointer grid-cols-12 items-center gap-2 border-b-2 border-dashed px-4 py-3 transition-colors last:border-0">
                    <div className="col-span-4 min-w-0">
                      <p className="font-display truncate text-base font-semibold">{event.name}</p>
                      <p className="text-ink-soft truncate text-[11px]">ID: {event.id.slice(0, 8)}...</p>
                    </div>
                    <div className="col-span-2 text-sm">{eventDate ? formatDate(eventDate, false) : 'TBD'}</div>
                    <div className="text-ink-soft col-span-2 truncate text-sm">{event.venueName || '-'}</div>
                    <div className="col-span-2">
                      <Stamp tone={statusTone[event.status]}>{event.status.replace(/_/g, ' ')}</Stamp>
                    </div>
                    <div className="col-span-2 text-right text-sm">{event.guestCount || 0}</div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <AnimatePresence mode="popLayout">
          {events.map((event) => {
            const eventDate = event.date || event.eventDate

            return (
              <motion.div key={event.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Link href={`/events/${event.id}`}>
                  <div className="border-line hover:bg-blue-wash border-b-2 border-dashed p-4 transition-colors last:border-0">
                    <Stamp tone={statusTone[event.status]}>{event.status.replace(/_/g, ' ')}</Stamp>
                    <h3 className="font-display mt-2 truncate text-lg font-semibold">{event.name}</h3>
                    <div className="text-ink-soft mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Ico d={ICONS.calendar} className="h-3.5 w-3.5" />
                        <span>{eventDate ? formatDate(eventDate, false) : 'TBD'}</span>
                      </div>
                      {event.guestCount ? (
                        <div className="flex items-center gap-1">
                          <Ico d={ICONS.guests} className="h-3.5 w-3.5" />
                          <span>{event.guestCount}</span>
                        </div>
                      ) : null}
                      {event.venueName && (
                        <div className="flex items-center gap-1">
                          <Ico d={ICONS.venue} className="h-3.5 w-3.5" />
                          <span className="max-w-[120px] truncate">{event.venueName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Paper>
  )
}

