'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { useRsvpDetails, useSubmitRsvp } from '@/hooks/queries/use-public-rsvp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  Heart,
  Sparkles,
  PartyPopper,
  Utensils,
  MessageCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white dark:from-rose-950/20 dark:via-pink-950/20 dark:to-background p-4">
        <div className="mx-auto max-w-lg space-y-6 pt-8">
          <Skeleton className="h-16 w-3/4 mx-auto" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white dark:from-rose-950/20 dark:via-pink-950/20 dark:to-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold">Invalid Link</h2>
            <p className="mt-2 text-muted-foreground">
              This RSVP link is invalid or has expired. Please contact the event host for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white dark:from-rose-950/20 dark:via-pink-950/20 dark:to-background p-4 flex items-center justify-center">
        <Card className="max-w-md w-full overflow-hidden">
          <div className="relative h-32 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400">
            <div className="absolute inset-0 flex items-center justify-center">
              <PartyPopper className="h-16 w-16 text-white animate-bounce" />
            </div>
          </div>
          <CardContent className="pt-6 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 -mt-14 border-4 border-background">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="mt-2 text-muted-foreground">
              {rsvpStatus === 'ATTENDING'
                ? `We can't wait to see you at ${data.event.name}!`
                : rsvpStatus === 'NOT_ATTENDING'
                  ? 'We\'ll miss you! Thank you for letting us know.'
                  : 'We\'ll keep you updated!'}
            </p>
            {rsvpStatus === 'ATTENDING' && (
              <Badge variant="secondary" className="mt-4">
                <Users className="mr-1 h-3 w-3" />
                {plusOne > 0 ? `You + ${plusOne} guest${plusOne > 1 ? 's' : ''}` : 'Just you'}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const eventDate = data.event.date ? new Date(data.event.date) : null
  const hasResponded = data.guest.rsvpAt !== null

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-white dark:from-rose-950/20 dark:via-pink-950/20 dark:to-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header with decorative elements */}
        <div className="relative mb-8 text-center">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <Heart className="h-8 w-8 text-rose-300 animate-pulse" />
          </div>
          <div className="pt-6">
            <p className="text-sm font-medium text-rose-500 uppercase tracking-wider">
              You&apos;re Invited
            </p>
            <h1 className="mt-2 text-3xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              {data.event.name}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Dear <span className="font-semibold text-foreground">{data.guest.firstName}</span>,
              we would be honored by your presence!
            </p>
          </div>
        </div>

        {/* Already responded banner */}
        {hasResponded && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-3 p-4">
              <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  You&apos;ve already responded
                </p>
                <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
                  Feel free to update your response below if your plans have changed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Details */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-pink-500" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventDate && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                  <Calendar className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {format(eventDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
            {data.event.venueName && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-semibold">{data.event.venueName}</p>
                  {data.event.address?.addressLine1 && (
                    <p className="text-sm text-muted-foreground">
                      {data.event.address.addressLine1}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline/Schedule */}
        {data.timeline.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0 w-20 text-right">
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {formatTimeDisplay(item.scheduledTime)}
                      </span>
                    </div>
                    <div className="flex-1 border-l-2 border-orange-200 dark:border-orange-800 pl-4 pb-3">
                      <p className="font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* RSVP Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Your Response
            </CardTitle>
            <CardDescription>Please let us know if you can join us</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* RSVP Status */}
            <div className="space-y-3">
              <Label className="text-base">Will you be attending?</Label>
              <RadioGroup
                value={rsvpStatus}
                onValueChange={setRsvpStatus}
                className="grid gap-3"
              >
                <Label
                  htmlFor="attending"
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all',
                    rsvpStatus === 'ATTENDING'
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-muted hover:border-green-300'
                  )}
                >
                  <RadioGroupItem value="ATTENDING" id="attending" />
                  <CheckCircle2 className={cn(
                    'h-5 w-5',
                    rsvpStatus === 'ATTENDING' ? 'text-green-600' : 'text-muted-foreground'
                  )} />
                  <span className="font-medium">Yes, I&apos;ll be there!</span>
                </Label>
                <Label
                  htmlFor="not-attending"
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all',
                    rsvpStatus === 'NOT_ATTENDING'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                      : 'border-muted hover:border-rose-300'
                  )}
                >
                  <RadioGroupItem value="NOT_ATTENDING" id="not-attending" />
                  <Heart className={cn(
                    'h-5 w-5',
                    rsvpStatus === 'NOT_ATTENDING' ? 'text-rose-600' : 'text-muted-foreground'
                  )} />
                  <span className="font-medium">Sorry, I can&apos;t make it</span>
                </Label>
                <Label
                  htmlFor="maybe"
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all',
                    rsvpStatus === 'MAYBE'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                      : 'border-muted hover:border-amber-300'
                  )}
                >
                  <RadioGroupItem value="MAYBE" id="maybe" />
                  <Sparkles className={cn(
                    'h-5 w-5',
                    rsvpStatus === 'MAYBE' ? 'text-amber-600' : 'text-muted-foreground'
                  )} />
                  <span className="font-medium">Not sure yet</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Attending-specific options */}
            {rsvpStatus === 'ATTENDING' && (
              <>
                {/* Plus Ones */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    Additional Guests
                  </Label>
                  <Select
                    value={plusOne.toString()}
                    onValueChange={(v) => setPlusOne(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n === 0 ? 'Just me' : `+${n} guest${n > 1 ? 's' : ''}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dietary Requirements */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-green-500" />
                    Dietary Requirements
                  </Label>
                  <Select value={dietaryReq} onValueChange={setDietaryReq}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dietary preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.dietaryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Optional Message */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                Message for the hosts (optional)
              </Label>
              <Textarea
                placeholder="Send your wishes or let us know anything special..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!rsvpStatus || submitRsvp.isPending}
              onClick={handleSubmit}
            >
              {submitRsvp.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  {hasResponded ? 'Update Response' : 'Submit Response'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-8">
          Powered by <span className="font-medium">Omnicassion</span>
        </p>
      </div>
    </div>
  )
}
