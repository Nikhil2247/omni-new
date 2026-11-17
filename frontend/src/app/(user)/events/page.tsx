'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { EventsList } from '@/components/features/events/events-list'
import { useEvents } from '@/hooks/queries/use-events'
import { useEventCreditBalance } from '@/hooks/queries/use-subscription'
import { Brush, Eyebrow, Ico, ICONS, Paper, SketchButton, Stamp } from '@/components/sketch'
import { trackDashboard } from '@/lib/analytics/umami'

export default function EventsPage() {
  const { data, isLoading } = useEvents()
  const { data: creditBalance } = useEventCreditBalance()
  const events = data?.data ?? []

  useEffect(() => {
    trackDashboard.sectionView('events', 'user')
  }, [])

  const stats = useMemo(() => {
    const total = events.length
    const upcoming = events.filter(
      (e) => e.eventDate && new Date(e.eventDate) >= new Date()
    ).length
    const completed = events.filter((e) => e.status === 'COMPLETED').length
    const planning = events.filter((e) => e.status === 'PLANNING').length

    return { total, upcoming, completed, planning }
  }, [events])

  const hasFreeEvent = creditBalance ? !creditBalance.freeEventUsed : false
  const basicCredits = creditBalance?.basicCredits ?? 0
  const premiumCredits = creditBalance?.premiumCredits ?? 0
  const totalCredits = basicCredits + premiumCredits
  const hasAnyCredits = totalCredits > 0 || hasFreeEvent

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Eyebrow>Event Management</Eyebrow>
          <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
            Your <Brush>Events</Brush>
          </h1>
          <p className="text-ink-soft mt-3">Create, plan, and manage your dream celebrations</p>
        </div>
        <SketchButton asChild className="self-start sm:self-auto">
          <Link href="/events/new">Create Event</Link>
        </SketchButton>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Paper className="px-4 py-3">
          <p className="sk-eyebrow">Total Events</p>
          <p className="font-display mt-1 text-2xl font-semibold">{stats.total}</p>
        </Paper>
        <Paper alt className="px-4 py-3">
          <p className="sk-eyebrow">Upcoming</p>
          <p className="font-display mt-1 text-2xl font-semibold">{stats.upcoming}</p>
        </Paper>
        <Paper className="px-4 py-3">
          <p className="sk-eyebrow">Completed</p>
          <p className="font-display mt-1 text-2xl font-semibold">{stats.completed}</p>
        </Paper>
        <Paper alt className="px-4 py-3">
          <p className="sk-eyebrow">Planning</p>
          <p className="font-display mt-1 text-2xl font-semibold">{stats.planning}</p>
        </Paper>
        <Paper className="col-span-2 px-4 py-3 xl:col-span-1">
          <p className="sk-eyebrow">Credits Available</p>
          <div className="mt-1 flex items-center gap-1.5">
            {hasFreeEvent ? (
              <Stamp>1 Free</Stamp>
            ) : (
              <p className="font-display text-2xl font-semibold">{totalCredits}</p>
            )}
          </div>
        </Paper>
      </div>

      {/* Free Event Banner for New Users */}
      {hasFreeEvent && stats.total === 0 && (
        <Paper tape className="flex items-start gap-4 px-5 py-5">
          <Ico d={ICONS.heart} className="mt-0.5 h-10 w-10" />
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">Welcome! You have 1 free event</p>
            <p className="text-ink-soft mt-1 text-sm">
              Start planning your first event at no cost. Create your dream celebration and explore all our planning tools.
            </p>
            <SketchButton asChild size="sm" className="mt-3">
              <Link href="/events/new">Create Your Free Event</Link>
            </SketchButton>
          </div>
        </Paper>
      )}

      {/* Credit Balance Section */}
      {!hasFreeEvent && (
        <Paper alt className="px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Ico d={ICONS.wallet} className="h-10 w-10" />
              <div>
                <p className="font-display text-lg font-semibold">Event Credits</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-soft">Basic:</span>
                    <span className="font-semibold">{basicCredits}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Ico d={ICONS.star} className="text-gold h-4 w-4" />
                    <span className="text-ink-soft">Premium:</span>
                    <span className="font-semibold">{premiumCredits}</span>
                  </div>
                </div>
              </div>
            </div>
            {totalCredits === 0 && (
              <SketchButton asChild variant="line" size="sm">
                <Link href="/pricing">Buy Credits</Link>
              </SketchButton>
            )}
          </div>
        </Paper>
      )}

      {/* Events List */}
      <EventsList />
    </div>
  )
}
