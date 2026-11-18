'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { fabric } from 'fabric'
import { usePublicEInvite, useTrackEInviteView } from '@/hooks/queries/use-einvites'
import { useRsvpDetails, useSubmitRsvp } from '@/hooks/queries/use-public-rsvp'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, MapPin, Share2, Download, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { loadCanvasJson } from '@/lib/einvite-fonts'
import { Brush, Eyebrow, Ico, ICONS, Paper, SketchButton, SkContainer, Stamp } from '@/components/sketch'
import { RsvpResponseFields } from '@/components/features/events/rsvp-response-fields'

// Wrapper component for Suspense boundary
export default function PublicEInvitePage() {
  return (
    <Suspense fallback={<EInviteLoadingState />}>
      <EInviteContent />
    </Suspense>
  )
}

function EInviteLoadingState() {
  return (
    <SkContainer className="max-w-3xl py-8">
      <div aria-busy="true">
        <Skeleton className="mx-auto mb-8 h-8 w-64" />
        <Skeleton className="mx-auto aspect-[3/4] max-w-lg rounded-2xl" />
      </div>
    </SkContainer>
  )
}

function EInviteContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shareCode = params.shareCode as string
  const rsvpToken = searchParams.get('rsvp')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // RSVP form state
  const [rsvpStatus, setRsvpStatus] = useState<string>('')
  const [plusOne, setPlusOne] = useState<number>(0)
  const [dietaryReq, setDietaryReq] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false)

  // Fetch public invite data
  const { data: invite, isLoading, error } = usePublicEInvite(shareCode)

  // Fetch RSVP details if token is present
  const { data: rsvpData, isLoading: rsvpLoading } = useRsvpDetails(rsvpToken || '')
  const submitRsvp = useSubmitRsvp(rsvpToken || '')

  // Track view
  const trackView = useTrackEInviteView()

  // Track view on mount
  useEffect(() => {
    if (shareCode) {
      trackView.mutate({ shareCode, guestId: rsvpData?.guest?.id })
    }
  }, [shareCode, rsvpData?.guest?.id])

  // Pre-fill RSVP form with existing data
  useEffect(() => {
    if (rsvpData?.guest) {
      if (rsvpData.guest.rsvpStatus !== 'PENDING') {
        setRsvpStatus(rsvpData.guest.rsvpStatus)
      }
      setPlusOne(rsvpData.guest.plusOne || 0)
      setDietaryReq(rsvpData.guest.dietaryReq || '')
    }
  }, [rsvpData])

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !invite?.canvasJson) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 800,
      backgroundColor: '#ffffff',
      selection: false,
    })

    fabricRef.current = canvas

    // Load canvas JSON
    const cancel = loadCanvasJson(canvas, invite.canvasJson, () => {
      // Make all objects non-interactive
      canvas.getObjects().forEach((obj) => {
        obj.set({
          selectable: false,
          evented: false,
        })
      })
      canvas.renderAll()
      setCanvasReady(true)
    })

    return () => {
      cancel()
      canvas.dispose()
    }
  }, [invite?.canvasJson])

  // Download invitation as image
  const handleDownload = () => {
    if (!fabricRef.current) return

    const dataUrl = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    })

    const link = document.createElement('a')
    link.download = `invitation-${shareCode}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Invitation downloaded!')
  }

  // Share via native share or copy link
  const handleShare = async () => {
    const shareUrl = window.location.href
    const shareData = {
      title: invite?.eventName || 'You\'re Invited!',
      text: `Check out this invitation for ${invite?.eventName || 'our event'}!`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or share failed
        navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const shareUrl = window.location.href
    const message = invite?.eventName
      ? `Check out this invitation for ${invite.eventName}! ${shareUrl}`
      : `You're invited! ${shareUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Handle RSVP submission
  const handleRsvpSubmit = async () => {
    if (!rsvpStatus || !rsvpToken) return

    try {
      await submitRsvp.mutateAsync({
        rsvpStatus: rsvpStatus as 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE',
        plusOne: rsvpStatus === 'ATTENDING' ? plusOne : 0,
        dietaryReq: rsvpStatus === 'ATTENDING' ? dietaryReq : undefined,
        message: message || undefined,
      })
      setRsvpSubmitted(true)
      toast.success('Your RSVP has been submitted!')
    } catch (err) {
      console.error('Failed to submit RSVP:', err)
      toast.error('Failed to submit RSVP. Please try again.')
    }
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const hasRsvpToken = Boolean(rsvpToken)
  const hasResponded = rsvpData?.guest?.rsvpAt !== null && rsvpData?.guest?.rsvpAt !== undefined

  // Loading state
  if (isLoading) {
    return <EInviteLoadingState />
  }

  // Error state
  if (error || !invite) {
    return (
      <SkContainer className="max-w-md py-12">
        <Paper className="px-6 py-10 text-center">
          <Ico d={ICONS.mail} className="mx-auto mb-3 h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold">Invitation not found</h1>
          <p className="text-ink-soft mt-2">This invitation link may have expired or been removed.</p>
        </Paper>
      </SkContainer>
    )
  }

  return (
    <SkContainer className="max-w-3xl py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <Eyebrow>You&apos;re invited</Eyebrow>
        {invite.eventName && (
          <h1 className="font-display mt-3 text-[clamp(1.9rem,6vw,2.8rem)] leading-[1.05] font-semibold tracking-tight text-balance">
            <Brush>{invite.eventName}</Brush>
          </h1>
        )}
      </div>

      {/* Invitation Card */}
      <Paper tape className="px-4 py-6 sm:px-8">
        {/* Canvas Preview */}
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-md bg-white shadow-md" aria-busy={!canvasReady}>
            <canvas ref={canvasRef} className="h-auto max-w-full" />
          </div>
        </div>

        {/* Event Details */}
        <div className="mt-6 space-y-4">
          {(invite.eventDate || invite.eventTime) && (
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {invite.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="text-blue h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="font-bold">{formatDate(invite.eventDate)}</span>
                </div>
              )}
              {invite.eventTime && (
                <div className="flex items-center gap-2">
                  <Clock className="text-blue h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="font-bold">{invite.eventTime}</span>
                </div>
              )}
            </div>
          )}

          {(invite.eventVenue || invite.eventAddress) && (
            <div className="flex items-start gap-2">
              <MapPin className="text-blue mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                {invite.eventVenue && <p className="font-bold">{invite.eventVenue}</p>}
                {invite.eventAddress && <p className="text-ink-soft text-sm">{invite.eventAddress}</p>}
              </div>
            </div>
          )}

          {invite.customMessage && (
            <p className="sk-hand border-line border-y-2 border-dashed py-4 text-center text-xl">
              {invite.customMessage}
            </p>
          )}

          {invite.hostNames && (
            <div className="pt-2 text-center">
              <p className="text-ink-soft text-sm">With love,</p>
              <p className="font-display text-lg font-semibold">{invite.hostNames}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SketchButton onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Save
          </SketchButton>
          <SketchButton variant="line" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </SketchButton>
          <SketchButton variant="line" onClick={handleWhatsAppShare}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </SketchButton>
        </div>
      </Paper>

      {/* RSVP Section - Only show if rsvp token is present */}
      {hasRsvpToken && rsvpData && (
        <Paper className="mt-6 px-5 py-6">
          {rsvpSubmitted ? (
            <div className="py-4 text-center">
              <Ico d={ICONS.heart} className="mx-auto mb-3 h-14 w-14" />
              <h2 className="font-display text-[clamp(1.7rem,5vw,2.3rem)] leading-[1.05] font-semibold tracking-tight">
                <Brush>Thank</Brush> you!
              </h2>
              <p className="text-ink-soft mt-3">
                {rsvpStatus === 'ATTENDING'
                  ? `We can't wait to see you, ${rsvpData.guest.firstName}!`
                  : rsvpStatus === 'NOT_ATTENDING'
                    ? "We'll miss you! Thank you for letting us know."
                    : "We'll keep you updated!"}
              </p>
              {rsvpStatus === 'ATTENDING' && (
                <Stamp className="mt-4">
                  {plusOne > 0 ? `You + ${plusOne} guest${plusOne > 1 ? 's' : ''}` : 'Just you'}
                </Stamp>
              )}
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold">RSVP - {rsvpData.guest.firstName}</h2>
              <p className="text-ink-soft mb-5 text-sm">Please let us know if you can join us</p>

              {hasResponded && (
                <div className="border-line mb-5 flex items-center gap-3 border-y-2 border-dashed py-3">
                  <Stamp tone="wait">Responded</Stamp>
                  <p className="text-sm">You&apos;ve already responded. Feel free to update your response below.</p>
                </div>
              )}

              <RsvpResponseFields
                idPrefix="einvite"
                rsvpStatus={rsvpStatus}
                onStatusChange={setRsvpStatus}
                plusOne={plusOne}
                onPlusOneChange={setPlusOne}
                dietaryReq={dietaryReq}
                onDietaryChange={setDietaryReq}
                dietaryOptions={rsvpData.dietaryOptions}
                message={message}
                onMessageChange={setMessage}
                isPending={submitRsvp.isPending}
                hasResponded={hasResponded}
                submitLabel="Submit RSVP"
                onSubmit={handleRsvpSubmit}
              />
            </>
          )}
        </Paper>
      )}

      {/* Loading RSVP */}
      {hasRsvpToken && rsvpLoading && (
        <Paper className="mt-6 px-5 py-6">
          <div className="flex items-center justify-center gap-3" role="status">
            <Loader2 className="text-ink-soft h-5 w-5 animate-spin" />
            <span className="text-ink-soft">Loading RSVP details...</span>
          </div>
        </Paper>
      )}

      {/* Footer */}
      <p className="text-ink-soft mt-8 text-center text-xs">Created with love using Omnicassion</p>
    </SkContainer>
  )
}
