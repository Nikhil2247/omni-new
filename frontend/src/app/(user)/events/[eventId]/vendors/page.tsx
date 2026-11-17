'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { EventVendorsPanel } from '@/components/features/events/event-vendors-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useEventVendors } from '@/hooks/queries/use-event-vendors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Store, ArrowLeft, CheckCircle, Clock } from 'lucide-react'

export default function EventVendorsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: vendors } = useEventVendors(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-vendors', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const totalVendors = vendors?.length || 0
  const confirmedVendors = vendors?.filter((v: any) => v.status === 'CONFIRMED' || v.status === 'BOOKED').length || 0
  const pendingVendors = vendors?.filter((v: any) => v.status === 'SHORTLISTED' || v.status === 'CONTACTED').length || 0

  return (
    <div className="space-y-4 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-4 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-cyan-950/20 sm:p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />

        <div className="relative">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to event
            </Link>
          </Button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700 shadow-sm dark:bg-indigo-950/70 dark:text-indigo-200">
                Vendor Management
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight sm:text-lg">
                Event Vendors
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {event?.name ? (
                  <>Manage vendors for <span className="font-medium text-foreground">{event.name}</span></>
                ) : (
                  'Track and manage your event vendors'
                )}
              </p>

              {/* Quick Stats */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-indigo-900/50 dark:bg-indigo-950/40">
                  <p className="text-[11px] text-muted-foreground">Total Vendors</p>
                  <p className="font-semibold">{totalVendors}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-indigo-900/50 dark:bg-indigo-950/40">
                  <p className="text-[11px] text-muted-foreground">Confirmed</p>
                  <p className="font-semibold text-green-600">{confirmedVendors}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-indigo-900/50 dark:bg-indigo-950/40 sm:col-span-1">
                  <p className="text-[11px] text-muted-foreground">Pending</p>
                  <p className={`font-semibold ${pendingVendors > 0 ? 'text-amber-600' : ''}`}>
                    {pendingVendors}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg self-start lg:self-auto">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Panel */}
      <EventVendorsPanel eventId={eventId} />
    </div>
  )
}
