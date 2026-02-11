'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useOpsActiveEvent,
  useOpsOperationalTasks,
  useOpsAgreements,
  useOpsRequirements,
  useUpdateActiveEventStatus,
  useUpdateActiveEvent,
  useAssignManager,
  useDeleteActiveEvent,
  useOpsManagers,
} from '@/hooks/queries/use-ops'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogTrigger,
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
  DollarSign,
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
  ChevronRight,
  Loader2,
  ArrowRightCircle,
} from 'lucide-react'
import { OpsRequirementsPanel } from '@/components/features/ops/ops-requirements-panel'
import { OpsAgreementsList } from '@/components/features/ops/ops-agreements-list'
import { OpsTasksList } from '@/components/features/ops/ops-tasks-list'

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

  const { data: event, isLoading, error } = useOpsActiveEvent(eventId)
  const { data: tasks } = useOpsOperationalTasks({ activeEventId: eventId })
  const { data: agreements } = useOpsAgreements(eventId)
  const { data: requirements } = useOpsRequirements(eventId)
  const { data: managersResponse } = useOpsManagers()

  const updateStatus = useUpdateActiveEventStatus()
  const updateEvent = useUpdateActiveEvent()
  const assignManager = useAssignManager()
  const deleteEvent = useDeleteActiveEvent()

  const managers = managersResponse?.data || []

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
  const lockedAgreementsCount = agreements?.filter(a => a.status === 'LOCKED').length || 0
  const requirementsCount = requirements?.items?.length || 0

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
          {nextStatus && (
            <Button
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updateStatus.isPending}
              size="sm"
            >
              {updateStatus.isPending ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <ArrowRightCircle className="mr-2 h-3 w-3" />
              )}
              Advance
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
      <Card>
        <CardContent className="p-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{event.clientName}</h1>
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">{event.eventType}</p>
            </div>
            
            {/* Quick Info */}
            <div className="text-right">
              <p className="text-sm font-medium">
                {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                }) : 'Date TBD'}
              </p>
              <p className="text-sm text-muted-foreground">Budget: ${budget.toLocaleString()}</p>
            </div>
          </div>

          {/* Workflow Stepper */}
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
              style={{ width: `${(STATUS_CONFIG[event.status]?.step / STATUS_FLOW.length) * 100}%` }}
            />
            
            <div className="relative flex items-center justify-between">
              {STATUS_FLOW.map((s, index) => {
                const config = STATUS_CONFIG[s]
                const isActive = event.status === s
                const isPast = config.step < STATUS_CONFIG[event.status]?.step

                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updateStatus.isPending}
                    className="group flex flex-col items-center"
                    title={`Click to set status to ${config.label}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 border-2 transition-all duration-300 ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-lg'
                          : isPast
                          ? 'bg-primary/90 text-primary-foreground border-primary'
                          : 'bg-background border-border group-hover:border-primary/50 group-hover:scale-105'
                      }`}
                    >
                      {isPast || isActive ? <CheckCircle className="h-5 w-5" /> : index + 1}
                    </div>
                    <span className={`text-xs font-medium text-center max-w-20 ${
                      isActive ? 'text-foreground' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/60'
                    }`}>
                      {config.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{requirementsCount}</p>
              <p className="text-xs text-muted-foreground">Requirements</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{agreementsCount}</p>
              <p className="text-xs text-muted-foreground">Agreements</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{completedTasksCount}/{tasksCount}</p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
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
          <TabsTrigger value="invoices" className="flex-1 sm:flex-none">
            <Receipt className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Client Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Client Information</CardTitle>
                <CardDescription>Contact details and event information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client Name</p>
                    <p className="font-medium">{event.clientName}</p>
                  </div>
                </div>

                {event.clientEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${event.clientEmail}`} className="font-medium text-primary hover:underline">
                        {event.clientEmail}
                      </a>
                    </div>
                  </div>
                )}

                {event.clientPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${event.clientPhone}`} className="font-medium text-primary hover:underline">
                        {event.clientPhone}
                      </a>
                    </div>
                  </div>
                )}

                {event.venueName && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-medium">{event.venueName}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Event Date</p>
                    <p className="font-medium">
                      {event.eventDate ? new Date(event.eventDate).toLocaleString() : 'To be determined'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Overview</CardTitle>
                <CardDescription>Financial tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-medium">${spent.toLocaleString()} / ${budget.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        spendPercentage > 90 ? 'bg-red-500' : spendPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(spendPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                    <p className="text-lg font-bold text-green-600">${budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-lg font-bold text-orange-600">${spent.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      ${remaining.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Origin Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{event.origin.replace(/_/g, ' ')}</Badge>
                  <span className="text-sm text-muted-foreground">Origin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{event.eventType}</Badge>
                  <span className="text-sm text-muted-foreground">Event Type</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Invoices functionality coming soon</p>
                <Link href={`/ops/events/${eventId}/invoices`}>
                  <Button variant="outline">
                    View Invoices Page
                  </Button>
                </Link>
              </div>
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

    </div>
  )
}
