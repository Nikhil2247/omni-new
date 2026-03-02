'use client'

import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useCreateEvent } from '@/hooks/queries/use-events'
import { useEventTypes } from '@/hooks/queries/use-lookups'
import { trackEventPlanning } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const createEventSchema = z.object({
  name: z.string().min(2, 'Event name is required'),
  eventTypeId: z.string().uuid('Please select an event type'),
  eventDate: z
    .string()
    .min(1, 'Event date is required')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Please select a valid event date',
    }),
  description: z.string().optional(),
  venue: z.string().optional(),
  expectedGuests: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value), {
      message: 'Guest count must be a whole number',
    })
    .refine((value) => !value || Number(value) > 0, {
      message: 'Guest count must be at least 1',
    }),
})

type CreateEventFormValues = z.infer<typeof createEventSchema>

export function CreateEventForm() {
  const router = useRouter()
  const createEvent = useCreateEvent()
  const { data: eventTypes, isLoading: isEventTypesLoading } = useEventTypes()

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      eventTypeId: '',
      eventDate: '',
      description: '',
      venue: '',
      expectedGuests: '',
    },
  })

  // Track form start on mount
  useEffect(() => { trackEventPlanning.createStart() }, [])

  const onSubmit = async (values: CreateEventFormValues) => {
    try {
      const response = await createEvent.mutateAsync({
        name: values.name,
        eventTypeId: values.eventTypeId,
        eventDate: values.eventDate,
        description: values.description || undefined,
        venue: values.venue || undefined,
        expectedGuests: values.expectedGuests ? Number(values.expectedGuests) : undefined,
      })

      toast.success('Event created successfully.')
      trackEventPlanning.activate(response.id, values.eventTypeId)
      form.reset()
      router.push(`/events/${response.id}`)
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; error?: string } } }
      const serverMessage = axiosError?.response?.data?.message
      const serverError = axiosError?.response?.data?.error

      if (serverError === 'EmailNotVerified') {
        toast.error('Please verify your email address before creating an event.')
      } else if (serverMessage) {
        toast.error(serverMessage)
      } else {
        toast.error('Failed to create event. Please try again.')
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Event type — pill buttons */}
        <FormField
          control={form.control}
          name="eventTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event type</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {isEventTypesLoading
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Sarah & Jake's Wedding" {...field} />
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
                <FormLabel>Venue / Address</FormLabel>
                <FormControl>
                  <Input placeholder="Grand Ballroom, Mumbai" {...field} />
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
                <FormLabel>Expected guests</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Any special requirements, themes, or notes..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            className="rounded-full px-6"
            disabled={createEvent.isPending || isEventTypesLoading}
          >
            {createEvent.isPending ? 'Creating...' : 'Create event'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => router.push('/events')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
