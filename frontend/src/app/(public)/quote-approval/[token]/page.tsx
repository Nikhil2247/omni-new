'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'
import { useQuoteDetails, useApproveQuote, useRejectQuote } from '@/hooks/queries/use-public-quote-approval'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, Loader2, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Brush, Ico, ICONS, Paper, SketchButton, SkContainer, Stamp } from '@/components/sketch'

export default function PublicQuoteApprovalPage() {
  const params = useParams()
  const token = params.token as string

  const { data, isLoading, error } = useQuoteDetails(token)
  const approveQuote = useApproveQuote(token)
  const rejectQuote = useRejectQuote(token)

  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionCompleted, setActionCompleted] = useState<'approved' | 'rejected' | null>(null)

  const handleApprove = async () => {
    try {
      await approveQuote.mutateAsync()
      setActionCompleted('approved')
    } catch (err) {
      console.error('Failed to approve quote:', err)
    }
  }

  const handleReject = async () => {
    try {
      await rejectQuote.mutateAsync({ reason: rejectionReason || undefined })
      setShowRejectDialog(false)
      setActionCompleted('rejected')
    } catch (err) {
      console.error('Failed to reject quote:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-IN')} Rs`
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd-MM-yyyy')
    } catch {
      return dateStr
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <SkContainer className="py-8 sm:py-12">
        <div aria-busy="true" className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </SkContainer>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <SkContainer className="flex min-h-[60vh] items-center justify-center py-12">
        <Paper tape className="w-full max-w-md px-6 py-10 text-center">
          <Ico d={ICONS.shield} className="text-gold mx-auto mb-3 h-14 w-14" />
          <h2 className="font-display text-2xl font-semibold">Invalid Link</h2>
          <p className="text-ink-soft mt-2">
            This quote approval link is invalid or has expired. Please contact Omnicassion for assistance.
          </p>
          <p className="text-ink-soft mt-4 text-sm break-words">
            Email: omnicassion@gmail.com | Phone: +91-6284598500
          </p>
        </Paper>
      </SkContainer>
    )
  }

  // Success states
  if (actionCompleted === 'approved') {
    return (
      <SkContainer className="flex min-h-[60vh] items-center justify-center py-12">
        <Paper tape className="w-full max-w-md px-6 py-10 text-center">
          <Ico d={ICONS.shield} className="text-leaf-deep mx-auto mb-3 h-16 w-16" />
          <h2 className="font-display text-2xl font-semibold">
            Quotation <Brush>Approved!</Brush>
          </h2>
          <p className="text-ink-soft mt-3">
            Thank you for approving the quotation for your <span className="text-ink font-semibold">{data.eventType}</span>.
            Our team will proceed with the next steps and contact you shortly.
          </p>
          <Stamp tone="ok" className="mt-4">
            <CheckCircle2 className="size-3" />
            Approved
          </Stamp>
          <div className="border-line mt-6 border-t-2 border-dashed pt-4 text-center">
            <p className="font-display text-lg font-semibold">JUST SIT BACK AND ENJOY</p>
          </div>
        </Paper>
      </SkContainer>
    )
  }

  if (actionCompleted === 'rejected') {
    return (
      <SkContainer className="flex min-h-[60vh] items-center justify-center py-12">
        <Paper tape className="w-full max-w-md px-6 py-10 text-center">
          <Ico d={ICONS.clock} className="text-blue mx-auto mb-3 h-14 w-14" />
          <h2 className="font-display text-2xl font-semibold">Feedback Received</h2>
          <p className="text-ink-soft mt-3">
            Thank you for your feedback. Our team will review your comments and contact you to discuss alternatives.
          </p>
          <Stamp tone="wait" className="mt-4">
            <Clock className="size-3" />
            Under Review
          </Stamp>
        </Paper>
      </SkContainer>
    )
  }

  // Already processed states
  if (data.approvalStatus === 'APPROVED') {
    return (
      <SkContainer className="flex min-h-[60vh] items-center justify-center py-12">
        <Paper tape className="w-full max-w-md px-6 py-10 text-center">
          <Ico d={ICONS.shield} className="text-leaf-deep mx-auto mb-3 h-14 w-14" />
          <h2 className="font-display text-2xl font-semibold">Already Approved</h2>
          <p className="text-ink-soft mt-2">
            This quotation has already been approved. Our team is working on your {data.eventType}.
          </p>
        </Paper>
      </SkContainer>
    )
  }

  if (data.approvalStatus === 'REJECTED') {
    return (
      <SkContainer className="flex min-h-[60vh] items-center justify-center py-12">
        <Paper tape className="w-full max-w-md px-6 py-10 text-center">
          <Ico d={ICONS.chat} className="text-rose mx-auto mb-3 h-14 w-14" />
          <h2 className="font-display text-2xl font-semibold">Quotation Rejected</h2>
          <p className="text-ink-soft mt-2">
            This quotation was previously declined. Please contact us if you&apos;d like to discuss a revised quote.
          </p>
        </Paper>
      </SkContainer>
    )
  }

  const eventDate = data.eventDate ? new Date(data.eventDate) : null
  const quotationNumber = `OMNI-${data.id.slice(0, 8).toUpperCase()}`

  return (
    <SkContainer className="py-8 sm:py-12">
      <Paper className="mx-auto max-w-4xl px-4 py-6 sm:px-6 md:px-8">
        {/* Header */}
        <div className="border-line mb-6 flex items-start justify-between gap-4 border-b-2 border-dashed pb-4">
          <div className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Omnicassion"
              className="mb-2 h-16"
              src="/images/omnilogo.avif"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <p className="text-xs font-semibold">Event Management Platform</p>
            <p className="text-ink-soft text-xs">
              All types of vendors and services related to your event are provided here
            </p>
          </div>
          <div className="text-right">
            <div className="border-ink ml-auto mb-2 h-[72px] w-[72px] shrink-0 rounded-lg border-2 bg-white p-1">
              <QRCodeSVG
                value={`https://omnicassion.com/quote-approval/${token}`}
                size={60}
                level="M"
              />
            </div>
          </div>
        </div>

        {/* Title and Number */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-[clamp(1.9rem,5vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
              <Brush>QUOTATION</Brush>
            </h1>
            <p className="text-ink-soft mt-2 text-sm">For Approval</p>
          </div>
          <Stamp tone="wait" className="max-w-full break-all">
            {quotationNumber}
          </Stamp>
        </div>

        {/* Info Grid */}
        <div className="mb-6 grid grid-cols-1 gap-6 text-sm md:grid-cols-3 md:gap-8">
          <div>
            <p className="sk-eyebrow mb-1">Date Issued:</p>
            <p className="mb-4">{formatDate(data.createdAt)}</p>
            {eventDate && (
              <>
                <p className="sk-eyebrow mb-1">Event Date:</p>
                <p className="mb-4">{format(eventDate, 'MMMM d, yyyy')}</p>
              </>
            )}
            <p className="sk-eyebrow mb-1">Issued to:</p>
            <p className="text-base font-medium break-words">{data.clientName}</p>
          </div>
          <div>
            <p className="sk-eyebrow mb-1">Event Name:</p>
            <p className="text-base font-medium break-words">{data.eventType}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="sk-eyebrow mb-1">Contact Info:</p>
            <p className="text-xs break-words">omnicassion@gmail.com</p>
            <p className="text-xs">+91-6284598500, +91 9988777462</p>
            <p className="text-xs">omnicassion.com</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-ink mb-6 overflow-x-auto rounded-xl border-2">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="bg-blue text-on-blue">
                <th className="px-3 py-2 text-left text-sm font-semibold">SERVICE</th>
                <th className="w-20 px-3 py-2 text-center text-sm font-semibold">QTY</th>
                <th className="w-32 px-3 py-2 text-right text-sm font-semibold">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-line border-b-2 border-dashed">
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium">{item.category}</p>
                    <p className="text-ink-soft text-xs">{item.description}</p>
                    {item.notes && (
                      <p className="text-ink-soft mt-1 text-xs italic">{item.notes}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-sm">{item.quantity}</td>
                  <td className="px-3 py-3 text-right text-sm font-medium whitespace-nowrap">
                    {formatCurrency(item.estimatedBudget)}
                  </td>
                </tr>
              ))}

              {/* Empty rows for visual consistency (minimum 3 items) */}
              {data.items.length < 3 &&
                Array.from({ length: 3 - data.items.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-line border-b-2 border-dashed">
                    <td className="px-3 py-3 text-xs">&nbsp;</td>
                    <td className="px-3 py-3 text-center text-sm">&nbsp;</td>
                    <td className="px-3 py-3 text-right text-sm">&nbsp;</td>
                  </tr>
                ))}

              {/* Grand Total */}
              <tr className="bg-blue-wash">
                <td colSpan={2} className="px-3 py-3 text-right font-bold">
                  GRAND TOTAL
                </td>
                <td className="font-display px-3 py-3 text-right font-bold whitespace-nowrap">
                  {formatCurrency(data.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes Section */}
        {data.notes && (
          <Paper alt className="mb-6 p-4">
            <p className="mb-1 text-sm font-bold">Notes:</p>
            <p className="text-ink-soft text-sm whitespace-pre-wrap">{data.notes}</p>
          </Paper>
        )}

        {/* Approval Section */}
        <Paper alt className="bg-blue-wash mb-6 p-5">
          <h3 className="font-display mb-2 text-lg font-semibold">Your Decision</h3>
          <p className="text-ink-soft mb-4 text-sm">
            Please review the quotation above and let us know if you approve or have any concerns.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <SketchButton
              className="flex-1"
              onClick={handleApprove}
              disabled={approveQuote.isPending}
            >
              {approveQuote.isPending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <ThumbsUp className="size-5" />
                  Approve Quotation
                </>
              )}
            </SketchButton>
            <SketchButton
              variant="line"
              className="text-rose flex-1"
              onClick={() => setShowRejectDialog(true)}
              disabled={rejectQuote.isPending}
            >
              <ThumbsDown className="size-5" />
              Request Changes
            </SketchButton>
          </div>
        </Paper>

        {/* Footer */}
        <div className="border-line border-t-2 border-dashed pt-4 text-center">
          <p className="mb-1 text-xs">
            Visit our website <span className="font-semibold">www.omnicassion.com</span> to get
            access to our services.
          </p>
          <p className="font-display text-lg font-semibold">JUST SIT BACK AND ENJOY</p>
        </div>
      </Paper>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Please let us know what changes you&apos;d like to see in the quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Your Feedback (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Tell us what you'd like to change..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <SketchButton variant="line" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </SketchButton>
            <SketchButton onClick={handleReject} disabled={rejectQuote.isPending}>
              {rejectQuote.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </SketchButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SkContainer>
  )
}
