'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/queries/use-events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

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
  const updateEvent = useUpdateEvent(eventId ?? '')
  const deleteEvent = useDeleteEvent()

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

  if (!eventId) {
    return <div className="text-sm text-muted-foreground">Loading event settings...</div>
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
    return <div className="text-sm text-destructive">Unable to load event settings.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Event settings</h1>
        <p className="text-muted-foreground">Update your event basics.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Event name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Wedding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event type ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Event type UUID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <Input placeholder="Venue name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest count</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Event overview" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={updateEvent.isPending}>
                  {updateEvent.isPending ? 'Saving...' : 'Save changes'}
                </Button>
                <Button type="button" variant="destructive" onClick={onDelete} disabled={deleteEvent.isPending}>
                  {deleteEvent.isPending ? 'Deleting...' : 'Delete event'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
