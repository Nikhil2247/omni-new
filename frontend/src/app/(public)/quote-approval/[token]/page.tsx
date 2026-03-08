'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'
import { useQuoteDetails, useApproveQuote, useRejectQuote } from '@/hooks/queries/use-public-quote-approval'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

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
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border-4 border-black max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold">Invalid Link</h2>
          <p className="mt-2 text-gray-600">
            This quote approval link is invalid or has expired. Please contact Omnicassion for assistance.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Email: omnicassion@gmail.com | Phone: +91-6284598500
          </p>
        </div>
      </div>
    )
  }

  // Success states
  if (actionCompleted === 'approved') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border-4 border-green-500 max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700">Quotation Approved!</h2>
          <p className="mt-3 text-gray-600">
            Thank you for approving the quotation for your <span className="font-semibold">{data.eventType}</span>.
            Our team will proceed with the next steps and contact you shortly.
          </p>
          <Badge className="mt-4 bg-green-100 text-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-lg font-bold">JUST SIT BACK AND ENJOY</p>
          </div>
        </div>
      </div>
    )
  }

  if (actionCompleted === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border-4 border-black max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold">Feedback Received</h2>
          <p className="mt-3 text-gray-600">
            Thank you for your feedback. Our team will review your comments and contact you to discuss alternatives.
          </p>
          <Badge className="mt-4 bg-gray-100 text-gray-700">
            <Clock className="mr-1 h-3 w-3" />
            Under Review
          </Badge>
        </div>
      </div>
    )
  }

  // Already processed states
  if (data.approvalStatus === 'APPROVED') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border-4 border-green-500 max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Already Approved</h2>
          <p className="mt-2 text-gray-600">
            This quotation has already been approved. Our team is working on your {data.eventType}.
          </p>
        </div>
      </div>
    )
  }

  if (data.approvalStatus === 'REJECTED') {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border-4 border-black max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <XCircle className="h-8 w-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold">Quotation Rejected</h2>
          <p className="mt-2 text-gray-600">
            This quotation was previously declined. Please contact us if you'd like to discuss a revised quote.
          </p>
        </div>
      </div>
    )
  }

  const eventDate = data.eventDate ? new Date(data.eventDate) : null
  const quotationNumber = `OMNI-${data.id.slice(0, 8).toUpperCase()}`

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div
        className="bg-white rounded-lg shadow-lg p-6 md:p-8 border-4 border-black max-w-4xl mx-auto"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
          <div>
            <img
              alt="Omnicassion"
              className="h-16 mb-2"
              src="/images/omnilogo.avif"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <p className="text-xs font-semibold">Event Management Platform</p>
            <p className="text-xs text-gray-600">
              All types of vendors and services related to your event are provided here
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 ml-auto mb-2">
              <QRCodeSVG
                value={`https://omnicassion.com/quote-approval/${token}`}
                size={64}
                level="M"
              />
            </div>
          </div>
        </div>

        {/* Title and Number */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">QUOTATION</h1>
            <p className="text-sm text-gray-600 mt-1">For Approval</p>
          </div>
          <div className="border-2 border-black px-4 py-2">
            <span className="text-sm font-semibold">{quotationNumber}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 text-sm">
          <div>
            <p className="font-semibold mb-1">Date Issued:</p>
            <p className="mb-4">{formatDate(data.createdAt)}</p>
            {eventDate && (
              <>
                <p className="font-semibold mb-1">Event Date:</p>
                <p className="mb-4">{format(eventDate, 'MMMM d, yyyy')}</p>
              </>
            )}
            <p className="font-semibold mb-1">Issued to:</p>
            <p className="font-medium text-base">{data.clientName}</p>
          </div>
          <div>
            <p className="font-semibold mb-1">Event Name:</p>
            <p className="font-medium text-base">{data.eventType}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="font-semibold mb-1">Contact Info:</p>
            <p className="text-xs">omnicassion@gmail.com</p>
            <p className="text-xs">+91-6284598500, +91 9988777462</p>
            <p className="text-xs">omnicassion.com</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full mb-6 border-collapse border border-gray-300">
            <thead>
              <tr className="bg-black text-white">
                <th className="text-left px-3 py-2 text-sm font-semibold border-r border-gray-400">
                  SERVICE
                </th>
                <th className="text-center px-3 py-2 text-sm font-semibold border-r border-gray-400 w-20">
                  QTY
                </th>
                <th className="text-right px-3 py-2 text-sm font-semibold w-32">
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="px-3 py-3 border-r border-gray-300">
                    <p className="font-medium text-sm">{item.category}</p>
                    <p className="text-xs text-gray-600">{item.description}</p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-sm border-r border-gray-300">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-medium">
                    {formatCurrency(item.estimatedBudget)}
                  </td>
                </tr>
              ))}

              {/* Empty rows for visual consistency (minimum 3 items) */}
              {data.items.length < 3 &&
                Array.from({ length: 3 - data.items.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-gray-300">
                    <td className="px-3 py-3 text-xs border-r border-gray-300">&nbsp;</td>
                    <td className="px-3 py-3 text-center text-sm border-r border-gray-300">&nbsp;</td>
                    <td className="px-3 py-3 text-right text-sm">&nbsp;</td>
                  </tr>
                ))}

              {/* Grand Total */}
              <tr className="bg-black text-white border-b border-gray-300">
                <td colSpan={2} className="px-3 py-3 text-right font-bold border-r border-gray-400">
                  GRAND TOTAL
                </td>
                <td className="px-3 py-3 text-right font-bold">
                  {formatCurrency(data.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes Section */}
        {data.notes && (
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="font-bold text-sm mb-1">Notes:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Bank Details */}
        {/* <div className="mb-6 p-5 bg-gray-50 rounded">
          <p className="font-bold text-sm mb-3">Company Bank Detail:</p>
          <p className="text-sm mb-2">Bank Name: HDFC BANK</p>
          <p className="text-sm mb-2">Account No: 50100570331614</p>
          <p className="text-sm">Account Name: ADITYA</p>
        </div> */}

        {/* Approval Section */}
        <div className="mb-6 p-5 bg-blue-50 rounded border-2 border-blue-200">
          <h3 className="font-bold text-lg mb-2">Your Decision</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please review the quotation above and let us know if you approve or have any concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={handleApprove}
              disabled={approveQuote.isPending}
            >
              {approveQuote.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <ThumbsUp className="mr-2 h-5 w-5" />
                  Approve Quotation
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-2 border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
              onClick={() => setShowRejectDialog(true)}
              disabled={rejectQuote.isPending}
            >
              <ThumbsDown className="mr-2 h-5 w-5" />
              Request Changes
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black pt-4 text-center">
          <p className="text-xs mb-1">
            Visit our website <span className="font-semibold">www.omnicassion.com</span> to get
            access to our services.
          </p>
          <p className="text-lg font-bold">JUST SIT BACK AND ENJOY</p>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Please let us know what changes you'd like to see in the quotation.
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
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectQuote.isPending}
            >
              {rejectQuote.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
