'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MemoriesPanel } from '@/components/features/events/memories-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useMemories } from '@/hooks/queries/use-memories'
import { usePendingUploadCount } from '@/hooks/queries/use-guest-uploads'
import { Brush, Eyebrow, Paper, SketchButton } from '@/components/sketch'
import { ArrowLeft } from 'lucide-react'

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
    <div className="space-y-6 pb-4">
      {/* Header */}
      <header>
        <SketchButton asChild variant="ghost" size="sm" className="mb-4">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to event
          </Link>
        </SketchButton>

        <Eyebrow>Photo Memories</Eyebrow>
        <h1 className="font-display mt-2 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          Memory <Brush>Wall</Brush>
        </h1>
        <p className="text-ink-soft mt-2 max-w-2xl text-base">
          {event?.name ? (
            <>
              Collect photos for <span className="text-ink font-bold">{event.name}</span>
            </>
          ) : (
            'Let guests share their photos and memories'
          )}
        </p>

        {/* Quick Stats */}
        <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          <Paper className="px-4 py-3">
            <p className="sk-eyebrow">Status</p>
            <p className={`font-display text-lg font-semibold ${isActive ? 'text-leaf-deep' : ''}`}>
              {memories ? (isActive ? 'Active' : 'Inactive') : 'Not created'}
            </p>
          </Paper>
          <Paper alt className="px-4 py-3">
            <p className="sk-eyebrow">QR Code</p>
            <p className="font-display text-lg font-semibold">{hasQrCode ? 'Ready' : 'Not set'}</p>
          </Paper>
          <Paper className="col-span-2 px-4 py-3 sm:col-span-1">
            <p className="sk-eyebrow">Pending Approval</p>
            <p className={`font-display text-lg font-semibold ${pendingApprovals > 0 ? 'text-gold' : ''}`}>
              {pendingApprovals}
            </p>
          </Paper>
        </div>
      </header>

      {/* Memories Panel */}
      <MemoriesPanel eventId={eventId} />
    </div>
  )
}
