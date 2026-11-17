'use client'

import { useState } from 'react'
import {
  useEInviteByEvent,
  useEInviteTemplates,
  useCreateEInvite,
  useUpdateEInvite,
  usePublishEInvite,
  useUnpublishEInvite,
} from '@/hooks/queries/use-einvites'
import { useEvent } from '@/hooks/queries/use-events'
import { EInviteEditor } from '@/components/features/einvite/einvite-editor'
import { SendToGuestsDialog } from '@/components/features/einvite/send-to-guests-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Paper, Stamp } from '@/components/sketch'
import { toast } from 'sonner'
import type { EInviteCategory } from '@/lib/api/types/einvite.types'

interface EInvitePanelProps {
  eventId: string
}

export function EInvitePanel({ eventId }: EInvitePanelProps) {
  const [showSendDialog, setShowSendDialog] = useState(false)

  // Fetch event data for default values
  const { data: event } = useEvent(eventId)

  // Fetch existing e-invite for this event
  const { data: einvite, isLoading: einviteLoading, error: einviteError } = useEInviteByEvent(eventId)

  // Fetch templates - determine category based on event type
  const templateCategory: EInviteCategory | undefined = event?.eventType === 'WEDDING'
    ? 'WEDDING'
    : event?.eventType === 'BIRTHDAY'
    ? 'BIRTHDAY'
    : undefined
  const { data: templates, isLoading: templatesLoading } = useEInviteTemplates(templateCategory)

  // Mutations
  const createEInvite = useCreateEInvite()
  const updateEInvite = useUpdateEInvite(einvite?.id || '')
  const publishEInvite = usePublishEInvite(einvite?.id || '')
  const unpublishEInvite = useUnpublishEInvite(einvite?.id || '')

  // Handle save (create or update)
  const handleSave = async (canvasJson: Record<string, any>, previewUrl?: string) => {
    try {
      if (einvite?.id) {
        // Update existing einvite
        await updateEInvite.mutateAsync({
          canvasJson,
          previewUrl,
        })
      } else {
        // Create new einvite
        const eventDate = event?.eventDate || event?.date
        const address = event?.address as { addressLine1?: string; addressLine2?: string } | undefined
        await createEInvite.mutateAsync({
          eventId,
          canvasJson,
          eventName: event?.name,
          eventDate: eventDate || undefined,
          eventTime: eventDate ? new Date(eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
          eventVenue: event?.venueName || undefined,
          eventAddress: address?.addressLine1 ? `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}` : undefined,
        })
      }
    } catch (error) {
      throw error
    }
  }

  // Handle publish/unpublish
  const handlePublish = async () => {
    if (!einvite?.id) {
      toast.error('Please save the invitation first')
      return
    }

    try {
      if (einvite.isPublished) {
        await unpublishEInvite.mutateAsync()
        toast.success('Invitation unpublished')
      } else {
        await publishEInvite.mutateAsync()
        toast.success('Invitation published!')
      }
    } catch (error) {
      toast.error('Failed to update publish status')
    }
  }

  // Loading state
  if (einviteLoading || templatesLoading) {
    return (
      <div className="h-[calc(100vh-180px)] flex flex-col">
        <Skeleton className="flex-1 rounded-lg" />
      </div>
    )
  }

  // Error state
  if (einviteError && (einviteError as any)?.response?.status !== 404) {
    return (
      <div className="flex h-[calc(100vh-180px)] items-center justify-center">
        <Paper className="px-8 py-6 text-center">
          <Stamp tone="late">Error</Stamp>
          <p className="font-display mt-3 text-lg font-semibold">Unable to load e-invite editor.</p>
          <p className="text-ink-soft mt-1 text-sm">
            {einviteError instanceof Error ? einviteError.message : 'Unknown error'}
          </p>
        </Paper>
      </div>
    )
  }

  return (
    <>
      {/* Full-height Editor */}
      <div className="sk-paper h-[calc(100vh-180px)] overflow-hidden p-0">
        <EInviteEditor
          eventId={eventId}
          einvite={einvite ?? null}
          templates={templates || []}
          onSave={handleSave}
          onPublish={handlePublish}
          onSendToGuests={() => setShowSendDialog(true)}
        />
      </div>

      {/* Send to Guests Dialog */}
      {einvite && (
        <SendToGuestsDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          einviteId={einvite.id}
          eventId={eventId}
          shareCode={einvite.shareCode}
          eventName={einvite.eventName || event?.name}
        />
      )}
    </>
  )
}
