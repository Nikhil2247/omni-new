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
} from '@/hooks/queries/use-ops'
import { useOpsQuotations } from '@/hooks/queries/use-quotations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'
import { OpsRequirementsPanel } from '@/components/features/ops/ops-requirements-panel'
import { OpsAgreementsList } from '@/components/features/ops/ops-agreements-list'
import { OpsTasksList } from '@/components/features/ops/ops-tasks-list'
import { OpsInvoicesList } from '@/components/features/ops/ops-invoices-list'
import { QuotationPreviewDialog } from '@/components/features/ops/quotation-preview-dialog'
import type { QuotationTemplateData } from '@/components/features/ops/quotation-template'

const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  NEW: { label: 'New', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', step: 1 },
  ASSIGNED: { label: 'Assigned', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20', step: 2 },
  REQUIREMENTS_SET: { label: 'Requirements Set', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20', step: 3 },
  VENDOR_SOURCING: { label: 'Vendor Sourcing', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', step: 4 },
  CONTRACTS_LOCKED: { label: 'Contracts Locked', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20', step: 5 },
  EXECUTION: { label: 'Execution', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20', step: 6 },
  COMPLETED: { label: 'Completed', color: 'bg-green-500/10 text-green-700 border-green-500/20', step: 7 },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500/10 text-red-700 border-red-500/20', step: -1 },
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

  const managers = managersResponse?.data || []

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

  if (isLoading) {
    return (
      <div className="space-y-6">
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
      <div className="space-y-6">
        <Link href="/ops/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
            <p className="text-destructive font-medium">Failed to load event details</p>
            <p className="text-sm text-muted-foreground mt-1">The event may not exist or there was a server error.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = STATUS_CONFIG[event.status] || { label: event.status, color: 'bg-gray-500/10 text-gray-700', step: 0 }
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

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <Link href="/ops/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>

        <div className="flex items-center gap-2">
          {/* Show manual advance hint for later stages */}
          {suggestedStatus && !['ASSIGNED', 'REQUIREMENTS_SET', 'VENDOR_SOURCING'].includes(suggestedStatus) && (
            <Button
              onClick={() => handleStatusChange(suggestedStatus)}
              disabled={updateStatus.isPending}
              size="sm"
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
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
        </div>
      </div>

      {/* Event Header Card with Workflow */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold tracking-tight">{event.clientName}</h1>
                <Badge variant="outline" className={`${status.color} font-medium`}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{event.eventType}</p>
            </div>

            {/* Quick Info */}
            <div className="text-right text-sm">
              <p className="font-medium">
                {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'Date TBD'}
              </p>
              <p className="text-muted-foreground">${budget.toLocaleString()} budget</p>
            </div>
          </div>

          {/* Minimal Workflow Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{STATUS_CONFIG[event.status]?.step || 1} of {STATUS_FLOW.length}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${((STATUS_CONFIG[event.status]?.step || 1) / STATUS_FLOW.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
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

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-xl font-semibold">{requirementsCount}</p>
              <p className="text-xs text-muted-foreground">Requirements</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{agreementsCount}</p>
              <p className="text-xs text-muted-foreground">Agreements</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{completedTasksCount}<span className="text-muted-foreground">/{tasksCount}</span></p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </div>
            <div>
              <p className={`text-xl font-semibold ${remaining < 0 ? 'text-red-600' : ''}`}>
                ${remaining.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
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
          <TabsTrigger value="tasks" className="flex-1 sm:flex-none">
            <CheckCircle className="h-4 w-4 mr-2" />
            Tasks
            {tasksCount > 0 && <Badge variant="secondary" className="ml-2">{tasksCount}</Badge>}
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
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Client Info */}
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Client & Event Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">{Math.round(spendPercentage)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        spendPercentage > 90 ? 'bg-red-500' : spendPercentage > 70 ? 'bg-yellow-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-semibold">${budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Spent</span>
                    <span className="font-semibold">${spent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className={`font-semibold ${remaining < 0 ? 'text-red-600' : ''}`}>
                      ${remaining.toLocaleString()}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Requirements Sheet</CardTitle>
                <CardDescription>Manage vendor requirements for this event</CardDescription>
              </div>
              <Link href={`/ops/events/${eventId}/requirements`}>
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Full View
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <OpsRequirementsPanel activeEventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Vendor Agreements</CardTitle>
                <CardDescription>Contracts and agreements with vendors</CardDescription>
              </div>
              <Link href={`/ops/events/${eventId}/agreements`}>
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Full View
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <OpsAgreementsList activeEventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Operational Tasks</CardTitle>
                <CardDescription>Tasks for event execution</CardDescription>
              </div>
              <Link href={`/ops/events/${eventId}/tasks`}>
                <Button variant="outline" size="sm">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Full View
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <OpsTasksList activeEventId={eventId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Quotations</CardTitle>
                <CardDescription>Vendor quotations for this event</CardDescription>
              </div>
              <Link href="/ops/quotations">
                <Button variant="outline" size="sm">
                  <FileCheck className="mr-2 h-4 w-4" />
                  All Quotations
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {quotationsCount === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No quotations yet
                </div>
              ) : (
                <div className="divide-y">
                  {quotationsData?.items?.slice(0, 5).map((quotation) => (
                    <div key={quotation.id} className="flex items-center justify-between py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{quotation.quotationNumber}</span>
                          <Badge variant="outline" className={
                            quotation.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            quotation.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                            quotation.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {quotation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {quotation.vendorAgreement?.vendorName || 'Unknown Vendor'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {quotation.currency === 'INR' ? '₹' : '$'}{Number(quotation.totalAmount).toLocaleString()}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => openQuotationPreview(quotation)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                      </div>
                    </div>
                  ))}
                  {quotationsCount > 5 && (
                    <Link href="/ops/quotations" className="block pt-3 text-sm text-primary hover:underline">
                      View all {quotationsCount} quotations
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Invoices & Billing</CardTitle>
                <CardDescription>Financial records and payment tracking</CardDescription>
              </div>
              <Link href={`/ops/events/${eventId}/invoices`}>
                <Button variant="outline" size="sm">
                  <Receipt className="mr-2 h-4 w-4" />
                  Full View
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={editForm.clientName}
                  onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  value={editForm.eventType}
                  onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={editForm.clientEmail}
                  onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  value={editForm.clientPhone}
                  onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={editForm.eventDate}
                  onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventEndDate">Event End Date</Label>
                <Input
                  id="eventEndDate"
                  type="datetime-local"
                  value={editForm.eventEndDate}
                  onChange={(e) => setEditForm({ ...editForm, eventEndDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  value={editForm.venueName}
                  onChange={(e) => setEditForm({ ...editForm, venueName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
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
          <div className="py-4 space-y-4">
            <div className="space-y-2">
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
