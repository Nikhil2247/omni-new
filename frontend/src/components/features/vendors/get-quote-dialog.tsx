'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, CheckCircle2, CalendarIcon, Calendar as CalendarIconOutline, Users, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useCreateLead } from '@/hooks/queries/use-leads'
import { useEventsEnabled } from '@/hooks/queries/use-events'
import { trackQuote } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { EventSummary } from '@/lib/api/types/event.types'

const quoteSchema = z.object({
  eventDate: z.date('Event date is required'),
  eventType: z.string().min(2, 'Event type is required'),
  guestCount: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) > 0, { message: 'Must be greater than 0' }),
  budget: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) >= 0, { message: 'Must be a positive amount' }),
  message: z.string().optional(),
})

type QuoteFormValues = z.infer<typeof quoteSchema>

interface GetQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  vendorName: string
}

const NO_EVENT_VALUE = '__no_event__'

export function GetQuoteDialog({ open, onOpenChange, vendorId, vendorName }: GetQuoteDialogProps) {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const createLead = useCreateLead()
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Fetch user's events when authenticated and dialog is open
  const { data: eventsData, isLoading: eventsLoading } = useEventsEnabled(
    { status: undefined, limit: 50 },
    open && isAuthenticated && !!user?.id
  )

  // Filter events to show only PLANNING or CONFIRMED status
  const userEvents = useMemo(() => {
    if (!eventsData?.data) return []
    return eventsData.data.filter(
      (event) => event.status === 'PLANNING' || event.status === 'CONFIRMED'
    )
  }, [eventsData])

  const selectedEvent = useMemo(() => {
    if (!selectedEventId || selectedEventId === NO_EVENT_VALUE) return null
    return userEvents.find((e) => e.id === selectedEventId) || null
  }, [selectedEventId, userEvents])

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      eventDate: undefined,
      eventType: '',
      guestCount: '',
      budget: '',
      message: ''
    },
  })

  // Auto-fill form when event is selected
  useEffect(() => {
    if (selectedEvent) {
      // Set event date
      if (selectedEvent.date) {
        form.setValue('eventDate', new Date(selectedEvent.date))
      }
      // Set event type from event name (we don't have eventType.name directly)
      // Using event name as a proxy for event type
      if (selectedEvent.name) {
        form.setValue('eventType', selectedEvent.name)
      }
      // Set guest count
      if (selectedEvent.guestCount) {
        form.setValue('guestCount', String(selectedEvent.guestCount))
      }
      // Set budget if available
      if (selectedEvent.totalBudget) {
        form.setValue('budget', String(selectedEvent.totalBudget))
      }
    }
  }, [selectedEvent, form])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Reset when closing so form is fresh next open
      setTimeout(() => {
        form.reset()
        setSubmitted(false)
        setErrorMsg(null)
        setSelectedEventId(null)
      }, 300)
    }
    onOpenChange(next)
  }

  const handleEventChange = (value: string) => {
    setSelectedEventId(value === NO_EVENT_VALUE ? null : value)
    // Clear form when switching to no event
    if (value === NO_EVENT_VALUE) {
      form.reset()
    }
  }

  const onSubmit = async (values: QuoteFormValues) => {
    setErrorMsg(null)

    if (!isAuthenticated || !user?.id) {
      setErrorMsg('Please log in to send a quote request.')
      return
    }

    try {
      await createLead.mutateAsync({
        vendorProfileId: vendorId,
        plannerId: user.id,
        source: 'INQUIRY',
        eventId: selectedEventId && selectedEventId !== NO_EVENT_VALUE ? selectedEventId : undefined,
        eventDate: values.eventDate?.toISOString(),
        eventType: values.eventType.trim(),
        guestCount: values.guestCount ? Number(values.guestCount) : undefined,
        budget: values.budget ? Number(values.budget) : undefined,
        initialMessage: values.message?.trim() || undefined,
      })
      trackQuote.submit(vendorId, values.eventType)
      setSubmitted(true)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const rawMessage = error.response?.data?.message
        const message = Array.isArray(rawMessage)
          ? rawMessage.join(', ')
          : String(rawMessage ?? '')

        if (status === 401) {
          setErrorMsg('Please log in to send a quote request.')
          return
        }

        if (status === 403) {
          if (message.toLowerCase().includes('account is not active')) {
            setErrorMsg('Please complete your account setup before requesting a quote.')
            return
          }
          setErrorMsg(message || 'Your account is not allowed to send quote requests right now.')
          return
        }

        if (status === 400 || status === 422) {
          setErrorMsg(message || 'Please check the form details and try again.')
          return
        }

        if (status === 404) {
          setErrorMsg(message || 'Vendor or user account not found. Please contact support.')
          return
        }

        if (status === 429) {
          setErrorMsg('Too many quote requests. Please wait a bit and try again.')
          return
        }

        if (status === 500) {
          setErrorMsg('Server error. Please try again or contact support if the issue persists.')
          return
        }

        if (message) {
          setErrorMsg(message)
          return
        }
      }

      setErrorMsg('Failed to send request. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Get a Quote
          </DialogTitle>
          <DialogDescription>
            Request pricing from <span className="font-medium text-foreground">{vendorName}</span>
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center py-4 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Request sent!</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              {selectedEvent ? (
                <>Your quote request for <span className="font-medium">{selectedEvent.name}</span> has been sent to {vendorName}.</>
              ) : (
                <>Our ops team will review your request and connect you with {vendorName} shortly.</>
              )}
            </p>
            {selectedEvent && (
              <p className="text-xs text-muted-foreground">
                This quote is linked to your event and will appear in your event dashboard.
              </p>
            )}
            <Button className="mt-2" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="space-y-5 pt-1">
            {hasHydrated && !isAuthenticated && (
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
                <p className="font-medium">Log in to send a quote request.</p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" onClick={() => router.push('/login')}>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/register">Create account</Link>
                  </Button>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Event Selection Section */}
                {isAuthenticated && userEvents.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Link to an event</span>
                    </div>
                    <Select
                      value={selectedEventId || NO_EVENT_VALUE}
                      onValueChange={handleEventChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an event (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_EVENT_VALUE}>
                          <span className="text-muted-foreground">Continue without selecting an event</span>
                        </SelectItem>
                        {userEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{event.name}</span>
                              {event.date && (
                                <span className="text-xs text-muted-foreground">
                                  ({format(new Date(event.date), 'MMM d, yyyy')})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedEvent && (
                      <div className="rounded-md bg-muted/50 p-3 text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          {selectedEvent.date && (
                            <div className="flex items-center gap-1">
                              <CalendarIconOutline className="h-3.5 w-3.5" />
                              <span>{format(new Date(selectedEvent.date), 'PPP')}</span>
                            </div>
                          )}
                          {selectedEvent.guestCount && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              <span>{selectedEvent.guestCount} guests</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Event details will be auto-filled below
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {eventsLoading && isAuthenticated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading your events...</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Event date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event type</FormLabel>
                        <FormControl>
                          <Input placeholder="Wedding, Gala, Birthday…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="guestCount"
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
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Notes{' '}
                        <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Share preferences, venue ideas, or timing requirements…"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <p className="text-sm text-destructive">{errorMsg}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createLead.isPending || !isAuthenticated}
                  >
                    {createLead.isPending ? 'Sending…' : 'Send request'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
