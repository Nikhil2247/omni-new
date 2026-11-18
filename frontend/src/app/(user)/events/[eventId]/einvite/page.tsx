'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { EInvitePanel } from '@/components/features/events/einvite-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useEInviteByEvent } from '@/hooks/queries/use-einvites'
import { Brush, Eyebrow, PaintedNum, SketchButton, Stamp } from '@/components/sketch'

const STEPS = ['Pick a design', 'Edit the words', 'Save and publish', 'Send to guests']

export default function EInvitePage() {
  const params = useParams()
  const eventId = params.eventId as string

  const { data: event } = useEvent(eventId)
  const { data: einvite } = useEInviteByEvent(eventId)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-einvite', 'user')
  }, [eventId])

  if (!eventId) {
    return null
  }

  const isPublished = einvite?.isPublished ?? false

  return (
    <div className="space-y-4">
      {/* Compact Header for Editor Page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SketchButton variant="ghost" size="sm" asChild className="mb-3">
            <Link href={`/events/${eventId}`}>Back</Link>
          </SketchButton>
          <Eyebrow>E-Invite</Eyebrow>
          <h1 className="font-display mt-2 text-[clamp(1.6rem,3.4vw,2.3rem)] leading-[1.05] font-semibold tracking-tight">
            E-Invite <Brush>Designer</Brush>
          </h1>
          {event?.name && <p className="text-ink-soft mt-1 text-sm">{event.name}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Stamp tone={isPublished ? 'ok' : 'wait'}>{einvite ? (isPublished ? 'Published' : 'Draft') : 'New'}</Stamp>
          <Stamp>WhatsApp Ready</Stamp>
        </div>
      </div>

      {/* The four steps, so it is clear what comes next */}
      <ol className="flex flex-wrap gap-x-6 gap-y-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-sm font-medium">
            <PaintedNum tone={i === 1 ? 'green' : i === 2 ? 'gold' : 'blue'} className="!size-7 !text-[0.95rem]">
              {i + 1}
            </PaintedNum>
            {s}
          </li>
        ))}
      </ol>

      {/* E-Invite Panel - Full Height */}
      <EInvitePanel eventId={eventId} />
    </div>
  )
}
