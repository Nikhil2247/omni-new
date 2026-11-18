'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useOpsLeadDetail } from '@/hooks/queries/use-leads'
import { useLeadConversion, useOpsManagers } from '@/hooks/queries/use-ops'
import { useAuthStore } from '@/store/auth-store'

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader, StatusBadge } from '@/components/dashboard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  ArrowRightCircle,
  Calendar,
  DollarSign,
  Users,
  Mail,
  Clock,
  MessageSquare,
  User,
  Store,
  XCircle,
} from 'lucide-react'

const statusConfig: Record<string, { label: string }> = {
  NEW: { label: 'New' },
  CONTACTED: { label: 'Contacted' },
  QUALIFIED: { label: 'Qualified' },
  PROPOSAL_SENT: { label: 'Proposal Sent' },
  NEGOTIATING: { label: 'Negotiating' },
  WON: { label: 'Won' },
  LOST: { label: 'Lost' },
}

const sourceConfig: Record<string, { label: string }> = {
  INQUIRY: { label: 'Website Inquiry' },
  DIRECT_MESSAGE: { label: 'Direct Message' },
  PHONE: { label: 'Phone Call' },
  EXTERNAL: { label: 'External' },
  REFERRAL: { label: 'Referral' },
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const leadId = params.leadId as string

  // Validate that leadId is a valid UUID to prevent API errors
  const isValidUUID = useMemo(() => UUID_REGEX.test(leadId), [leadId])

  const { data: leadResponse, isLoading, error } = useOpsLeadDetail(isValidUUID ? leadId : '')
  const convertLead = useLeadConversion()
  const { data: managersResponse } = useOpsManagers()

  // Handle data wrapper
  const lead = (leadResponse as { data?: typeof leadResponse })?.data || leadResponse
  const managers = managersResponse?.data || []

  // Conversion dialog state
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [conversionData, setConversionData] = useState({
    venueName: '',
    totalBudget: '',
    opsManagerId: '',
  })

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const openConvertDialog = () => {
    if (!lead) return
    setConversionData({
      venueName: '',
      totalBudget: lead.budget?.toString() || '',
      opsManagerId: '',
    })
    setConvertDialogOpen(true)
  }

  const handleConvert = () => {
    if (!lead || !user?.id) return

    convertLead.mutate(
      {
        leadId: lead.id,
        opsAdminId: user.id,
        opsManagerId: conversionData.opsManagerId || undefined,
        venueName: conversionData.venueName || undefined,
        totalBudget: conversionData.totalBudget ? Number(conversionData.totalBudget) : undefined,
      },
      {
        onSuccess: () => {
          setConvertDialogOpen(false)
          router.push('/ops/events')
        },
      }
    )
  }

  const backButton = (
    <Button variant="ghost" size="icon" className="size-7" asChild>
      <Link href="/ops/leads" aria-label="Back to leads">
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </Button>
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Lead" leading={backButton} />
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <Card className="animate-pulse">
              <CardHeader className="p-3 pb-0">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3">
            <Card className="animate-pulse">
              <CardContent className="p-3">
                <div className="h-32 bg-muted rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidUUID || error || !lead) {
    return (
      <div className="space-y-3">
        <PageHeader title="Lead" leading={backButton} />
        <Card className="border-destructive">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {!isValidUUID ? 'Invalid Lead ID' : 'Error Loading Lead'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-sm text-muted-foreground">
              {!isValidUUID
                ? 'The lead ID provided is not valid.'
                : 'Failed to load lead details. Please try again or go back to the leads list.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[lead.status] || { label: lead.status }
  const source = sourceConfig[lead.source] || { label: lead.source }
  const plannerName = lead.planner
    ? `${lead.planner.firstName || ''} ${lead.planner.lastName || ''}`.trim() || lead.planner.email
    : 'Unknown'
  const canConvert = lead.status !== 'WON' && lead.status !== 'LOST'

  return (
    <div className="space-y-3">
      <PageHeader
        title={plannerName}
        leading={backButton}
        actions={
          <>
            <StatusBadge status={lead.status}>{status.label}</StatusBadge>
            {canConvert && (
              <Button size="sm" onClick={openConvertDialog} className="bg-green-600 hover:bg-green-700">
                <ArrowRightCircle className="h-4 w-4 mr-1" />
                Convert to Event
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3">
          {/* Lead Information */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {/* Event Details */}
              <div>
                <h4 className="font-medium mb-2">Event Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Event Type</p>
                    <p className="font-medium">{lead.eventType || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {lead.eventDate
                          ? new Date(lead.eventDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Guest Count</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{lead.guestCount || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{formatCurrency(lead.budget)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Source Information */}
              <div>
                <h4 className="font-medium mb-2">Source Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lead Source</p>
                    <Badge variant="secondary">{source.label}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Received</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {new Date(lead.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Initial Message */}
              {lead.initialMessage && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Initial Message</h4>
                    <Card className="bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <p className="text-sm whitespace-pre-wrap">{lead.initialMessage}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Messages Timeline */}
          {lead.messages && lead.messages.length > 0 && (
            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Communication History</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  {lead.messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                          {message.readAt && (
                            <Badge variant="secondary" className="text-xs">
                              Read
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Client Information */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{plannerName}</p>
                  <p className="text-xs text-muted-foreground">Planner</p>
                </div>
              </div>

              {lead.planner?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <a
                      href={`mailto:${lead.planner.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {lead.planner.email}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Information */}
          {lead.vendorProfile && (
            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{lead.vendorProfile.businessName}</p>
                    <p className="text-xs text-muted-foreground">Vendor</p>
                  </div>
                </div>

                <Link href={`/vendors/${lead.vendorProfile.slug}`} target="_blank">
                  <Button variant="outline" size="sm" className="w-full">
                    View Public Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Lead Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {lead.respondedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">First Response</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.respondedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {lead.convertedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Converted to Event</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.convertedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {lead.eventId && (
                  <Link href={`/ops/events/${lead.eventId}`}>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View Event
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {canConvert && (
            <Card>
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                <Button onClick={openConvertDialog} className="w-full bg-green-600 hover:bg-green-700">
                  <ArrowRightCircle className="h-4 w-4 mr-2" />
                  Convert to Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Convert Lead Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Convert Lead to Event</DialogTitle>
            <DialogDescription>
              Convert this lead to an active event. You can assign a manager and set initial details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Lead Summary */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <p className="font-medium">{plannerName}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Event: {lead.eventType || 'N/A'}</span>
                <span>
                  Date:{' '}
                  {lead.eventDate
                    ? new Date(lead.eventDate).toLocaleDateString()
                    : 'Not set'}
                </span>
                <span>Guests: {lead.guestCount || 'N/A'}</span>
                <span>Budget: {formatCurrency(lead.budget)}</span>
              </div>
            </div>

            {/* Conversion Fields */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name (Optional)</Label>
                <Input
                  id="venueName"
                  placeholder="Grand Ballroom"
                  value={conversionData.venueName}
                  onChange={(e) =>
                    setConversionData((prev) => ({ ...prev, venueName: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Budget</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  placeholder="10000"
                  value={conversionData.totalBudget}
                  onChange={(e) =>
                    setConversionData((prev) => ({ ...prev, totalBudget: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opsManagerId">Assign Ops Manager (Optional)</Label>
                <Select
                  value={conversionData.opsManagerId}
                  onValueChange={(value) =>
                    setConversionData((prev) => ({ ...prev, opsManagerId: value }))
                  }
                >
                  <SelectTrigger id="opsManagerId">
                    <SelectValue placeholder="Select a manager (can assign later)" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.firstName && manager.lastName
                          ? `${manager.firstName} ${manager.lastName}`
                          : manager.email}
                        {manager.managedEventsCount !== undefined
                          ? ` (${manager.managedEventsCount} events)`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave empty to assign a manager later from the event details page.
                </p>
              </div>
            </div>

            {convertLead.isError && (
              <p className="text-sm text-destructive">
                Failed to convert lead. Please try again.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertLead.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {convertLead.isPending ? 'Converting...' : 'Convert to Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
