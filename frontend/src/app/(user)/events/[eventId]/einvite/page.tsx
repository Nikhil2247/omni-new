'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { EInvitePanel } from '@/components/features/events/einvite-panel'
import { trackDashboard } from '@/lib/analytics/umami'
import { useEvent } from '@/hooks/queries/use-events'
import { useEInviteByEvent } from '@/hooks/queries/use-einvites'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send, ArrowLeft, Eye, MessageCircle } from 'lucide-react'

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Send className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">E-Invite Designer</h1>
              {event?.name && (
                <p className="text-xs text-muted-foreground">{event.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isPublished ? 'default' : 'secondary'} className="text-xs">
            {einvite ? (isPublished ? 'Published' : 'Draft') : 'New'}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <MessageCircle className="h-3 w-3" />
            WhatsApp Ready
          </Badge>
        </div>
      </div>

      {/* E-Invite Panel - Full Height */}
      <EInvitePanel eventId={eventId} />
    </div>
  )
}
