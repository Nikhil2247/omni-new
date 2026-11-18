'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useOpsActiveEvent,
  useOpsOperationalTasks,
  useOpsAgreements,
  useOpsRequirements,
  useOpsAllInvoices,
  useUpdateActiveEventStatus,
  useUpdateActiveEvent,
  useAssignManager,
  useDeleteActiveEvent,
  useOpsManagers,
  useSendRequirementToClient,
} from '@/hooks/queries/use-ops'
import { useOpsQuotations } from '@/hooks/queries/use-quotations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, PageHeader, StatCard, StatGrid, StatusBadge, type DataColumn } from '@/components/dash'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CalendarIcon,
  Building,
  User,
  Phone,
  Mail,
  Clock,
  FileText,
  Users,
  ListTodo,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Receipt,
  Loader2,
  FileCheck,
  Printer,
  ExternalLink,
  Send,
  Copy,
} from 'lucide-react'
import { OpsRequirementsPanel } from '@/components/features/ops/ops-requirements-panel'
import { OpsAgreementsList } from '@/components/features/ops/ops-agreements-list'
import { OpsTasksList } from '@/components/features/ops/ops-tasks-list'
import { OpsInvoicesList } from '@/components/features/ops/ops-invoices-list'
import { QuotationPreviewDialog } from '@/components/features/ops/quotation-preview-dialog'
import type { QuotationTemplateData } from '@/components/features/ops/quotation-template'

const STATUS_CONFIG: Record<string, { label: string; step: number }> = {
  NEW: { label: 'New', step: 1 },
  ASSIGNED: { label: 'Assigned', step: 2 },
  REQUIREMENTS_SET: { label: 'Requirements Set', step: 3 },
  VENDOR_SOURCING: { label: 'Vendor Sourcing', step: 4 },
  CONTRACTS_LOCKED: { label: 'Contracts Locked', step: 5 },
  EXECUTION: { label: 'Execution', step: 6 },
  COMPLETED: { label: 'Completed', step: 7 },
  CANCELLED: { label: 'Cancelled', step: -1 },
}

const STATUS_FLOW = ['NEW', 'ASSIGNED', 'REQUIREMENTS_SET', 'VENDOR_SOURCING', 'CONTRACTS_LOCKED', 'EXECUTION', 'COMPLETED']

export default function OpsEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.eventId as string

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventType: '',
    eventDate: '',
    eventEndDate: '',
    venueName: '',
    totalBudget: '',
  })
  const [managerIdInput, setManagerIdInput] = useState('')
  const [previewQuotation, setPreviewQuotation] = useState<QuotationTemplateData | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<QuotationTemplateData | null>(null)
  const [showQuotationPreview, setShowQuotationPreview] = useState(false)
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)

  const { data: event, isLoading, error } = useOpsActiveEvent(eventId)
  const { data: tasks } = useOpsOperationalTasks({ activeEventId: eventId })
  const { data: agreements } = useOpsAgreements(eventId)
  const { data: requirements } = useOpsRequirements(eventId)
  const { data: managersResponse } = useOpsManagers()
  const { data: quotationsData } = useOpsQuotations({ activeEventId: eventId })
  const { data: invoicesData } = useOpsAllInvoices({ activeEventId: eventId })

  const updateStatus = useUpdateActiveEventStatus()
  const updateEvent = useUpdateActiveEvent()
  const assignManager = useAssignManager()
  const deleteEvent = useDeleteActiveEvent()
  const sendToClient = useSendRequirementToClient()

  const managers = managersResponse?.data || []

  // Send to client handler
  const handleSendToClient = () => {
    if (!requirements?.id) return
    sendToClient.mutate({ id: requirements.id })
  }

  const getApprovalLink = () => {
    if (!requirements?.approvalToken) return null
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/quote-approval/${requirements.approvalToken}`
  }

  const copyApprovalLink = () => {
    const link = getApprovalLink()
    if (link) {
      navigator.clipboard.writeText(link)
    }
  }

  // Auto-progression logic
  const suggestedStatus = useMemo(() => {
    if (!event) return null
    const currentStatus = event.status
    const hasManager = !!event.opsManagerId
    const hasRequirements = (requirements?.items?.length || 0) > 0
    const hasAgreements = (agreements?.length || 0) > 0
    const agreementsList = agreements || []
    const allAgreementsLocked = agreementsList.length > 0 && agreementsList.every(a => a.status === 'LOCKED' || a.status === 'COMPLETED')
    const hasAcceptedQuotations = quotationsData?.items?.some(q => q.status === 'ACCEPTED')
    const allTasksCompleted = tasks && tasks.length > 0 && tasks.every(t => t.status === 'COMPLETED')

    // Determine what status the event should be at based on current data
    if (currentStatus === 'NEW' && hasManager) {
      return 'ASSIGNED'
    }
    if (currentStatus === 'ASSIGNED' && hasRequirements) {
      return 'REQUIREMENTS_SET'
    }
    if (currentStatus === 'REQUIREMENTS_SET' && hasAgreements) {
      return 'VENDOR_SOURCING'
    }
    if (currentStatus === 'VENDOR_SOURCING' && (allAgreementsLocked || hasAcceptedQuotations)) {
      return 'CONTRACTS_LOCKED'
    }
    if (currentStatus === 'CONTRACTS_LOCKED' && tasks && tasks.length > 0 && tasks.some(t => t.status === 'IN_PROGRESS')) {
      return 'EXECUTION'
    }
    if (currentStatus === 'EXECUTION' && allTasksCompleted) {
      return 'COMPLETED'
    }
    return null
  }, [event, requirements, agreements, quotationsData, tasks])

  // Auto-advance status when conditions are met
  useEffect(() => {
    if (suggestedStatus && event && !updateStatus.isPending) {
      // Auto-advance for the first few stages, require manual for later stages
      const autoAdvanceStages = ['ASSIGNED', 'REQUIREMENTS_SET', 'VENDOR_SOURCING']
      if (autoAdvanceStages.includes(suggestedStatus)) {
        updateStatus.mutate({ id: eventId, status: suggestedStatus })
      }
    }
  }, [suggestedStatus, event, eventId, updateStatus.isPending])

  // Preview handlers
  const openQuotationPreview = (quotation: any) => {
    const data: QuotationTemplateData = {
      quotationNumber: quotation.quotationNumber,
      dateIssued: quotation.createdAt,
      validUntil: quotation.validUntil,
      clientName: event?.clientName || 'N/A',
      clientEmail: event?.clientEmail,
      clientPhone: event?.clientPhone,
      vendorName: quotation.vendorAgreement?.vendorName || 'N/A',
      items: quotation.items || [{ description: 'Services as per agreement', quantity: 1, rate: Number(quotation.totalAmount), amount: Number(quotation.totalAmount) }],
      subtotal: Number(quotation.subtotal || quotation.totalAmount),
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      discount: quotation.discount,
      grandTotal: Number(quotation.totalAmount),
      notes: quotation.notes,
      termsAndConditions: quotation.termsAndConditions,
    }
    setPreviewQuotation(data)
    setShowQuotationPreview(true)
  }

  const openInvoicePreview = (invoice: any) => {
    const data: QuotationTemplateData = {
      quotationNumber: invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
      dateIssued: invoice.issuedAt,
      validUntil: invoice.dueDate,
      clientName: event?.clientName || invoice.vendorAgreement?.activeEvent?.clientName || 'N/A',
      clientEmail: event?.clientEmail,
      clientPhone: event?.clientPhone,
      vendorName: invoice.vendorAgreement?.vendorName || 'N/A',
      items: invoice.items?.length ? invoice.items : [{ description: 'Services as per agreement', quantity: 1, rate: Number(invoice.amount), amount: Number(invoice.amount) }],
      subtotal: Number(invoice.amount),
      grandTotal: Number(invoice.amount),
    }
    setPreviewInvoice(data)
    setShowInvoicePreview(true)
  }

  const handleEditOpen = () => {
    if (event) {
      setEditForm({
        clientName: event.clientName || '',
        clientEmail: event.clientEmail || '',
        clientPhone: event.clientPhone || '',
        eventType: event.eventType || '',
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
        eventEndDate: event.eventEndDate ? new Date(event.eventEndDate).toISOString().slice(0, 16) : '',
        venueName: event.venueName || '',
        totalBudget: event.totalBudget ? String(event.totalBudget) : '',
      })
      setIsEditDialogOpen(true)
    }
  }

  const handleEditSave = async () => {
    await updateEvent.mutateAsync({
      id: eventId,
      payload: {
        clientName: editForm.clientName || undefined,
        clientEmail: editForm.clientEmail || undefined,
        clientPhone: editForm.clientPhone || undefined,
        eventType: editForm.eventType || undefined,
        eventDate: editForm.eventDate || undefined,
        eventEndDate: editForm.eventEndDate || undefined,
        venueName: editForm.venueName || undefined,
        totalBudget: editForm.totalBudget ? Number(editForm.totalBudget) : undefined,
      },
    })
    setIsEditDialogOpen(false)
  }

  const handleAssignManager = async () => {
    if (managerIdInput.trim()) {
      await assignManager.mutateAsync({ id: eventId, opsManagerId: managerIdInput.trim() })
      setIsAssignDialogOpen(false)
      setManagerIdInput('')
    }
  }


  const handleDelete = async () => {
    await deleteEvent.mutateAsync(eventId)
    router.push('/ops/events')
  }

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id: eventId, status: newStatus })
  }

  const getNextStatus = () => {
    if (!event) return null
    const currentIndex = STATUS_FLOW.indexOf(event.status)
    if (currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1]
    }
    return null
  }

  const backButton = (
    <Button variant="ghost" size="icon" className="size-7" asChild>
      <Link href="/ops/events" aria-label="Back to events">
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </Button>
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="space-y-4">
        <PageHeader title="Event" leading={backButton} />
        <Card>
          <CardContent className="py-4 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            <p className="text-destructive font-medium">Failed to load event details</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = STATUS_CONFIG[event.status] || { label: event.status, step: 0 }
  const tasksCount = tasks?.length || 0
  const completedTasksCount = tasks?.filter(t => t.status === 'COMPLETED').length || 0
  const agreementsCount = agreements?.length || 0
  const requirementsCount = requirements?.items?.length || 0
  const quotationsCount = quotationsData?.items?.length || 0
  const invoicesCount = invoicesData?.items?.length || 0

  const budget = event.totalBudget ? Number(event.totalBudget) : 0
  const spent = event.totalSpend ? Number(event.totalSpend) : 0
  const remaining = budget - spent
  const spendPercentage = budget > 0 ? (spent / budget) * 100 : 0

  const nextStatus = getNextStatus()

  type EventQuotation = NonNullable<typeof quotationsData>['items'][number]
  const quotationColumns: DataColumn<EventQuotation>[] = [
    {
      id: 'number',
      header: 'Quotation #',
      label: 'Quotation #',
      cell: (q) => <span className="font-medium">{q.quotationNumber}</span>,
      sortValue: (q) => q.quotationNumber,
      exportValue: (q) => q.quotationNumber,
    },
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (q) => q.vendorAgreement?.vendorName || 'Unknown Vendor',
      sortValue: (q) => q.vendorAgreement?.vendorName,
      exportValue: (q) => q.vendorAgreement?.vendorName,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (q) => <StatusBadge status={q.status} />,
      sortValue: (q) => q.status,
      exportValue: (q) => q.status,
    },
    {
      id: 'amount',
      header: 'Amount',
      label: 'Amount',
      align: 'right',
      cell: (q) => <span className="font-semibold">₹{Number(q.totalAmount).toLocaleString()}</span>,
      sortValue: (q) => Number(q.totalAmount),
      exportValue: (q) => Number(q.totalAmount),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title={event.clientName}
        leading={backButton}
        actions={
          <>
            <StatusBadge status={event.status}>{status.label}</StatusBadge>
          {/* Show manual advance hint for later stages */}
          {suggestedStatus && !['ASSIGNED', 'REQUIREMENTS_SET', 'VENDOR_SOURCING'].includes(suggestedStatus) && (
            <Button
              onClick={() => handleStatusChange(suggestedStatus)}
              disabled={updateStatus.isPending}
              size="sm"
              variant="outline"
              className="text-success border-success/40 hover:bg-success/10"
            >
              {updateStatus.isPending ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-3 w-3" />
              )}
              Ready for {STATUS_CONFIG[suggestedStatus]?.label}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditOpen}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAssignDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Manager
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Event
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this event? This action cannot be undone.
                      All associated requirements, agreements, tasks, and invoices will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteEvent.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
          </>
        }
      />

      {/* Event summary with workflow */}
      <Card className="border-0 shadow-sm">
        <CardContent className="space-y-2 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">{event.eventType}</span>
            <span className="text-muted-foreground">
              {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'Date TBD'}
              {' · '}₹{budget.toLocaleString()} budget
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{STATUS_CONFIG[event.status]?.step || 1} of {STATUS_FLOW.length}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${((STATUS_CONFIG[event.status]?.step || 1) / STATUS_FLOW.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              {STATUS_FLOW.map((s) => {
                const config = STATUS_CONFIG[s]
                const isActive = event.status === s
                const isPast = config.step < (STATUS_CONFIG[event.status]?.step || 1)

                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updateStatus.isPending}
                    className={`text-xs transition-colors ${
                      isActive ? 'text-primary font-medium' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
                    }`}
                    title={`Set to ${config.label}`}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <StatGrid>
        <StatCard label="Requirements" value={requirementsCount} icon={ListTodo} />
        <StatCard label="Agreements" value={agreementsCount} icon={Users} />
        <StatCard label="Tasks Done" value={`${completedTasksCount}/${tasksCount}`} icon={CheckCircle} />
        <StatCard
          label="Remaining"
          value={`₹${remaining.toLocaleString()}`}
          icon={Receipt}
          accent={remaining < 0 ? 'text-destructive' : undefined}
        />
      </StatGrid>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex-1 sm:flex-none">
            <ListTodo className="h-4 w-4 mr-2" />
            Requirements
            {requirementsCount > 0 && <Badge variant="secondary" className="ml-2">{requirementsCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="agreements" className="flex-1 sm:flex-none">
            <Users className="h-4 w-4 mr-2" />
            Agreements
            {agreementsCount > 0 && <Badge variant="secondary" className="ml-2">{agreementsCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="quotations" className="flex-1 sm:flex-none">
            <FileCheck className="h-4 w-4 mr-2" />
            Quotations
            {quotationsCount > 0 && <Badge variant="secondary" className="ml-2">{quotationsCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 sm:flex-none">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
            {invoicesCount > 0 && <Badge variant="secondary" className="ml-2">{invoicesCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 sm:flex-none">
            <CheckCircle className="h-4 w-4 mr-2" />
            Tasks
            {tasksCount > 0 && <Badge variant="secondary" className="ml-2">{tasksCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-3">
            {/* Client Info */}
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm font-medium">Client & Event Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Client</p>
                  <p className="font-medium">{event.clientName}</p>
                </div>

                {event.clientEmail && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                    <a href={`mailto:${event.clientEmail}`} className="font-medium text-primary hover:underline text-sm">
                      {event.clientEmail}
                    </a>
                  </div>
                )}

                {event.clientPhone && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                    <a href={`tel:${event.clientPhone}`} className="font-medium text-primary hover:underline text-sm">
                      {event.clientPhone}
                    </a>
                  </div>
                )}

                {event.venueName && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Venue</p>
                    <p className="font-medium text-sm">{event.venueName}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Event Date</p>
                  <p className="font-medium text-sm">
                    {event.eventDate ? new Date(event.eventDate).toLocaleString() : 'To be determined'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Origin</p>
                  <Badge variant="secondary" className="text-xs">{event.origin.replace(/_/g, ' ')}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm font-medium">Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">{Math.round(spendPercentage)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        spendPercentage > 90 ? 'bg-destructive' : spendPercentage > 70 ? 'bg-warning' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-semibold">₹{budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Spent</span>
                    <span className="font-semibold">₹{spent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className={`font-semibold ${remaining < 0 ? 'text-destructive' : ''}`}>
                      ₹{remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Requirements Sheet</CardTitle>
                  {requirements?.approvalStatus && (
                    <Badge variant="outline" className={
                      requirements.approvalStatus === 'APPROVED' ? 'bg-success/10 text-success' :
                      requirements.approvalStatus === 'PENDING' ? 'bg-warning/10 text-warning' :
                      requirements.approvalStatus === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-foreground'
                    }>
                      {requirements.approvalStatus === 'APPROVED' ? 'Client Approved' :
                       requirements.approvalStatus === 'PENDING' ? 'Awaiting Approval' :
                       requirements.approvalStatus === 'REJECTED' ? 'Client Rejected' :
                       'Draft'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {requirements && requirements.approvalStatus !== 'APPROVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendToClient}
                    disabled={sendToClient.isPending || !requirements?.items?.length}
                  >
                    {sendToClient.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {requirements?.approvalStatus === 'PENDING' ? 'Resend' : 'Send to Client'}
                  </Button>
                )}
                <Link href={`/ops/events/${eventId}/requirements`}>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Full View
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {/* Approval Link Info */}
              {requirements?.approvalStatus === 'PENDING' && requirements?.approvalToken && (
                <div className="mb-2 p-2.5 bg-warning/10 border border-warning/40 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-warning">
                        Awaiting client approval
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={copyApprovalLink}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(getApprovalLink() || '', '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {requirements?.approvalStatus === 'APPROVED' && (
                <div className="mb-2 p-2.5 bg-success/10 border border-success/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      Client approved on {requirements.clientApprovedAt ? new Date(requirements.clientApprovedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
              {requirements?.approvalStatus === 'REJECTED' && (
                <div className="mb-2 p-2.5 bg-destructive/10 border border-destructive/40 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        Client rejected on {requirements.clientRejectedAt ? new Date(requirements.clientRejectedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {requirements.rejectionReason && (
                      <p className="text-sm text-destructive ml-6">
                        Reason: {requirements.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <OpsRequirementsPanel activeEventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
              <div>
                <CardTitle className="text-sm">Vendor Agreements</CardTitle>
              </div>
              <Link href={`/ops/events/${eventId}/agreements`}>
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Full View
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-3">
              <OpsAgreementsList activeEventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
              <div>
                <CardTitle className="text-sm">Operational Tasks</CardTitle>
              </div>
              <Link href={`/ops/events/${eventId}/tasks`}>
                <Button variant="outline" size="sm">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Full View
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-3">
              <OpsTasksList activeEventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
              <div>
                <CardTitle className="text-sm">Quotations</CardTitle>
              </div>
              <Link href="/ops/quotations">
                <Button variant="outline" size="sm">
                  <FileCheck className="mr-2 h-4 w-4" />
                  All Quotations
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-3">
              <DataTable
                data={quotationsData?.items}
                rowKey={(q) => q.id}
                defaultPageSize={10}
                pageSizeOptions={[10, 20]}
                exportFilename="event-quotations"
                emptyTitle="No quotations yet"
                emptyIcon={FileCheck}
                columns={quotationColumns}
                rowActions={(q) => [
                  { label: 'Print', icon: Printer, onClick: () => openQuotationPreview(q) },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
              <div>
                <CardTitle className="text-sm">Invoices & Billing</CardTitle>
              </div>
              <Link href={`/ops/events/${eventId}/invoices`}>
                <Button variant="outline" size="sm">
                  <Receipt className="mr-2 h-4 w-4" />
                  Full View
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-3">
              <OpsInvoicesList activeEventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details and information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={editForm.clientName}
                  onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  value={editForm.eventType}
                  onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={editForm.clientEmail}
                  onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  value={editForm.clientPhone}
                  onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventEndDate">Event End Date</Label>
                <Input
                  id="eventEndDate"
                  type="datetime-local"
                  value={editForm.eventEndDate}
                  onChange={(e) => setEditForm({ ...editForm, eventEndDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  value={editForm.venueName}
                  onChange={(e) => setEditForm({ ...editForm, venueName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totalBudget">Total Budget</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  value={editForm.totalBudget}
                  onChange={(e) => setEditForm({ ...editForm, totalBudget: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={updateEvent.isPending}>
              {updateEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Manager Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Operations Manager</DialogTitle>
            <DialogDescription>
              Assign an operations manager to handle this event.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="managerId">Manager</Label>
              <Select value={managerIdInput} onValueChange={setManagerIdInput}>
                <SelectTrigger id="managerId">
                  <SelectValue placeholder="Select a manager" />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignManager} disabled={assignManager.isPending || !managerIdInput.trim()}>
              {assignManager.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quotation Preview Dialog */}
      <QuotationPreviewDialog
        open={showQuotationPreview}
        onOpenChange={setShowQuotationPreview}
        data={previewQuotation}
        type="quotation"
      />

      {/* Invoice Preview Dialog */}
      <QuotationPreviewDialog
        open={showInvoicePreview}
        onOpenChange={setShowInvoicePreview}
        data={previewInvoice}
        type="invoice"
      />
    </div>
  )
}
