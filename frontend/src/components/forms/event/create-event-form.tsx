'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useCreateEvent } from '@/hooks/queries/use-events'
import { useEventTypes } from '@/hooks/queries/use-lookups'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const createEventSchema = z.object({
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
  addressId: z.string().optional(),
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
      addressId: '',
    },
  })

  const onSubmit = async (values: CreateEventFormValues) => {
    try {
      const response = await createEvent.mutateAsync({
        name: values.name,
        eventTypeId: values.eventTypeId,
        eventDate: values.eventDate,
        description: values.description || undefined,
        venue: values.venue || undefined,
        expectedGuests: values.expectedGuests ? Number(values.expectedGuests) : undefined,
        addressId: values.addressId || undefined,
      })

      toast.success('Event created successfully.')
      form.reset()
      router.push(`/events/${response.id}`)
    } catch (error) {
      toast.error('Failed to create event. Please try again.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
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
                <FormLabel>Event type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isEventTypesLoading ? 'Loading event types...' : 'Select event type'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(eventTypes || []).map((eventType) => (
                      <SelectItem key={eventType.id} value={eventType.id}>
                        {eventType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input placeholder="Grand Ballroom" {...field} />
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

          <FormField
            control={form.control}
            name="addressId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address ID</FormLabel>
                <FormControl>
                  <Input placeholder="Address UUID (optional)" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Tell us about your event goals"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={createEvent.isPending}>
            {createEvent.isPending ? 'Creating...' : 'Create event'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/events')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
