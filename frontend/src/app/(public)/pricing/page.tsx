'use client'

import { useState, useMemo } from 'react'
import { useVendorPlans, useEventCreditPricing } from '@/hooks/queries/use-subscription'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, X, Sparkles, Users, Building2, Gift } from 'lucide-react'
import Link from 'next/link'
import type { PlanDisplay, FeatureDisplay, BillingCycle, EventTier } from '@/lib/api/types/subscription.types'

// ============================================================================
// Constants
// ============================================================================

const TIER_INFO = {
  BASIC: {
    name: 'Basic',
    description: 'Perfect for intimate celebrations and smaller events',
    color: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    isPopular: false,
    price: 'Free',
    priceSubtext: 'Unlimited events',
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Full-featured for grand celebrations and large events',
    color: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    isPopular: true,
    price: 'Free',
    priceSubtext: 'Unlimited events',
  },
}

const BASIC_FEATURES = [
  { key: 'unlimited', name: 'Unlimited events', included: true, highlighted: true },
  { key: 'guests', name: 'Up to 200 guests per event', included: true },
  { key: 'memory_uploads', name: '100 memory uploads per event', included: true },
  { key: 'storage', name: '1 GB storage per event', included: true },
  { key: 'einvite', name: 'E-invite creation', included: true },
  { key: 'whatsapp', name: '200 WhatsApp invites per event', included: true },
  { key: 'rsvp', name: 'RSVP tracking', included: true },
  { key: 'export', name: 'Data export', included: true },
  { key: 'custom_templates', name: 'Custom invite templates', included: false },
  { key: 'priority_support', name: 'Priority support', included: false },
]

const PREMIUM_FEATURES = [
  { key: 'unlimited', name: 'Unlimited events', included: true, highlighted: true },
  { key: 'guests', name: 'Up to 500 guests per event', included: true },
  { key: 'memory_uploads', name: '500 memory uploads per event', included: true },
  { key: 'storage', name: '5 GB storage per event', included: true },
  { key: 'einvite', name: 'E-invite creation', included: true },
  { key: 'whatsapp', name: '500 WhatsApp invites per event', included: true },
  { key: 'rsvp', name: 'RSVP tracking', included: true },
  { key: 'export', name: 'Data export', included: true },
  { key: 'custom_templates', name: 'Custom invite templates', included: true },
  { key: 'priority_support', name: 'Priority support', included: true },
]

// ============================================================================
// Loading Skeleton
// ============================================================================

function EventPricingCardSkeleton() {
  return (
    <Card className="relative flex flex-col animate-pulse">
      <CardHeader className="text-center pb-4">
        <div className="h-6 bg-muted rounded w-24 mx-auto mb-2" />
        <div className="h-4 bg-muted rounded w-48 mx-auto" />
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="text-center py-4">
          <div className="h-10 bg-muted rounded w-20 mx-auto mb-2" />
          <div className="h-4 bg-muted rounded w-32 mx-auto" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Unlimited Events Banner
// ============================================================================

function UnlimitedEventsBanner({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800 mb-8">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900">
            <Gift className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Create Unlimited Events - Free!</h3>
            <p className="text-muted-foreground">
              Plan as many events as you want. Choose a tier based on the features you need per event.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950">
          <Link href={isAuthenticated ? '/dashboard/events/new' : '/register'}>
            {isAuthenticated ? 'Create Event' : 'Get Started Free'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Event Tiers Section (Unlimited Events) - Fetches from Backend
// ============================================================================

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

interface EventTiersSectionProps {
  isAuthenticated: boolean
  tiers?: TierData[]
  isLoading: boolean
}

// Helper to create fallback tier data
const createFallbackTier = (tier: EventTier): TierData => {
  const features = tier === 'BASIC' ? BASIC_FEATURES : PREMIUM_FEATURES
  return {
    tier,
    name: tier === 'BASIC' ? 'Basic' : 'Premium',
    description: tier === 'BASIC'
      ? 'Perfect for intimate celebrations and smaller events'
      : 'Full-featured for grand celebrations and large events',
    price: 'Free',
    priceSubtext: 'Unlimited events',
    features: features.map(f => ({
      key: f.key,
      name: f.name,
      displayValue: f.included ? 'Yes' : 'No',
      included: f.included,
      isHighlighted: f.highlighted || false,
    })),
    isPopular: tier === 'PREMIUM',
  }
}

function EventTiersSection({ isAuthenticated, tiers, isLoading }: EventTiersSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <EventPricingCardSkeleton />
        <EventPricingCardSkeleton />
      </div>
    )
  }

  // Check if API returned valid tier data with features
  const hasValidTiers = tiers && tiers.length > 0 && tiers.every(t => t.features && t.features.length > 0)

  // Use API tiers if valid, otherwise use fallback
  const displayTiers: TierData[] = hasValidTiers
    ? tiers
    : [createFallbackTier('BASIC'), createFallbackTier('PREMIUM')]

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      {displayTiers.map((tierData) => (
        <EventTierCardFromBackend
          key={tierData.tier}
          tierData={tierData}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Event Tier Card - Uses Backend Data
// ============================================================================

interface EventTierCardFromBackendProps {
  tierData: TierData
  isAuthenticated: boolean
}

function EventTierCardFromBackend({ tierData, isAuthenticated }: EventTierCardFromBackendProps) {
  const ctaLink = isAuthenticated ? `/dashboard/events/new?tier=${tierData.tier}` : '/register'

  return (
    <Card
      className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
        tierData.isPopular
          ? 'border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]'
          : 'hover:border-muted-foreground/30'
      }`}
    >
      {/* Popular Badge */}
      {tierData.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Best Value
          </Badge>
        </div>
      )}

      <CardHeader className={`text-center pb-4 rounded-t-lg ${
        tierData.tier === 'PREMIUM' ? 'bg-purple-50 dark:bg-purple-950' : 'bg-blue-50 dark:bg-blue-950'
      }`}>
        <CardTitle className="text-xl">{tierData.name}</CardTitle>
        <CardDescription className="mt-1.5">{tierData.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-6">
        {/* Price Display */}
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-emerald-600">{tierData.price}</div>
          <p className="text-sm text-muted-foreground mt-1">{tierData.priceSubtext}</p>
        </div>

        {/* Features List */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-3">Features per event:</p>
          <ul className="space-y-2">
            {(tierData.features || []).map((feature) => (
              <li key={feature.key} className={`flex items-center gap-2 text-sm ${feature.isHighlighted ? 'font-semibold' : ''}`}>
                {feature.included ? (
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={feature.included ? (feature.isHighlighted ? 'text-emerald-600' : '') : 'text-muted-foreground/70'}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          asChild
          className="w-full"
          variant={tierData.isPopular ? 'default' : 'outline'}
          size="lg"
        >
          <Link href={ctaLink}>
            {isAuthenticated ? 'Create Event' : 'Get Started Free'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Vendor Plans Section (Legacy monthly plans)
// ============================================================================

function formatVendorPrice(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

function getPriceForCycle(plan: PlanDisplay, cycle: BillingCycle) {
  return plan.allPrices.find((p) => p.billingCycle === cycle)
}

function renderFeatureValue(feature: FeatureDisplay): React.ReactNode {
  switch (feature.limitType) {
    case 'BOOLEAN':
      return feature.limitValue === 1 || feature.displayValue === 'Yes' ? (
        <Check className="h-5 w-5 text-emerald-600" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground/50" />
      )
    case 'UNLIMITED':
      return <span className="font-medium text-emerald-600">Unlimited</span>
    case 'COUNT':
    case 'COUNT_PER_MONTH':
    case 'COUNT_PER_YEAR':
      return (
        <span className="font-medium">
          {feature.displayValue || feature.limitValue?.toLocaleString()}
        </span>
      )
    default:
      return <span className="font-medium">{feature.displayValue}</span>
  }
}

function VendorPricingCard({ plan, billingCycle, isAuthenticated, userRole }: { plan: PlanDisplay; billingCycle: BillingCycle; isAuthenticated: boolean; userRole?: string }) {
  const price = getPriceForCycle(plan, billingCycle)
  const isFree = plan.tier === 'FREE' || (price?.amount ?? 0) === 0

  const ctaLink = useMemo(() => {
    if (!isAuthenticated) {
      if (isFree) return '/register/vendor'
      return `/register/vendor?plan=${plan.slug}`
    }
    const isVendorUser = userRole === 'BUSINESS_ADMIN'
    if (isFree) return '/business/dashboard'
    if (isVendorUser) return `/business/checkout?plan=${plan.id}&billing=${billingCycle}`
    return `/register/vendor?plan=${plan.slug}`
  }, [isAuthenticated, isFree, plan, billingCycle, userRole])

  const sortedFeatures = [...(plan.features || [])].sort((a, b) => {
    if (a.isHighlighted && !b.isHighlighted) return -1
    if (!a.isHighlighted && b.isHighlighted) return 1
    return a.sortOrder - b.sortOrder
  })

  return (
    <Card
      className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
        plan.isPopular
          ? 'border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]'
          : 'hover:border-muted-foreground/30'
      }`}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        {plan.description && <CardDescription className="mt-1.5">{plan.description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="text-center py-2">
          {isFree ? (
            <>
              <div className="text-4xl font-bold">Free</div>
              <p className="text-sm text-muted-foreground mt-1">Forever</p>
            </>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">
                {formatVendorPrice(price?.amount ?? 0, price?.currency)}
              </span>
              <span className="text-muted-foreground">
                /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
              </span>
            </div>
          )}
        </div>

        <ul className="space-y-3">
          {sortedFeatures.map((feature) => (
            <li key={feature.key} className={`flex items-start gap-3 text-sm ${feature.isHighlighted ? 'font-medium' : ''}`}>
              <div className="flex-shrink-0 mt-0.5">{renderFeatureValue(feature)}</div>
              <span className={feature.isHighlighted ? 'text-foreground' : 'text-muted-foreground'}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button asChild className="w-full" variant={plan.isPopular ? 'default' : 'outline'} size="lg">
          <Link href={ctaLink}>{isFree ? 'Get Started Free' : 'Subscribe Now'}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

interface VendorPlansSectionProps {
  plans: PlanDisplay[] | undefined
  isLoading: boolean
  billingCycle: BillingCycle
  isAuthenticated: boolean
  userRole?: string
}

function VendorPlansSection({ plans, isLoading, billingCycle, isAuthenticated, userRole }: VendorPlansSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <EventPricingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No plans available at the moment.</p>
      </div>
    )
  }

  const sortedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
      {sortedPlans.map((plan) => (
        <VendorPricingCard
          key={plan.id}
          plan={plan}
          billingCycle={billingCycle}
          isAuthenticated={isAuthenticated}
          userRole={userRole}
        />
      ))}
    </div>
  )
}

// ============================================================================
// FAQ Section
// ============================================================================

const faqs = [
  {
    question: 'How does the unlimited events model work?',
    answer:
      'You can create as many events as you want, completely free! When creating an event, you choose a tier (Basic or Premium) which determines the feature limits for that specific event.',
  },
  {
    question: 'What is the difference between Basic and Premium tiers?',
    answer:
      'Basic tier supports up to 200 guests, 100 memory uploads, and 1GB storage per event. Premium tier offers up to 500 guests, 500 memory uploads, 5GB storage, custom invite templates, and priority support.',
  },
  {
    question: 'Is it really free to create events?',
    answer:
      'Yes! You can create unlimited events at no cost. The tier you choose determines what features are available within each event.',
  },
  {
    question: 'Can I change the tier of an existing event?',
    answer:
      'Currently, you select the tier when creating an event. We recommend choosing the appropriate tier based on your expected guest count and feature needs.',
  },
  {
    question: 'What happens if I exceed feature limits?',
    answer:
      'Each event has limits based on its tier (e.g., 200 guests for Basic, 500 for Premium). You will be notified when approaching limits. Consider creating a new Premium event for larger celebrations.',
  },
  {
    question: 'Do I need to pay for anything?',
    answer:
      'Event creation and basic features are free. In the future, we may offer premium add-ons or tier upgrades, but core event planning will always be free.',
  },
]

function FAQSection() {
  return (
    <section className="mt-20 border-t pt-16">
      <h2 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h2>
      <div className="max-w-3xl mx-auto space-y-6">
        {faqs.map((faq) => (
          <div key={faq.question} className="border-b pb-6">
            <h3 className="font-medium text-lg mb-2">{faq.question}</h3>
            <p className="text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY')
  const [activeTab, setActiveTab] = useState<'users' | 'vendors'>('users')

  const { isAuthenticated, user } = useAuth()
  const { data: vendorPlans, isLoading: vendorLoading } = useVendorPlans()
  const { data: eventPricing, isLoading: eventPricingLoading } = useEventCreditPricing()

  // Extract tier data from pricing response
  const eventTiers = useMemo(() => {
    if (!eventPricing?.tiers) return undefined
    return eventPricing.tiers as TierData[]
  }, [eventPricing])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16">
      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="secondary" className="mb-2">
          Unlimited Events, Free Forever
        </Badge>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Plan unlimited events for free
        </h1>
        <p className="text-lg text-muted-foreground">
          Create as many events as you want. Choose between Basic and Premium tiers
          based on the features you need for each event.
        </p>
      </section>

      {/* Tabs for User vs Vendor Plans */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'users' | 'vendors')}
        className="mt-8"
      >
        <TabsList className="mx-auto w-fit">
          <TabsTrigger value="users" className="gap-2 px-6">
            <Users className="h-4 w-4" />
            For Users
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2 px-6">
            <Building2 className="h-4 w-4" />
            For Vendors & Businesses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold">Event Tiers for Users</h2>
            <p className="text-muted-foreground mt-2">
              Plan your wedding, party, or any celebration with powerful tools
            </p>
          </div>

          {/* Unlimited Events Banner */}
          <UnlimitedEventsBanner isAuthenticated={isAuthenticated} />

          {/* Event Tiers */}
          <EventTiersSection
            isAuthenticated={isAuthenticated}
            tiers={eventTiers}
            isLoading={eventPricingLoading}
          />

          {/* Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>Create unlimited events. Feature limits apply per event based on the tier you choose.</p>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="mt-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold">Plans for Vendors & Businesses</h2>
            <p className="text-muted-foreground mt-2">
              Grow your event business with leads, bookings, and powerful management tools
            </p>
          </div>

          {/* Billing Toggle for Vendor Plans */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                billingCycle === 'MONTHLY'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                billingCycle === 'YEARLY'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Save 33%
              </Badge>
            </button>
          </div>

          <VendorPlansSection
            plans={vendorPlans}
            isLoading={vendorLoading}
            billingCycle={billingCycle}
            isAuthenticated={isAuthenticated}
            userRole={user?.role}
          />
        </TabsContent>
      </Tabs>

      {/* Enterprise CTA */}
      <section className="mt-16 rounded-2xl border bg-muted/40 p-8 text-center">
        <h2 className="text-2xl font-semibold">Need a custom solution?</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          For large teams, enterprise features, or custom integrations, contact our sales team.
          We will create a plan tailored to your specific needs.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <Button asChild size="lg">
            <Link href="/support">Contact Sales</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/for-vendors">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <section className="mt-12 text-center py-12 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <h2 className="text-2xl font-semibold">Ready to plan your event?</h2>
        <p className="text-muted-foreground mt-2">
          {isAuthenticated
            ? 'Create your next event and start planning'
            : 'Join thousands of happy users planning their dream events - completely free'}
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href={isAuthenticated ? '/dashboard/events/new' : '/register'}>
            {isAuthenticated ? 'Create Event' : 'Get Started Free'}
          </Link>
        </Button>
      </section>
    </main>
  )
}
