'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { fabric } from 'fabric'
import { usePublicEInvite, useTrackEInviteView } from '@/hooks/queries/use-einvites'
import { useRsvpDetails, useSubmitRsvp } from '@/hooks/queries/use-public-rsvp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  Download,
  Heart,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Users,
  Utensils,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-background dark:to-purple-950/20">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mx-auto mb-8" />
        <Skeleton className="aspect-[3/4] max-w-lg mx-auto rounded-2xl" />
      </div>
    </div>
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
    canvas.loadFromJSON(invite.canvasJson, () => {
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-background dark:to-purple-950/20">
        <div className="container max-w-3xl mx-auto py-8 px-4">
          <Skeleton className="h-8 w-64 mx-auto mb-8" />
          <Skeleton className="aspect-[3/4] max-w-lg mx-auto rounded-2xl" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-background dark:to-purple-950/20 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Invitation Not Found</h1>
            <p className="text-muted-foreground">
              This invitation link may have expired or been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50 dark:from-pink-950/20 dark:via-background dark:to-purple-950/20">
      {/* Header */}
      <div className="container max-w-3xl mx-auto pt-8 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>You're Invited</span>
            <Sparkles className="h-4 w-4 text-pink-500" />
          </div>
          {invite.eventName && (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {invite.eventName}
            </h1>
          )}
        </div>
      </div>

      {/* Invitation Card */}
      <div className="container max-w-3xl mx-auto px-4 pb-8">
        <Card className="overflow-hidden shadow-2xl border-0 bg-white/80 backdrop-blur">
          <CardContent className="p-0">
            {/* Canvas Preview */}
            <div className="flex justify-center bg-gradient-to-b from-pink-100/50 to-purple-100/50 p-4 sm:p-8">
              <div className="rounded-xl overflow-hidden shadow-lg bg-white">
                <canvas ref={canvasRef} className="max-w-full h-auto" />
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6 space-y-4">
              {/* Date & Time */}
              {(invite.eventDate || invite.eventTime) && (
                <div className="flex flex-wrap gap-4">
                  {invite.eventDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
                        <Calendar className="h-4 w-4 text-pink-600" />
                      </div>
                      <span>{formatDate(invite.eventDate)}</span>
                    </div>
                  )}
                  {invite.eventTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Clock className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>{invite.eventTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Venue */}
              {(invite.eventVenue || invite.eventAddress) && (
                <div className="flex items-start gap-2 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    {invite.eventVenue && (
                      <p className="font-medium">{invite.eventVenue}</p>
                    )}
                    {invite.eventAddress && (
                      <p className="text-muted-foreground">{invite.eventAddress}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Message */}
              {invite.customMessage && (
                <div className="rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 p-4">
                  <p className="text-sm italic text-center">{invite.customMessage}</p>
                </div>
              )}

              {/* Host Names */}
              {invite.hostNames && (
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">With love,</p>
                  <p className="font-medium">{invite.hostNames}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 p-6 pt-0">
              <Button
                variant="default"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Section - Only show if rsvp token is present */}
        {hasRsvpToken && rsvpData && (
          <Card className="mt-6 overflow-hidden shadow-xl border-0 bg-white/80 backdrop-blur">
            <div className="h-2 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400" />

            {/* RSVP Success State */}
            {rsvpSubmitted ? (
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Thank You!</h2>
                <p className="mt-2 text-muted-foreground">
                  {rsvpStatus === 'ATTENDING'
                    ? `We can't wait to see you, ${rsvpData.guest.firstName}!`
                    : rsvpStatus === 'NOT_ATTENDING'
                      ? "We'll miss you! Thank you for letting us know."
                      : "We'll keep you updated!"}
                </p>
                {rsvpStatus === 'ATTENDING' && (
                  <Badge variant="secondary" className="mt-4">
                    <Users className="mr-1 h-3 w-3" />
                    {plusOne > 0 ? `You + ${plusOne} guest${plusOne > 1 ? 's' : ''}` : 'Just you'}
                  </Badge>
                )}
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-rose-500" />
                    RSVP - {rsvpData.guest.firstName}
                  </CardTitle>
                  <CardDescription>Please let us know if you can join us</CardDescription>
                </CardHeader>

                {/* Already responded banner */}
                {hasResponded && (
                  <div className="mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        You've already responded. Feel free to update your response below.
                      </p>
                    </div>
                  </div>
                )}

                <CardContent className="space-y-5">
                  {/* RSVP Status */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Will you be attending?</Label>
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
                        <span className="font-medium">Yes, I'll be there!</span>
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
                        <span className="font-medium">Sorry, I can't make it</span>
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
                      {rsvpData.dietaryOptions && rsvpData.dietaryOptions.length > 0 && (
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
                              {rsvpData.dietaryOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                    size="lg"
                    disabled={!rsvpStatus || submitRsvp.isPending}
                    onClick={handleRsvpSubmit}
                  >
                    {submitRsvp.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        {hasResponded ? 'Update Response' : 'Submit RSVP'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Loading RSVP */}
        {hasRsvpToken && rsvpLoading && (
          <Card className="mt-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading RSVP details...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Created with{' '}
            <Heart className="inline h-3 w-3 text-pink-500 fill-pink-500" />{' '}
            using Omnicassion
          </p>
        </div>
      </div>
    </div>
  )
}
