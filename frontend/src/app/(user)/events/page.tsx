'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { EventsList } from '@/components/features/events/events-list'
import { useEvents } from '@/hooks/queries/use-events'
import { useEventCreditBalance } from '@/hooks/queries/use-subscription'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  PlusCircle,
  Gift,
  Coins,
  Crown,
} from 'lucide-react'
import { trackDashboard } from '@/lib/analytics/umami'
import { cn } from '@/lib/utils'

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
    <div className="space-y-8 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-200/60 bg-linear-to-br from-purple-50 via-pink-50 to-orange-50 p-6 shadow-sm dark:border-purple-900/40 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-orange-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-500/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-700 shadow-sm dark:bg-purple-950/70 dark:text-purple-200">
              Event Management
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your Events
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Create, plan, and manage your dream celebrations
            </p>

            {/* Credit Balance Display */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-purple-900/50 dark:bg-purple-950/40">
                <p className="text-[11px] text-muted-foreground">Total Events</p>
                <p className="font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-purple-900/50 dark:bg-purple-950/40">
                <p className="text-[11px] text-muted-foreground">Upcoming</p>
                <p className="font-semibold">{stats.upcoming}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-purple-900/50 dark:bg-purple-950/40 sm:col-span-1">
                <p className="text-[11px] text-muted-foreground">Credits Available</p>
                <div className="flex items-center gap-1.5">
                  {hasFreeEvent ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    >
                      <Gift className="mr-1 h-3 w-3" />1 Free
                    </Badge>
                  ) : (
                    <p className="font-semibold">{totalCredits}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            asChild
            className="self-start rounded-full border-0 bg-foreground px-6 text-background shadow-md transition-transform hover:scale-[1.02] hover:bg-foreground/90 sm:self-auto"
          >
            <Link href="/events/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Credit Balance Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-purple-200/70 bg-linear-to-br from-purple-50 to-white dark:border-purple-900/60 dark:from-purple-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total Events
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-pink-200/70 bg-linear-to-br from-pink-50 to-white dark:border-pink-900/60 dark:from-pink-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/30">
                <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Upcoming
                </p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-200/70 bg-linear-to-br from-emerald-50 to-white dark:border-emerald-900/60 dark:from-emerald-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-200/70 bg-linear-to-br from-blue-50 to-white dark:border-blue-900/60 dark:from-blue-950/25 dark:to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Planning
                </p>
                <p className="text-2xl font-bold">{stats.planning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Event Banner for New Users */}
      {hasFreeEvent && stats.total === 0 && (
        <Card className="rounded-2xl border-emerald-200 bg-linear-to-br from-emerald-50 to-green-50 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-green-950/20">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Gift className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Welcome! You have 1 free event
              </p>
              <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-400/80">
                Start planning your first event at no cost. Create your dream celebration and explore all our planning tools.
              </p>
              <Button
                asChild
                className="mt-3 rounded-full bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                <Link href="/events/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your Free Event
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Balance Section */}
      {!hasFreeEvent && (
        <Card className="rounded-2xl border-amber-200/70 bg-linear-to-br from-amber-50 to-orange-50 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/20">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Coins className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Event Credits
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-600 dark:text-blue-400">Basic:</span>
                      <span className="font-semibold">{basicCredits}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-purple-600 dark:text-purple-400">Premium:</span>
                      <span className="font-semibold">{premiumCredits}</span>
                    </div>
                  </div>
                </div>
              </div>
              {totalCredits === 0 && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-amber-300 hover:bg-amber-100"
                  size="sm"
                >
                  <Link href="/pricing">Buy Credits</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Events</h2>
        </div>
        <EventsList />
      </div>
    </div>
  )
}
