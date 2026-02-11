'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLeadDetail } from '@/hooks/queries/use-leads'
import { useCreateUserVendorConversation } from '@/hooks/queries/use-messaging'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, Users, DollarSign, Clock, Building2, CheckCircle2, XCircle, Send as SendIcon } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  new: { label: 'New Request', color: 'text-blue-600', bg: 'bg-blue-500/10', icon: SendIcon },
  contacted: { label: 'Vendor Contacted', color: 'text-purple-600', bg: 'bg-purple-500/10', icon: Clock },
  qualified: { label: 'Qualified', color: 'text-indigo-600', bg: 'bg-indigo-500/10', icon: CheckCircle2 },
  proposal_sent: { label: 'Proposal Received', color: 'text-blue-600', bg: 'bg-blue-500/10', icon: SendIcon },
  negotiating: { label: 'Negotiating', color: 'text-yellow-600', bg: 'bg-yellow-500/10', icon: Clock },
  won: { label: 'Accepted', color: 'text-green-600', bg: 'bg-green-500/10', icon: CheckCircle2 },
  lost: { label: 'Declined', color: 'text-red-600', bg: 'bg-red-500/10', icon: XCircle },
  archived: { label: 'Archived', color: 'text-gray-600', bg: 'bg-gray-500/10', icon: XCircle },
}

export default function InquiryDetailPage() {
  const params = useParams<{ leadId?: string }>()
  const leadId = params?.leadId
  const { data, isLoading, error } = useLeadDetail(leadId ?? '')
  const router = useRouter()
  const { mutateAsync: createConversation, isPending: startingConversation } = useCreateUserVendorConversation()

  if (!leadId) {
    return <div className="text-sm text-muted-foreground">Loading inquiry...</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-sm text-destructive">Unable to load inquiry.</div>
  }

  const status = data.status?.toLowerCase() || 'new'
  const config = statusConfig[status] || statusConfig.new
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inquiries">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Quote Request Details</h1>
          <p className="text-sm text-muted-foreground">Review your inquiry and vendor response</p>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bg}`}>
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <p className="font-semibold">{config.label}</p>
            </div>
          </div>
          <Badge variant="secondary" className={`${config.bg} ${config.color}`}>
            {data.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Vendor Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vendor Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-lg font-bold">{data.vendorProfile?.businessName ?? data.vendorProfileId}</p>
            {data.vendorProfile?.slug && (
              <Button variant="link" className="h-auto p-0" asChild>
                <Link href={`/vendors/${data.vendorProfile.slug}`} className="text-sm">
                  View vendor profile →
                </Link>
              </Button>
            )}
          </div>
          {data.vendorProfileId && (
            <Button
              onClick={async () => {
                const conversation = await createConversation(data.vendorProfileId)
                router.push(`/messages?conversationId=${conversation.id}`)
              }}
              disabled={startingConversation}
              className="w-full sm:w-auto"
            >
              Message vendor
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event Date</p>
                <p className="font-medium">
                  {data.eventDate
                    ? new Date(data.eventDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event Type</p>
                <p className="font-medium">{data.eventType ?? 'Not specified'}</p>
              </div>
            </div>

            {data.guestCount && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Guest Count</p>
                  <p className="font-medium">{data.guestCount} guests</p>
                </div>
              </div>
            )}

            {data.budget && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-medium">₹{Number(data.budget).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your Initial Request */}
      {data.initialMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Your Initial Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed">{data.initialMessage}</p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Requested on {new Date(data.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Response Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <SendIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quote request sent</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(data.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {data.respondedAt && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Vendor responded</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(data.respondedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" asChild>
              <Link href={`/vendors/${data.vendorProfile?.slug ?? data.vendorProfileId}`}>
                View Vendor Profile
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/inquiries">Back to All Requests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
