'use client'

import Link from 'next/link'
import { useMemo, useEffect } from 'react'
import { Calendar, Heart, MessageSquare, Sparkles, Plus, Search, TrendingUp, CheckCircle2, Users } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useEvents } from '@/hooks/queries/use-events'
import { useUserLeads } from '@/hooks/queries/use-leads'
import { useWishlistMine } from '@/hooks/queries/use-wishlists'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { trackDashboard } from '@/lib/analytics/umami'

export default function UserDashboardPage() {
  const { user } = useAuthStore()
  const plannerId = user?.id

  const { data: eventsData, isLoading: eventsLoading } = useEvents({ page: 1, limit: 6 })
  const { data: leadsData, isLoading: leadsLoading } = useUserLeads({
    plannerId: plannerId ?? '',
    page: 1,
    limit: 6,
  })
  const { data: wishlists = [], isLoading: wishlistLoading } = useWishlistMine(Boolean(plannerId))

  // Track dashboard view once on mount
  useEffect(() => { trackDashboard.view('user') }, [])

  const upcomingEvents = useMemo(() => {
    const events = eventsData?.data ?? []
    return [...events]
      .filter((event) => (event.eventDate ? new Date(event.eventDate) >= new Date() : true))
      .sort((a, b) => {
        const aDate = a.eventDate ? new Date(a.eventDate).getTime() : Number.MAX_SAFE_INTEGER
        const bDate = b.eventDate ? new Date(b.eventDate).getTime() : Number.MAX_SAFE_INTEGER
        return aDate - bDate
      })
      .slice(0, 3)
  }, [eventsData])

  const recentLeads = useMemo(() => {
    return (leadsData?.data ?? []).slice(0, 3)
  }, [leadsData])

  const totalEvents = eventsData?.meta?.total ?? 0
  const totalLeads = leadsData?.meta?.total ?? 0
  const wishlistArray = Array.isArray(wishlists) ? wishlists : (wishlists?.data ?? [])
  const wishlistCount = wishlistArray.reduce((total, list) => total + (list.items?.length ?? 0), 0)

  const isLoading = eventsLoading || leadsLoading || wishlistLoading

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-4">
      {/* Hero Header with Gradient */}
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-4">
        <div className="relative z-10">
          <h1 className="text-lg font-semibold md:text-lg">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Planner'}! ✨
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your planning workspace is ready. Let's make magic happen!
          </p>
        </div>
      </div>

      {/* Stats Cards with Enhanced Design */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : totalEvents}</p>
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
              <p className="text-2xl font-bold">{isLoading ? '...' : upcomingEvents.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <Heart className="h-5 w-5 fill-pink-500 text-pink-500 dark:fill-pink-400 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wishlist</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : wishlistCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inquiries</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : totalLeads}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming Events - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-base">Upcoming Events</CardTitle>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/events">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventsLoading && !eventsData ? (
                <Skeleton className="h-32" />
              ) : upcomingEvents.length ? (
                upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block"
                  >
                    <div className="group rounded-xl border-2 p-4 transition-all hover:border-primary hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-100 to-pink-100">
                            <Calendar className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold group-hover:text-primary">{event.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'Date TBD'}
                            </p>
                            {event.checklistProgress !== undefined && (
                              <div className="mt-2 flex items-center gap-2">
                                <Progress value={event.checklistProgress} className="h-1.5 w-32" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {event.checklistProgress}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {event.status?.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border-2 border-dashed p-4 text-center">
                  <Sparkles className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">No events yet</p>
                  <p className="text-xs text-muted-foreground">Start planning by creating your first event</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/events/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Event
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start gap-3 border-2 hover:border-primary hover:shadow-md">
              <Link href="/discover">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-100 to-emerald-100">
                  <Search className="h-4 w-4 text-green-600" />
                </div>
                <span className="flex-1 text-left font-medium">Browse Vendors</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-3 border-2 hover:border-primary hover:shadow-md">
              <Link href="/events/new">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-purple-100 to-pink-100">
                  <Plus className="h-4 w-4 text-purple-600" />
                </div>
                <span className="flex-1 text-left font-medium">New Event</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-3 border-2 hover:border-primary hover:shadow-md">
              <Link href="/inquiries">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-100 to-cyan-100">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <span className="flex-1 text-left font-medium">Track Inquiries</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Inquiries */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base">Recent Inquiries</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/inquiries">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {leadsLoading && !leadsData ? (
            <Skeleton className="h-24" />
          ) : recentLeads.length ? (
            recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-100 to-cyan-100">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {lead.vendorProfile?.businessName ?? lead.vendorProfileId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Event: {lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/inquiries/${lead.id}`}>View</Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border-2 border-dashed p-4 text-center">
              <MessageSquare className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No inquiries yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
