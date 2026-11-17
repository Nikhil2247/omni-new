'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GuestlistPanel } from '@/components/features/events/guestlist-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useGuestlist } from '@/hooks/queries/use-guestlist'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ArrowLeft, CheckCircle, Clock } from 'lucide-react'

export default function GuestlistPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: guestlist } = useGuestlist(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-guestlist', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const totalGuests = guestlist?.guests?.length || 0
  const attending = guestlist?.guests?.filter((g: any) => g.rsvpStatus === 'ATTENDING').length || 0
  const pending = guestlist?.guests?.filter((g: any) => g.rsvpStatus === 'PENDING' || g.rsvpStatus === 'MAYBE').length || 0
  const plusOnes = guestlist?.guests?.reduce((sum: number, g: any) => sum + (g.plusOne || 0), 0) || 0

  return (
    <div className="space-y-4 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/20 sm:p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-purple-300/30 blur-3xl dark:bg-purple-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-500/20" />

        <div className="relative">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to event
            </Link>
          </Button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-700 shadow-sm dark:bg-violet-950/70 dark:text-violet-200">
                Guest Management
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight sm:text-lg">
                Guestlist & RSVP
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {event?.name ? (
                  <>Manage guests for <span className="font-medium text-foreground">{event.name}</span></>
                ) : (
                  'Track RSVPs and manage your guest list'
                )}
              </p>

              {/* Quick Stats */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                  <p className="text-[11px] text-muted-foreground">Total Guests</p>
                  <p className="font-semibold">{totalGuests}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                  <p className="text-[11px] text-muted-foreground">Attending</p>
                  <p className="font-semibold text-green-600">{attending}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                  <p className="text-[11px] text-muted-foreground">Pending</p>
                  <p className="font-semibold text-amber-600">{pending}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-violet-900/50 dark:bg-violet-950/40">
                  <p className="text-[11px] text-muted-foreground">Expected Total</p>
                  <p className="font-semibold">{attending + plusOnes}</p>
                </div>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg self-start lg:self-auto">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Guestlist Panel */}
      <GuestlistPanel eventId={eventId} />
    </div>
  )
}
