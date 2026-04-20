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
import { Gift, Check, Crown, Infinity } from 'lucide-react'
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
  const isBasic = tierData.tier === 'BASIC'
  const colorClasses = isBasic
    ? {
        base: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
        selected: 'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900 ring-blue-500',
        icon: 'text-blue-500',
      }
    : {
        base: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950',
        selected: 'border-purple-500 bg-purple-100 dark:border-purple-400 dark:bg-purple-900 ring-purple-500',
        icon: 'text-purple-500',
      }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer',
        isSelected ? colorClasses.selected : colorClasses.base,
        isSelected && 'ring-2 ring-offset-2 ring-offset-background',
        'hover:border-muted-foreground/50',
      )}
    >
      {/* Popular Badge */}
      {tierData.isPopular && (
        <Badge className="absolute -top-2 right-3 bg-purple-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Best Value
        </Badge>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{tierData.name}</span>
          {isSelected && <Check className={cn('h-5 w-5', colorClasses.icon)} />}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Infinity className="h-4 w-4" />
            <span className="text-sm font-semibold">Unlimited</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{tierData.description}</p>

      <ul className="space-y-1">
        {(tierData.features || []).slice(0, 5).map((feature) => (
          <li key={feature.key} className="flex items-center gap-2 text-sm">
            <Check className={cn('h-3 w-3', feature.included ? colorClasses.icon : 'text-muted-foreground/50')} />
            <span className={feature.included ? '' : 'text-muted-foreground/70 line-through'}>{feature.name}</span>
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
        <Card className="border-emerald-200 bg-linear-to-br from-emerald-50 to-green-50 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-green-950/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Create Unlimited Events
                </p>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
                  Choose a tier based on the features and pricing that fit your celebration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm">
              <Infinity className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">
                You selected <span className="font-medium text-foreground">{selectedTier}</span> tier.
                Feature limits will apply to this event based on your selection.
              </span>
            </div>
          </CardContent>
        </Card>

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
            {createEvent.isPending ? 'Creating...' : 'Create Event'}
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
