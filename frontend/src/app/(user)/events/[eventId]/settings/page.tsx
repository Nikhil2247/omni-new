'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { trackDashboard } from '@/lib/analytics/umami'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/queries/use-events'
import { useEventTypes } from '@/hooks/queries/use-lookups'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
import { cn } from '@/lib/utils'
import {
  Settings,
  Calendar,
  MapPin,
  Users,
  FileText,
  Save,
  Trash2,
  AlertTriangle,
  Crown,
  Coins,
} from 'lucide-react'

const eventSettingsSchema = z.object({
  name: z.string().min(2, 'Event name is required'),
  eventTypeId: z.string().min(1, 'Event type ID is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  description: z.string().optional(),
  venue: z.string().optional(),
  expectedGuests: z
    .string()
    .optional()
    .refine((value) => !value || Number(value) > 0, {
      message: 'Guest count must be greater than 0',
    }),
})

type EventSettingsValues = z.infer<typeof eventSettingsSchema>

export default function EventSettingsPage() {
  const router = useRouter()
  const params = useParams<{ eventId?: string }>()
  const eventId = params?.eventId
  const { data, isLoading, error } = useEvent(eventId ?? '')
  const { data: eventTypes, isLoading: eventTypesLoading } = useEventTypes()
  const updateEvent = useUpdateEvent(eventId ?? '')
  const deleteEvent = useDeleteEvent()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (eventId) trackDashboard.sectionView('event-settings', 'user')
  }, [eventId])

  const form = useForm<EventSettingsValues>({
    resolver: zodResolver(eventSettingsSchema),
    defaultValues: {
      name: '',
      eventTypeId: '',
      eventDate: '',
      description: '',
      venue: '',
      expectedGuests: '',
    },
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      name: data.name ?? '',
      eventTypeId: data.eventTypeId ?? '',
      eventDate: data.date ? data.date.slice(0, 10) : '',
      description: data.description ?? '',
      venue: data.venueName ?? '',
      expectedGuests: data.guestCount ? String(data.guestCount) : '',
    })
  }, [data, form])

  const onSubmit = async (values: EventSettingsValues) => {
    if (!eventId) return
    await updateEvent.mutateAsync({
      name: values.name,
      eventTypeId: values.eventTypeId,
      eventDate: values.eventDate,
      description: values.description || undefined,
      venue: values.venue || undefined,
      expectedGuests: values.expectedGuests ? Number(values.expectedGuests) : undefined,
    })
  }

  const onDelete = async () => {
    if (!eventId) return
    await deleteEvent.mutateAsync(eventId)
    router.push('/events')
  }

  const selectedEventTypeId = form.watch('eventTypeId')
  const selectedEventType = eventTypes?.find((et) => et.id === selectedEventTypeId)

  if (!eventId) {
    return <div className="text-sm text-muted-foreground">Loading event settings...</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-sm text-destructive">Unable to load event settings.</div>
  }

  const eventTier = (data as { tier?: string }).tier || 'BASIC'

  return (
    <div className="space-y-8 pb-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 via-zinc-50 to-stone-50 p-6 shadow-sm dark:border-slate-800/40 dark:from-slate-950/30 dark:via-zinc-950/20 dark:to-stone-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-slate-300/30 blur-3xl dark:bg-slate-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-zinc-300/30 blur-3xl dark:bg-zinc-500/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700 shadow-sm dark:bg-slate-950/70 dark:text-slate-200">
              Event Settings
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {data.name}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Update your event details and preferences
            </p>

            {/* Event Info Stats */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-900/50 dark:bg-slate-950/40">
                <p className="text-[11px] text-muted-foreground">Event Type</p>
                <p className="font-semibold">{selectedEventType?.name || 'Loading...'}</p>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-900/50 dark:bg-slate-950/40">
                <p className="text-[11px] text-muted-foreground">Event Date</p>
                <p className="font-semibold">
                  {data.date ? new Date(data.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                </p>
              </div>
              <div className="col-span-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm shadow-sm backdrop-blur dark:border-slate-900/50 dark:bg-slate-950/40 sm:col-span-1">
                <p className="text-[11px] text-muted-foreground">Event Tier</p>
                <div className="flex items-center gap-1.5">
                  {eventTier === 'PREMIUM' ? (
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      <Crown className="mr-1 h-3 w-3" />
                      Premium
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      <Coins className="mr-1 h-3 w-3" />
                      Basic
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Event Details Form */}
      <Card className="rounded-2xl border-slate-200/70 bg-gradient-to-br from-white to-slate-50/50 shadow-sm dark:border-slate-800/60 dark:from-slate-900/50 dark:to-slate-950/30">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-slate-500" />
            Event Details
          </CardTitle>
          <CardDescription>
            Update your event information. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Event Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Event Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sarah & Jake's Wedding"
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Type */}
              <FormField
                control={form.control}
                name="eventTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormDescription>
                      Select the type of event you're planning
                    </FormDescription>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {eventTypesLoading
                          ? Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton key={i} className="h-8 w-24 rounded-full" />
                            ))
                          : (eventTypes ?? []).map((et) => (
                              <button
                                key={et.id}
                                type="button"
                                onClick={() => field.onChange(et.id)}
                                className={cn(
                                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                                  field.value === et.id
                                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                                )}
                              >
                                {et.name}
                              </button>
                            ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date and Venue Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Event Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Venue
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Grand Ballroom, Mumbai"
                          className="rounded-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Guest Count */}
              <FormField
                control={form.control}
                name="expectedGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Expected Guests
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="150"
                        className="max-w-xs rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Notes
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Any special requirements, themes, or notes..."
                        className="rounded-lg resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  className="rounded-full px-6"
                  disabled={updateEvent.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-2xl border-red-200/70 bg-gradient-to-br from-red-50/50 to-white dark:border-red-900/50 dark:from-red-950/20 dark:to-transparent">
        <CardHeader className="border-b border-red-100 dark:border-red-900/30">
          <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that permanently affect your event.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Delete this event</p>
              <p className="text-sm text-muted-foreground">
                Once deleted, all event data including guests, budget, timeline, and invitations will be permanently removed.
              </p>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="rounded-full shrink-0"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete{' '}
                    <span className="font-semibold text-foreground">{data.name}</span>{' '}
                    and all associated data including:
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Guest list and RSVP responses</li>
                      <li>Budget items and payments</li>
                      <li>Timeline and schedule</li>
                      <li>E-invitations and sent history</li>
                      <li>Checklist and tasks</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteEvent.isPending}
                  >
                    {deleteEvent.isPending ? 'Deleting...' : 'Yes, delete event'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
