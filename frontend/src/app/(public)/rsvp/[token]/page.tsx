'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { useRsvpDetails, useSubmitRsvp } from '@/hooks/queries/use-public-rsvp'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, MapPin } from 'lucide-react'
import { Brush, Eyebrow, Ico, ICONS, Paper, SkContainer, Stamp } from '@/components/sketch'
import { RsvpResponseFields } from '@/components/features/events/rsvp-response-fields'

// Format time from "14:30" to "2:30 PM"
function formatTimeDisplay(time?: string): string {
  if (!time) return ''
  if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
    return time
  }
  const [hours, minutes] = time.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return time
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export default function PublicRsvpPage() {
  const params = useParams()
  const token = params.token as string

  const { data, isLoading, error } = useRsvpDetails(token)
  const submitRsvp = useSubmitRsvp(token)

  const [rsvpStatus, setRsvpStatus] = useState<string>('')
  const [plusOne, setPlusOne] = useState<number>(0)
  const [dietaryReq, setDietaryReq] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [submitted, setSubmitted] = useState(false)

  // Pre-fill form with existing data
  useEffect(() => {
    if (data?.guest) {
      if (data.guest.rsvpStatus !== 'PENDING') {
        setRsvpStatus(data.guest.rsvpStatus)
      }
      setPlusOne(data.guest.plusOne || 0)
      setDietaryReq(data.guest.dietaryReq || '')
    }
  }, [data])

  const handleSubmit = async () => {
    if (!rsvpStatus) return

    try {
      await submitRsvp.mutateAsync({
        rsvpStatus: rsvpStatus as 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE',
        plusOne: rsvpStatus === 'ATTENDING' ? plusOne : 0,
        dietaryReq: rsvpStatus === 'ATTENDING' ? dietaryReq : undefined,
        message: message || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to submit RSVP:', err)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <SkContainer className="max-w-xl py-8">
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="mx-auto h-16 w-3/4" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </SkContainer>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <SkContainer className="max-w-xl py-10">
        <Paper className="px-6 py-10 text-center">
          <Ico d={ICONS.mail} className="mx-auto mb-3 h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold">Invalid link</h1>
          <p className="text-ink-soft mt-2">
            This RSVP link is invalid or has expired. Please contact the event host for a new invitation.
          </p>
        </Paper>
      </SkContainer>
    )
  }

  // Success state
  if (submitted) {
    return (
      <SkContainer className="max-w-xl py-10">
        <Paper tape className="px-6 py-10 text-center">
          <Ico d={ICONS.heart} className="mx-auto mb-3 h-14 w-14" />
          <h1 className="font-display text-[clamp(1.9rem,6vw,2.6rem)] leading-[1.05] font-semibold tracking-tight">
            <Brush>Thank</Brush> you!
          </h1>
          <p className="text-ink-soft mt-3">
            {rsvpStatus === 'ATTENDING'
              ? `We can't wait to see you at ${data.event.name}!`
              : rsvpStatus === 'NOT_ATTENDING'
                ? "We'll miss you! Thank you for letting us know."
                : "We'll keep you updated!"}
          </p>
          {rsvpStatus === 'ATTENDING' && (
            <Stamp className="mt-4">
              {plusOne > 0 ? `You + ${plusOne} guest${plusOne > 1 ? 's' : ''}` : 'Just you'}
            </Stamp>
          )}
        </Paper>
      </SkContainer>
    )
  }

  const eventDate = data.event.date ? new Date(data.event.date) : null
  const hasResponded = data.guest.rsvpAt !== null

  return (
    <SkContainer className="max-w-xl py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <Eyebrow>You&apos;re invited</Eyebrow>
        <h1 className="font-display mt-3 text-[clamp(1.9rem,6vw,2.8rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          <Brush>{data.event.name}</Brush>
        </h1>
        <p className="text-ink-soft mt-3 text-lg">
          Dear <span className="text-ink font-bold">{data.guest.firstName}</span>, we would be honored by your
          presence!
        </p>
      </div>

      {/* Already responded banner */}
      {hasResponded && (
        <Paper alt className="mb-6 flex items-center gap-3 px-5 py-4">
          <Stamp tone="wait">Responded</Stamp>
          <div>
            <p className="font-bold">You&apos;ve already responded</p>
            <p className="text-ink-soft text-sm">
              Feel free to update your response below if your plans have changed.
            </p>
          </div>
        </Paper>
      )}

      {/* Event Details */}
      <Paper tape className="mb-6 px-5 py-6">
        <h2 className="font-display mb-4 text-xl font-semibold">Event details</h2>
        <div className="space-y-4">
          {eventDate && (
            <div className="flex items-start gap-3">
              <Calendar className="text-blue mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="sk-eyebrow">Date</p>
                <p className="font-bold">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
          )}
          {data.event.venueName && (
            <div className="flex items-start gap-3">
              <MapPin className="text-blue mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="sk-eyebrow">Venue</p>
                <p className="font-bold">{data.event.venueName}</p>
                {data.event.address?.addressLine1 && (
                  <p className="text-ink-soft text-sm">{data.event.address.addressLine1}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Paper>

      {/* Timeline/Schedule */}
      {data.timeline.length > 0 && (
        <Paper className="mb-6 px-5 py-6">
          <h2 className="font-display mb-4 text-xl font-semibold">Schedule</h2>
          <div>
            {data.timeline.map((item, index) => (
              <div key={index} className="border-line flex gap-4 border-b-2 border-dashed py-3 last:border-b-0">
                <div className="w-20 shrink-0 text-right">
                  <span className="sk-hand text-lg">{formatTimeDisplay(item.scheduledTime)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.title}</p>
                  {item.description && <p className="text-ink-soft text-sm">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Paper>
      )}

      {/* RSVP Form */}
      <Paper className="mb-6 px-5 py-6">
        <h2 className="font-display text-xl font-semibold">Your response</h2>
        <p className="text-ink-soft mb-5 text-sm">Please let us know if you can join us</p>
        <RsvpResponseFields
          idPrefix="rsvp"
          rsvpStatus={rsvpStatus}
          onStatusChange={setRsvpStatus}
          plusOne={plusOne}
          onPlusOneChange={setPlusOne}
          dietaryReq={dietaryReq}
          onDietaryChange={setDietaryReq}
          dietaryOptions={data.dietaryOptions}
          message={message}
          onMessageChange={setMessage}
          isPending={submitRsvp.isPending}
          hasResponded={hasResponded}
          submitLabel="Submit Response"
          onSubmit={handleSubmit}
        />
      </Paper>

      <p className="text-ink-soft pb-8 text-center text-xs">
        Powered by <span className="font-bold">Omnicassion</span>
      </p>
    </SkContainer>
  )
}
