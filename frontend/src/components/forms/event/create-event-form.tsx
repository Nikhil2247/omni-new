'use client'

import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateEvent } from '@/hooks/queries/use-events'
import { useEventTypes } from '@/hooks/queries/use-lookups'
import { useEventCreditPricing } from '@/hooks/queries/use-subscription'
import { trackEventPlanning } from '@/lib/analytics/umami'
import { Ico, ICONS, Paper, SketchButton, Stamp } from '@/components/sketch'
import { Skeleton } from '@/components/ui/skeleton'
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
import { cn } from '@/lib/utils'
import { Check, Infinity } from 'lucide-react'
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

// Fallback tier features (used if API fails)
const FALLBACK_TIER_FEATURES = {
  BASIC: {
    name: 'Basic',
    description: 'Perfect for intimate celebrations',
    features: [
      { key: 'guests', name: 'Up to 200 guests per event', included: true },
      { key: 'uploads', name: '100 memory uploads per event', included: true },
      { key: 'storage', name: '1 GB storage per event', included: true },
      { key: 'whatsapp', name: '200 WhatsApp invites per event', included: true },
      { key: 'templates', name: 'Custom invite templates', included: false },
      { key: 'support', name: 'Priority support', included: false },
    ],
    isPopular: false,
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Full-featured for grand celebrations',
    features: [
      { key: 'guests', name: 'Up to 500 guests per event', included: true },
      { key: 'uploads', name: '500 memory uploads per event', included: true },
      { key: 'storage', name: '5 GB storage per event', included: true },
      { key: 'whatsapp', name: '500 WhatsApp invites per event', included: true },
      { key: 'templates', name: 'Custom invite templates', included: true },
      { key: 'support', name: 'Priority support', included: true },
    ],
    isPopular: true,
  },
}

interface TierData {
  tier: EventTier
  name: string
  description: string
  price: string
  priceSubtext: string
  features: {
    key: string
    name: string
    displayValue: string
    included: boolean
    isHighlighted: boolean
  }[]
  isPopular: boolean
}

interface TierOptionProps {
  tierData: TierData
  isSelected: boolean
  onSelect: () => void
}

function TierOption({ tierData, isSelected, onSelect }: TierOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        'sk-paper relative w-full cursor-pointer p-4 text-left transition-transform hover:-translate-y-0.5',
        tierData.tier === 'PREMIUM' && 'sk-paper--alt',
        isSelected && 'bg-blue-wash',
      )}
    >
      {/* Popular Badge */}
      {tierData.isPopular && (
        <Stamp tone="wait" className="absolute -top-2 right-3">
          Best Value
        </Stamp>
      )}

      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold">{tierData.name}</span>
          {isSelected && <Check className="text-blue h-5 w-5" />}
        </div>
        <div className="text-right">
          <div className="text-leaf-deep flex items-center gap-1">
            <Infinity className="h-4 w-4" />
            <span className="text-sm font-semibold">Unlimited</span>
          </div>
        </div>
      </div>

      <p className="text-ink-soft mb-3 text-sm">{tierData.description}</p>

      <ul className="space-y-1">
        {(tierData.features || []).slice(0, 5).map((feature) => (
          <li key={feature.key} className="flex items-center gap-2 text-sm">
            <Check className={cn('h-3 w-3', feature.included ? 'text-blue' : 'text-ink-soft/50')} />
            <span className={feature.included ? '' : 'text-ink-soft/70 line-through'}>{feature.name}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}

export function CreateEventForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createEvent = useCreateEvent()
  const { data: eventTypes, isLoading: isEventTypesLoading } = useEventTypes()
  const { data: pricingData, isLoading: isPricingLoading } = useEventCreditPricing()

  // Get tier from URL query param (e.g., /events/new?tier=PREMIUM)
  const urlTier = searchParams.get('tier') as EventTier | null
  const defaultTier: EventTier = urlTier === 'PREMIUM' ? 'PREMIUM' : 'BASIC'

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

  // Track form start on mount
  useEffect(() => { trackEventPlanning.createStart() }, [])

  // Build tier data from API or fallback
  const getTierData = (tier: EventTier): TierData => {
    const apiTier = pricingData?.tiers?.find(t => t.tier === tier)
    const fallback = FALLBACK_TIER_FEATURES[tier]

    // Use API data if available and has features, otherwise use fallback
    if (apiTier && apiTier.features && apiTier.features.length > 0) {
      return {
        tier: apiTier.tier,
        name: apiTier.name || fallback.name,
        description: apiTier.description || fallback.description,
        price: apiTier.price || (tier === 'BASIC' ? 'From Rs. 499' : 'From Rs. 1299'),
        priceSubtext: apiTier.priceSubtext || 'Per event',
        features: apiTier.features,
        isPopular: apiTier.isPopular ?? fallback.isPopular,
      }
    }

    // Fallback to static data
    return {
      tier,
      name: fallback.name,
      description: fallback.description,
      price: tier === 'BASIC' ? 'From Rs. 499' : 'From Rs. 1299',
      priceSubtext: 'Per event',
      features: fallback.features.map(f => ({
        key: f.key,
        name: f.name,
        displayValue: f.included ? 'Yes' : 'No',
        included: f.included,
        isHighlighted: false,
      })),
      isPopular: fallback.isPopular,
    }
  }

  const basicTierData = getTierData('BASIC')
  const premiumTierData = getTierData('PREMIUM')

  const onSubmit = async (values: CreateEventFormValues) => {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Unlimited Events Banner */}
        <Paper tape className="flex items-center gap-3 px-5 py-4">
          <Ico d={ICONS.heart} className="h-10 w-10" />
          <div>
            <p className="font-display text-lg font-semibold">Create Unlimited Events</p>
            <p className="text-ink-soft text-sm">
              Choose a tier based on the features and pricing that fit your celebration.
            </p>
          </div>
        </Paper>

        {/* Tier Selection */}
        <FormField
          control={form.control}
          name="tier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Event Tier
                {isPricingLoading && <Skeleton className="h-4 w-20" />}
              </FormLabel>
              <FormDescription>
                Choose the feature tier for your event. This determines your limits per event.
              </FormDescription>
              <FormControl>
                {isPricingLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TierOption
                      tierData={basicTierData}
                      isSelected={field.value === 'BASIC'}
                      onSelect={() => field.onChange('BASIC')}
                    />
                    <TierOption
                      tierData={premiumTierData}
                      isSelected={field.value === 'PREMIUM'}
                      onSelect={() => field.onChange('PREMIUM')}
                    />
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Tier Info */}
        <Paper alt className="px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Infinity className="text-leaf-deep h-4 w-4" />
            <span className="text-ink-soft">
              You selected <span className="text-ink font-semibold">{selectedTier}</span> tier.
              Feature limits will apply to this event based on your selection.
            </span>
          </div>
        </Paper>

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
          <SketchButton type="submit" disabled={createEvent.isPending || isEventTypesLoading}>
            {createEvent.isPending ? 'Creating...' : 'Create Event'}
          </SketchButton>
          <SketchButton variant="ghost" onClick={() => router.push('/events')}>
            Cancel
          </SketchButton>
        </div>
      </form>
    </Form>
  )
}
