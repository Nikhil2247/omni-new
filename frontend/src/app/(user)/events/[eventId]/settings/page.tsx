'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { trackDashboard } from '@/lib/analytics/umami'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/queries/use-events'
import { useEventTypes } from '@/hooks/queries/use-lookups'
import { BrushTitle, Eyebrow, Paper, SketchButton, Stamp } from '@/components/sketch'
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
import { Calendar, MapPin, Users, FileText } from 'lucide-react'

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
    return <div className="text-ink-soft text-sm">Loading event settings...</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-rose text-sm">Unable to load event settings.</div>
  }

  const eventTier = (data as { tier?: string }).tier || 'BASIC'

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="max-w-2xl">
        <Eyebrow>Event Settings</Eyebrow>
        <h1 className="font-display mt-2.5 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] font-semibold tracking-tight">
          <BrushTitle title={data.name} />
        </h1>
        <p className="text-ink-soft mt-3">Update your event details and preferences</p>

        {/* Event Info Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Paper className="px-4 py-3">
            <p className="sk-eyebrow">Event Type</p>
            <p className="font-display mt-1 text-lg font-semibold">{selectedEventType?.name || 'Loading...'}</p>
          </Paper>
          <Paper alt className="px-4 py-3">
            <p className="sk-eyebrow">Event Date</p>
            <p className="font-display mt-1 text-lg font-semibold">
              {data.date ? new Date(data.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
            </p>
          </Paper>
          <Paper className="col-span-2 px-4 py-3 sm:col-span-1">
            <p className="sk-eyebrow">Event Tier</p>
            <div className="mt-1">
              <Stamp tone={eventTier === 'PREMIUM' ? 'ok' : 'wait'}>{eventTier === 'PREMIUM' ? 'Premium' : 'Basic'}</Stamp>
            </div>
          </Paper>
        </div>
      </div>

      {/* Event Details Form */}
      <Paper className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="border-line mb-5 border-b-2 border-dashed pb-4">
          <h2 className="font-display text-2xl font-semibold">Event Details</h2>
          <p className="text-ink-soft mt-1 text-sm">Update your event information. Changes are saved automatically.</p>
        </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Event Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-ink-soft" />
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
                                aria-pressed={field.value === et.id}
                                className={cn(
                                  'sk-chip cursor-pointer px-3.5 py-2 text-sm transition-colors',
                                  field.value === et.id ? 'bg-blue text-on-blue' : 'hover:bg-blue-wash',
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
                        <Calendar className="h-4 w-4 text-ink-soft" />
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
                        <MapPin className="h-4 w-4 text-ink-soft" />
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
                      <Users className="h-4 w-4 text-ink-soft" />
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
                      <FileText className="h-4 w-4 text-ink-soft" />
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
                <SketchButton type="submit" disabled={updateEvent.isPending}>
                  {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
                </SketchButton>
              </div>
            </form>
          </Form>
        </div>
      </Paper>

      {/* Danger Zone */}
      <Paper alt className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="border-line mb-5 border-b-2 border-dashed pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-semibold">Danger Zone</h2>
            <Stamp tone="late">Irreversible</Stamp>
          </div>
          <p className="text-ink-soft mt-1 text-sm">Irreversible actions that permanently affect your event.</p>
        </div>
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold">Delete this event</p>
              <p className="text-ink-soft text-sm">
                Once deleted, all event data including guests, budget, timeline, and invitations will be permanently removed.
              </p>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <SketchButton variant="line" className="shrink-0">
                  Delete Event
                </SketchButton>
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
        </div>
      </Paper>
    </div>
  )
}
