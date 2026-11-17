'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { opsService } from '@/lib/api/services/ops.service'
import { useOpsManagers } from '@/hooks/queries/use-ops'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const createEventSchema = z.object({
  origin: z.enum(['DIRECT_BOOKING', 'DIGITAL_LEAD']),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  eventType: z.string().min(1, 'Event type is required'),
  eventDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  venueName: z.string().optional(),
  venueAddressId: z.string().optional(),
  totalBudget: z.string().optional(),
  opsManagerId: z.string().optional(),
})

type CreateEventFormValues = z.infer<typeof createEventSchema>

export function CreateEventForm() {
  const router = useRouter()
  const { data: managersResponse } = useOpsManagers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const managers = managersResponse?.data || []

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      origin: 'DIRECT_BOOKING',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      eventType: '',
      eventDate: '',
      eventEndDate: '',
      venueName: '',
      totalBudget: '',
      opsManagerId: '',
    },
  })

  const onSubmit = async (values: CreateEventFormValues) => {
    setIsSubmitting(true)
    try {
      await opsService.createActiveEvent({
        origin: values.origin,
        clientName: values.clientName,
        clientEmail: values.clientEmail || undefined,
        clientPhone: values.clientPhone || undefined,
        eventType: values.eventType,
        eventDate: values.eventDate || undefined,
        eventEndDate: values.eventEndDate || undefined,
        venueName: values.venueName || undefined,
        totalBudget: values.totalBudget ? Number(values.totalBudget) : undefined,
        opsManagerId: values.opsManagerId || undefined,
      })
      toast.success('Active event created successfully!')
      form.reset()
      // Redirect to events list after 1.5 seconds
      setTimeout(() => router.push('/ops/events'), 1500)
    } catch (error) {
      toast.error('Failed to create event. Please check the inputs and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
        <CardDescription>
          Enter the details for the new direct booking event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select origin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DIRECT_BOOKING">Direct Booking (Walk-in/Phone)</SelectItem>
                        <SelectItem value="DIGITAL_LEAD">Digital Lead (Converted)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How this event was created
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <FormControl>
                  <Input placeholder="Wedding, Corporate, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="client@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
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
                <FormLabel>Event Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event End Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>
                  Leave blank for single-day events
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venueName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Grand Ballroom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venueAddressId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue Address ID</FormLabel>
                <FormControl>
                  <Input placeholder="Address ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Budget (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="10000" {...field} />
                </FormControl>
                <FormDescription>
                  Client's total budget for the event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="opsManagerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Ops Manager (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a manager (can assign later)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.firstName && manager.lastName
                          ? `${manager.firstName} ${manager.lastName}`
                          : manager.email}
                        {manager.managedEventsCount !== undefined && 
                          ` (${manager.managedEventsCount} events)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Leave empty to assign later
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Active Event'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/ops/events')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
      </CardContent>
    </Card>
  )
}
