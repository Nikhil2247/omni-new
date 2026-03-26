'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateEvent } from '@/hooks/queries/use-events'
import { useEventTypes } from '@/hooks/queries/use-lookups'
import { useEventCreditBalance } from '@/hooks/queries/use-subscription'
import { trackEventPlanning } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Gift, Coins, Check, Crown, Info, AlertCircle } from 'lucide-react'
import type { EventTier } from '@/lib/api/types/subscription.types'

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
  tier: z.enum(['BASIC', 'PREMIUM']),
})

type CreateEventFormValues = z.infer<typeof createEventSchema>

// Tier feature info
const TIER_FEATURES = {
  BASIC: {
    name: 'Basic',
    description: 'Perfect for intimate celebrations',
    features: ['Up to 200 guests', '100 memory uploads', '1 GB storage', '200 WhatsApp invites'],
    color: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
    selectedColor: 'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900',
    iconColor: 'text-blue-500',
    isPopular: false,
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Full-featured for grand celebrations',
    features: ['Unlimited guests', 'Unlimited uploads', '10 GB storage', 'Custom templates', 'Priority support'],
    color: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950',
    selectedColor: 'border-purple-500 bg-purple-100 dark:border-purple-400 dark:bg-purple-900',
    iconColor: 'text-purple-500',
    isPopular: true,
  },
}

interface TierOptionProps {
  tier: EventTier
  isSelected: boolean
  onSelect: () => void
  credits: number
  hasFreeEvent: boolean
  disabled?: boolean
}

function TierOption({ tier, isSelected, onSelect, credits, hasFreeEvent, disabled }: TierOptionProps) {
  const info = TIER_FEATURES[tier]
  const canUse = credits > 0 || (tier === 'BASIC' && hasFreeEvent)
  const isDisabled = disabled || !canUse

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onSelect()}
      disabled={isDisabled}
      className={cn(
        'relative w-full p-4 rounded-lg border-2 text-left transition-all',
        isSelected ? info.selectedColor : info.color,
        isSelected && 'ring-2 ring-offset-2 ring-offset-background',
        isSelected && tier === 'BASIC' && 'ring-blue-500',
        isSelected && tier === 'PREMIUM' && 'ring-purple-500',
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isDisabled && 'hover:border-muted-foreground/50 cursor-pointer',
      )}
    >
      {/* Popular Badge */}
      {info.isPopular && (
        <Badge className="absolute -top-2 right-3 bg-purple-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Popular
        </Badge>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{info.name}</span>
          {isSelected && <Check className={cn('h-5 w-5', info.iconColor)} />}
        </div>
        <div className="text-right">
          {tier === 'BASIC' && hasFreeEvent ? (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <Gift className="h-3 w-3 mr-1" />
              Free
            </Badge>
          ) : (
            <div className="flex items-center gap-1 text-sm">
              <Coins className="h-4 w-4" />
              <span className="font-medium">{credits}</span>
              <span className="text-muted-foreground">credit{credits !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{info.description}</p>

      <ul className="space-y-1">
        {info.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className={cn('h-3 w-3', info.iconColor)} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* No credits warning */}
      {!canUse && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>No credits available</span>
        </div>
      )}
    </button>
  )
}

export function CreateEventForm() {
  const router = useRouter()
  const createEvent = useCreateEvent()
  const { data: eventTypes, isLoading: isEventTypesLoading } = useEventTypes()
  const { data: creditBalance, isLoading: isCreditsLoading } = useEventCreditBalance()

  const hasFreeEvent = creditBalance ? !creditBalance.freeEventUsed : false
  const basicCredits = creditBalance?.basicCredits ?? 0
  const premiumCredits = creditBalance?.premiumCredits ?? 0

  // Determine default tier based on available credits
  const defaultTier: EventTier = hasFreeEvent || basicCredits > 0 ? 'BASIC' : premiumCredits > 0 ? 'PREMIUM' : 'BASIC'

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      eventTypeId: '',
      eventDate: '',
      description: '',
      venue: '',
      expectedGuests: '',
      tier: defaultTier,
    },
  })

  const selectedTier = form.watch('tier')

  // Update default tier when credit balance loads
  useEffect(() => {
    if (creditBalance) {
      const tier: EventTier = hasFreeEvent || basicCredits > 0 ? 'BASIC' : premiumCredits > 0 ? 'PREMIUM' : 'BASIC'
      form.setValue('tier', tier)
    }
  }, [creditBalance, hasFreeEvent, basicCredits, premiumCredits, form])

  // Track form start on mount
  useEffect(() => { trackEventPlanning.createStart() }, [])

  // Check if user can create event with selected tier
  const canCreateWithSelectedTier = selectedTier === 'BASIC'
    ? (hasFreeEvent || basicCredits > 0)
    : premiumCredits > 0

  const onSubmit = async (values: CreateEventFormValues) => {
    if (!canCreateWithSelectedTier) {
      toast.error(`No ${values.tier.toLowerCase()} credits available. Please purchase credits first.`)
      return
    }

    try {
      const response = await createEvent.mutateAsync({
        name: values.name,
        eventTypeId: values.eventTypeId,
        eventDate: values.eventDate,
        description: values.description || undefined,
        venue: values.venue || undefined,
        expectedGuests: values.expectedGuests ? Number(values.expectedGuests) : undefined,
        tier: values.tier,
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

  const totalCredits = basicCredits + premiumCredits
  const hasAnyCredits = totalCredits > 0 || hasFreeEvent

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tier Selection */}
        <FormField
          control={form.control}
          name="tier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Event Tier
                {isCreditsLoading && <Skeleton className="h-4 w-20" />}
              </FormLabel>
              <FormDescription>
                Choose the feature tier for your event. This determines your limits and features.
              </FormDescription>
              <FormControl>
                {isCreditsLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TierOption
                      tier="BASIC"
                      isSelected={field.value === 'BASIC'}
                      onSelect={() => field.onChange('BASIC')}
                      credits={basicCredits}
                      hasFreeEvent={hasFreeEvent}
                    />
                    <TierOption
                      tier="PREMIUM"
                      isSelected={field.value === 'PREMIUM'}
                      onSelect={() => field.onChange('PREMIUM')}
                      credits={premiumCredits}
                      hasFreeEvent={false}
                    />
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* No Credits Warning */}
        {!isCreditsLoading && !hasAnyCredits && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">No event credits available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You need event credits to create an event.{' '}
                    <Link href="/pricing" className="text-primary underline hover:no-underline">
                      Purchase credits
                    </Link>{' '}
                    to get started.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit Usage Info */}
        {!isCreditsLoading && hasAnyCredits && (
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {selectedTier === 'BASIC' && hasFreeEvent ? (
                    <>Your <span className="text-emerald-600 font-medium">free event</span> will be used for this Basic event.</>
                  ) : (
                    <>1 {selectedTier.toLowerCase()} credit will be used when you create this event.</>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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
            disabled={createEvent.isPending || isEventTypesLoading || isCreditsLoading || !canCreateWithSelectedTier}
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
          {!hasAnyCredits && (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              asChild
            >
              <Link href="/pricing">Buy Credits</Link>
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
