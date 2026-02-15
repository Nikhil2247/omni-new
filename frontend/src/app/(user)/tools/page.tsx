'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useEvents } from '@/hooks/queries/use-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, CheckSquare, Clock3, Images, PlusCircle, Sparkles, Users, Wallet } from 'lucide-react'

export default function UserToolsPage() {
  const { data, isLoading } = useEvents({ page: 1, limit: 10 })
  const events = data?.data ?? []
  const firstEventId = events[0]?.id

  const stats = useMemo(() => {
    const total = events.length
    const upcoming = events.filter((event) => event.eventDate && new Date(event.eventDate) >= new Date()).length
    const planning = events.filter((event) => event.status === 'PLANNING').length

    return { total, upcoming, planning }
  }, [events])

  const toolLinks = useMemo(
    () =>
      firstEventId
        ? [
            {
              href: `/events/${firstEventId}/guestlist`,
              label: 'Guestlist',
              description: 'Manage attendees and RSVPs',
              icon: Users,
            },
            {
              href: `/events/${firstEventId}/checklist`,
              label: 'Checklist',
              description: 'Track tasks and completion',
              icon: CheckSquare,
            },
            {
              href: `/events/${firstEventId}/budget`,
              label: 'Budget List',
              description: 'Plan and monitor spend',
              icon: Wallet,
            },
            {
              href: `/events/${firstEventId}/timeline`,
              label: 'Timeline',
              description: 'Organize event schedule',
              icon: Clock3,
            },
            {
              href: `/events/${firstEventId}/memories`,
              label: 'Memories',
              description: 'Capture event highlights',
              icon: Images,
            },
            {
              href: '/events',
              label: 'Events',
              description: 'Open all your events',
              icon: Calendar,
            },
          ]
        : [],
    [firstEventId],
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-violet-50 via-purple-50 to-pink-50 p-6 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-pink-950/30 md:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Planning Tools</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your all-in-one workspace for Guestlist, Checklist, Budget, Timeline, and Memories.</p>
          </div>
          <Button asChild>
            <Link href="/events/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : stats.total}</p>
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
              <p className="text-2xl font-bold">{isLoading ? '...' : stats.upcoming}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planning</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : stats.planning}</p>
            </div>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Loading tools...</CardContent>
        </Card>
      ) : toolLinks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No events yet</CardTitle>
            <CardDescription>Create your first event to unlock Guestlist, Checklist, Budget, Timeline, and Memories.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/events/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolLinks.map((tool) => {
            const Icon = tool.icon
            return (
              <Link key={tool.href} href={tool.href}>
                <Card className="h-full border-2 transition-all hover:border-primary hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="bg-primary/10 text-primary rounded-lg p-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">Open</Badge>
                    </div>
                    <div>
                      <p className="font-semibold">{tool.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
