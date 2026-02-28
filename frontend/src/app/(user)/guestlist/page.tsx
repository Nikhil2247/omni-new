'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Calendar, ChevronRight, Plus, UserCheck, UserX, Clock, Mail } from 'lucide-react'
import { useEvents } from '@/hooks/queries/use-events'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { trackDashboard } from '@/lib/analytics/umami'

export default function GuestlistPage() {
  const router = useRouter()
  const { data: response, isLoading } = useEvents()
  const events = response?.data ?? []

  // If user has only one event, redirect to that event's guestlist
  useEffect(() => {
    if (events.length === 1) {
      router.replace(`/events/${events[0].id}/guestlist`)
    }
  }, [events, router])

  useEffect(() => { trackDashboard.sectionView('guestlist', 'user') }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
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
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600">
              <Users className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">No Events Yet</CardTitle>
            <CardDescription className="text-base">
              Create your first event to start managing your guest list
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

  // Calculate totals across all events
  const totalGuests = events.reduce((sum, e) => sum + (e.guestCount || 0), 0)
  const totalConfirmed = events.reduce((sum, e) => sum + (e.confirmedGuests || 0), 0)
  const totalDeclined = events.reduce((sum, e) => sum + (e.declinedGuests || 0), 0)
  const totalPending = totalGuests - totalConfirmed - totalDeclined
  const confirmationRate = totalGuests > 0 ? Math.round((totalConfirmed / totalGuests) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-950/30 dark:via-cyan-950/30 dark:to-blue-950/30 p-6">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Guest Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track RSVPs and celebrate with everyone
            </p>
          </div>

          {/* Confirmation Rate Circle */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90 transform">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                className="text-muted/20"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                className="text-teal-500 dark:text-teal-400"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(confirmationRate / 100) * 226.19} 226.19`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{confirmationRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalGuests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold">{totalConfirmed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{totalPending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Declined</p>
              <p className="text-2xl font-bold">{totalDeclined}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Guestlists */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Event Guest Lists</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const eventTotal = event.guestCount || 0
            const eventConfirmed = event.confirmedGuests || 0
            const eventDeclined = event.declinedGuests || 0
            const eventPending = eventTotal - eventConfirmed - eventDeclined
            const eventProgress = eventTotal > 0 ? Math.round((eventConfirmed / eventTotal) * 100) : 0

            return (
              <Link key={event.id} href={`/events/${event.id}/guestlist`}>
                <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-md">
                  {/* Top gradient bar */}
                  <div className="h-1 w-full bg-teal-500 dark:bg-teal-600" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {event.eventDate
                          ? new Date(event.eventDate).toLocaleDateString()
                          : 'Date not set'}
                      </span>
                    </div>
                    <CardTitle className="text-base transition-colors group-hover:text-primary">
                      {event.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Guest count with icons */}
                    <div className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-3xl font-bold text-blue-700">{eventTotal}</p>
                        <p className="text-xs text-muted-foreground">Total Guests</p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border-2 border-green-100 bg-green-50 p-3 text-center">
                        <UserCheck className="mx-auto mb-1 h-4 w-4 text-green-600" />
                        <p className="text-lg font-bold text-green-700">{eventConfirmed}</p>
                        <p className="text-xs text-muted-foreground">Yes</p>
                      </div>
                      <div className="rounded-xl border-2 border-yellow-100 bg-yellow-50 p-3 text-center">
                        <Clock className="mx-auto mb-1 h-4 w-4 text-yellow-600" />
                        <p className="text-lg font-bold text-yellow-700">{eventPending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="rounded-xl border-2 border-gray-100 bg-gray-50 p-3 text-center">
                        <UserX className="mx-auto mb-1 h-4 w-4 text-gray-600" />
                        <p className="text-lg font-bold text-gray-700">{eventDeclined}</p>
                        <p className="text-xs text-muted-foreground">No</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">RSVP Progress</span>
                        <span className="font-bold text-primary">{eventProgress}%</span>
                      </div>
                      <Progress value={eventProgress} className="h-2" />
                    </div>

                    {/* View button */}
                    <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                      <span className="text-sm font-medium text-primary">Manage Guests</span>
                      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
