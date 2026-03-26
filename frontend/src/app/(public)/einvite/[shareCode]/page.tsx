'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { fabric } from 'fabric'
import { usePublicEInvite, useTrackEInviteView } from '@/hooks/queries/use-einvites'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  Download,
  Heart,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function PublicEInvitePage() {
  const params = useParams()
  const shareCode = params.shareCode as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // Fetch public invite data
  const { data: invite, isLoading, error } = usePublicEInvite(shareCode)

  // Track view
  const trackView = useTrackEInviteView()

  // Track view on mount
  useEffect(() => {
    if (shareCode) {
      trackView.mutate({ shareCode })
    }
  }, [shareCode])

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
