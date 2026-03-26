'use client'

import { useState, useMemo } from 'react'
import { useVendorPlans, useEventCreditProducts } from '@/hooks/queries/use-subscription'
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
import { Check, X, Loader2, Sparkles, Users, Building2, Gift, Percent } from 'lucide-react'
import Link from 'next/link'
import type { PlanDisplay, FeatureDisplay, BillingCycle, EventCreditProduct, EventTier, BundleType } from '@/lib/api/types/subscription.types'

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
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Full-featured for grand celebrations and large events',
    color: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    isPopular: true,
  },
}

const BUNDLE_INFO: Record<BundleType, { label: string; shortLabel: string }> = {
  SINGLE: { label: '1 Event', shortLabel: '1' },
  FIVE_PACK: { label: '5 Events', shortLabel: '5' },
  TEN_PACK: { label: '10 Events', shortLabel: '10' },
}

const BASIC_FEATURES = [
  { key: 'guests', name: 'Up to 200 guests', included: true },
  { key: 'memory_uploads', name: '100 memory uploads', included: true },
  { key: 'storage', name: '1 GB storage', included: true },
  { key: 'einvite', name: 'E-invite creation', included: true },
  { key: 'whatsapp', name: '200 WhatsApp invites', included: true },
  { key: 'rsvp', name: 'RSVP tracking', included: true },
  { key: 'export', name: 'Data export', included: true },
  { key: 'custom_templates', name: 'Custom invite templates', included: false },
  { key: 'priority_support', name: 'Priority support', included: false },
]

const PREMIUM_FEATURES = [
  { key: 'guests', name: 'Unlimited guests', included: true },
  { key: 'memory_uploads', name: 'Unlimited memory uploads', included: true },
  { key: 'storage', name: '10 GB storage', included: true },
  { key: 'einvite', name: 'E-invite creation', included: true },
  { key: 'whatsapp', name: 'Unlimited WhatsApp invites', included: true },
  { key: 'rsvp', name: 'RSVP tracking', included: true },
  { key: 'export', name: 'Data export', included: true },
  { key: 'custom_templates', name: 'Custom invite templates', included: true },
  { key: 'priority_support', name: 'Priority support', included: true },
]

// ============================================================================
// Helper Functions
// ============================================================================

function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

function groupProductsByTier(products: EventCreditProduct[]): Record<EventTier, EventCreditProduct[]> {
  return products.reduce((acc, product) => {
    if (!acc[product.tier]) {
      acc[product.tier] = []
    }
    acc[product.tier].push(product)
    return acc
  }, {} as Record<EventTier, EventCreditProduct[]>)
}

function sortProductsByBundle(products: EventCreditProduct[]): EventCreditProduct[] {
  const order: BundleType[] = ['SINGLE', 'FIVE_PACK', 'TEN_PACK']
  return [...products].sort((a, b) => order.indexOf(a.bundleType) - order.indexOf(b.bundleType))
}

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
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="h-6 bg-muted rounded w-20 mb-2" />
              <div className="h-8 bg-muted rounded w-28" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
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
// Bundle Option Component
// ============================================================================

interface BundleOptionProps {
  product: EventCreditProduct
  isSelected: boolean
  onSelect: () => void
}

function BundleOption({ product, isSelected, onSelect }: BundleOptionProps) {
  const bundleInfo = BUNDLE_INFO[product.bundleType]

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 border rounded-lg text-left transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium">{bundleInfo.label}</span>
        {product.discountPercent && product.discountPercent > 0 && (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Percent className="h-3 w-3 mr-1" />
            {product.discountPercent}% off
          </Badge>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{formatPrice(product.priceInr)}</span>
        {product.bundleType !== 'SINGLE' && (
          <span className="text-sm text-muted-foreground">
            ({formatPrice(Math.round(product.priceInr / product.creditCount))}/event)
          </span>
        )}
      </div>
    </button>
  )
}

// ============================================================================
// Event Pricing Card Component
// ============================================================================

interface EventPricingCardProps {
  tier: EventTier
  products: EventCreditProduct[]
  features: { key: string; name: string; included: boolean }[]
  isAuthenticated: boolean
}

function EventPricingCard({ tier, products, features, isAuthenticated }: EventPricingCardProps) {
  const [selectedBundle, setSelectedBundle] = useState<BundleType>('SINGLE')
  const tierInfo = TIER_INFO[tier]
  const sortedProducts = sortProductsByBundle(products)
  const selectedProduct = sortedProducts.find(p => p.bundleType === selectedBundle)

  const ctaLink = useMemo(() => {
    if (!selectedProduct) return '/register'
    if (!isAuthenticated) {
      return `/register?product=${selectedProduct.id}`
    }
    return `/checkout?product=${selectedProduct.id}`
  }, [selectedProduct, isAuthenticated])

  return (
    <Card
      className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
        tierInfo.isPopular
          ? 'border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]'
          : 'hover:border-muted-foreground/30'
      }`}
    >
      {/* Popular Badge */}
      {tierInfo.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className={`text-center pb-4 rounded-t-lg ${tierInfo.color}`}>
        <CardTitle className="text-xl">{tierInfo.name}</CardTitle>
        <CardDescription className="mt-1.5">{tierInfo.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-6">
        {/* Bundle Options */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Select package:</p>
          {sortedProducts.map((product) => (
            <BundleOption
              key={product.id}
              product={product}
              isSelected={selectedBundle === product.bundleType}
              onSelect={() => setSelectedBundle(product.bundleType)}
            />
          ))}
        </div>

        {/* Features List */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-muted-foreground mb-3">Features per event:</p>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature.key} className="flex items-center gap-2 text-sm">
                {feature.included ? (
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={feature.included ? '' : 'text-muted-foreground/70'}>
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
          variant={tierInfo.isPopular ? 'default' : 'outline'}
          size="lg"
        >
          <Link href={ctaLink}>
            {isAuthenticated ? 'Buy Credits' : 'Get Started'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Free Tier Banner
// ============================================================================

function FreeTierBanner({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800 mb-8">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900">
            <Gift className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Start Free</h3>
            <p className="text-muted-foreground">
              Every new user gets <span className="font-semibold text-emerald-600">1 free Basic event</span> to try all features!
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950">
          <Link href={isAuthenticated ? '/dashboard' : '/register'}>
            {isAuthenticated ? 'Go to Dashboard' : 'Claim Free Event'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Event Credits Section
// ============================================================================

interface EventCreditsSectionProps {
  products: EventCreditProduct[] | undefined
  isLoading: boolean
  isAuthenticated: boolean
}

function EventCreditsSection({ products, isLoading, isAuthenticated }: EventCreditsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <EventPricingCardSkeleton />
        <EventPricingCardSkeleton />
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No pricing options available at the moment.</p>
      </div>
    )
  }

  const productsByTier = groupProductsByTier(products)

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      {productsByTier.BASIC && (
        <EventPricingCard
          tier="BASIC"
          products={productsByTier.BASIC}
          features={BASIC_FEATURES}
          isAuthenticated={isAuthenticated}
        />
      )}
      {productsByTier.PREMIUM && (
        <EventPricingCard
          tier="PREMIUM"
          products={productsByTier.PREMIUM}
          features={PREMIUM_FEATURES}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
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

  const sortedFeatures = [...plan.features].sort((a, b) => {
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
    question: 'How does event-based pricing work?',
    answer:
      'Instead of monthly subscriptions, you purchase credits for each event you want to plan. You can buy single event credits or bundles (5 or 10 events) at discounted rates. Credits never expire!',
  },
  {
    question: 'What is the difference between Basic and Premium events?',
    answer:
      'Basic events support up to 200 guests with 100 memory uploads and 1GB storage. Premium events have unlimited guests and memory uploads, 10GB storage, custom invite templates, and priority support.',
  },
  {
    question: 'Do event credits expire?',
    answer:
      'No! Your event credits never expire. Use them whenever you are ready to plan your next celebration.',
  },
  {
    question: 'Can I upgrade from Basic to Premium for an event?',
    answer:
      'Currently, you need to select the tier when creating an event. We recommend choosing Premium for larger celebrations where you need unlimited features.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, debit cards, UPI, and net banking through our secure payment partner Razorpay.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Unused event credits can be refunded within 7 days of purchase. Once an event is created using a credit, that credit is non-refundable.',
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
  const { data: eventProducts, isLoading: productsLoading } = useEventCreditProducts()

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16">
      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="secondary" className="mb-2">
          Simple, Event-Based Pricing
        </Badge>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Pay only for what you need
        </h1>
        <p className="text-lg text-muted-foreground">
          No monthly subscriptions for users. Buy event credits and use them whenever you are ready.
          Credits never expire!
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
            <h2 className="text-2xl font-semibold">Event Pricing for Users</h2>
            <p className="text-muted-foreground mt-2">
              Plan your wedding, party, or any celebration with powerful tools
            </p>
          </div>

          {/* Free Tier Banner */}
          <FreeTierBanner isAuthenticated={isAuthenticated} />

          {/* Event Credits Pricing */}
          <EventCreditsSection
            products={eventProducts}
            isLoading={productsLoading}
            isAuthenticated={isAuthenticated}
          />

          {/* Credits Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>All prices are in Indian Rupees (INR). Bundle discounts are applied at checkout.</p>
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
            ? 'Purchase event credits to start planning your celebration'
            : 'Join thousands of happy users planning their dream events'}
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href={isAuthenticated ? '/dashboard' : '/register'}>
            {isAuthenticated ? 'Go to Dashboard' : 'Start Free'}
          </Link>
        </Button>
      </section>
    </main>
  )
}
