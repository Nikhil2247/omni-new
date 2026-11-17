'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MemoriesPanel } from '@/components/features/events/memories-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useMemories } from '@/hooks/queries/use-memories'
import { usePendingUploadCount } from '@/hooks/queries/use-guest-uploads'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageIcon, ArrowLeft, Upload, QrCode } from 'lucide-react'

export default function MemoriesPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: memories } = useMemories(eventId)
  const { data: pendingCount } = usePendingUploadCount(memories?.id || '')

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-memories', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const isActive = memories?.isActive ?? false
  const hasQrCode = !!memories?.qrCode
  const pendingApprovals = pendingCount?.pendingCount || 0

  return (
    <div className="space-y-4 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-4 shadow-sm dark:border-rose-900/40 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-fuchsia-950/20 sm:p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-pink-300/30 blur-3xl dark:bg-pink-500/20" />
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
              <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-700 shadow-sm dark:bg-rose-950/70 dark:text-rose-200">
                Photo Memories
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight sm:text-lg">
                Memory Wall
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                {event?.name ? (
                  <>Collect photos for <span className="font-medium text-foreground">{event.name}</span></>
                ) : (
                  'Let guests share their photos and memories'
                )}
              </p>

              {/* Quick Stats */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-rose-900/50 dark:bg-rose-950/40">
                  <p className="text-[11px] text-muted-foreground">Status</p>
                  <p className={`font-semibold ${isActive ? 'text-green-600' : ''}`}>
                    {memories ? (isActive ? 'Active' : 'Inactive') : 'Not created'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-rose-900/50 dark:bg-rose-950/40">
                  <p className="text-[11px] text-muted-foreground">QR Code</p>
                  <p className="font-semibold">{hasQrCode ? 'Ready' : 'Not set'}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-rose-900/50 dark:bg-rose-950/40 sm:col-span-1">
                  <p className="text-[11px] text-muted-foreground">Pending Approval</p>
                  <p className={`font-semibold ${pendingApprovals > 0 ? 'text-amber-600' : ''}`}>
                    {pendingApprovals}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg self-start lg:self-auto">
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Memories Panel */}
      <MemoriesPanel eventId={eventId} />
    </div>
  )
}
