'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useVendorPlans, useEventCreditPricing } from '@/hooks/queries/use-subscription'
import { useAuth } from '@/hooks/use-auth'
import { Brush, SketchButton, SkContainer, Stamp, skBtn, skPaper } from '@/components/sketch'
import { PageHead } from '@/components/marketing/page-head'
import { cn } from '@/lib/utils'
import type { PlanDisplay, FeatureDisplay, BillingCycle, EventTier } from '@/lib/api/types/subscription.types'

// ============================================================================
// Constants
// ============================================================================

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
// Shared presentation helpers
// ============================================================================

function Tick({ included }: { included: boolean }) {
  return (
    <span
      className={cn('font-hand shrink-0 text-[1.3rem] leading-none', included ? 'text-leaf-deep' : 'text-rose')}
      aria-hidden="true"
    >
      {included ? '✓' : '✕'}
    </span>
  )
}

function PlanSkeleton() {
  return (
    <div className={skPaper({ className: 'animate-pulse p-8' })} aria-hidden="true">
      <div className="bg-line mb-3 h-7 w-28 rounded" />
      <div className="bg-line mb-6 h-4 w-48 rounded" />
      <div className="bg-line mb-6 h-10 w-32 rounded" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-line h-4 rounded" />
        ))}
      </div>
    </div>
  )
}

const PLAN_GRID = 'mx-auto mt-2 grid max-w-[880px] grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-9'
const PLAN_GRID_WIDE = 'mx-auto mt-2 grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-9'

// ============================================================================
// Unlimited Events Banner
// ============================================================================

function UnlimitedEventsBanner({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div
      className={skPaper({
        alt: true,
        className: 'mx-auto mb-9 flex max-w-[880px] flex-wrap items-center justify-between gap-4 p-6',
      })}
    >
      <div className="min-w-0 flex-1 basis-72">
        <h3 className="font-display text-[1.3rem] font-semibold">Create Unlimited Events</h3>
        <p className="text-ink-soft mt-1">
          Plan as many events as you want. Choose a tier based on the features and pricing that fit your event.
        </p>
      </div>
      <SketchButton asChild variant="line">
        <Link href={isAuthenticated ? '/dashboard/events/new' : '/register'}>
          {isAuthenticated ? 'Create Event' : 'Get Started'}
        </Link>
      </SketchButton>
    </div>
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
    price: tier === 'BASIC' ? 'From Rs. 499' : 'From Rs. 1299',
    priceSubtext: 'Per event',
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
      <div className={PLAN_GRID}>
        <PlanSkeleton />
        <PlanSkeleton />
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
    <div className={PLAN_GRID}>
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
    <div
      className={skPaper({
        alt: tierData.isPopular,
        tape: tierData.isPopular,
        className: 'flex flex-col px-[30px] py-8',
      })}
    >
      {tierData.isPopular && <Stamp className="bg-card absolute -top-3 right-5 rotate-[4deg]">Best Value</Stamp>}
      <h2 className="font-display text-[2rem] font-semibold">{tierData.name}</h2>
      <p className="text-ink-soft">{tierData.description}</p>
      <div className="font-display text-blue mt-[18px] mb-1 text-[2.6rem] leading-none font-bold">{tierData.price}</div>
      <small className="text-ink-soft">{tierData.priceSubtext}</small>

      <ul className="my-[22px] grid flex-1 content-start gap-[9px]">
        {(tierData.features || []).map((feature) => (
          <li
            key={feature.key}
            className={cn(
              'flex items-start gap-[9px]',
              feature.isHighlighted && 'font-semibold',
              !feature.included && 'text-ink-soft decoration-rose line-through',
            )}
          >
            <Tick included={feature.included} />
            <span>{feature.name}</span>
          </li>
        ))}
      </ul>

      <SketchButton asChild variant={tierData.isPopular ? 'solid' : 'line'}>
        <Link href={ctaLink}>{isAuthenticated ? 'Create Event' : `Choose ${tierData.name}`}</Link>
      </SketchButton>
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
      return <Tick included={feature.limitValue === 1 || feature.displayValue === 'Yes'} />
    case 'UNLIMITED':
      return <span className="text-leaf-deep font-bold">Unlimited</span>
    case 'COUNT':
    case 'COUNT_PER_MONTH':
    case 'COUNT_PER_YEAR':
      return <span className="font-bold">{feature.displayValue || feature.limitValue?.toLocaleString()}</span>
    default:
      return <span className="font-bold">{feature.displayValue}</span>
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
    <div
      className={skPaper({
        alt: plan.isPopular,
        tape: plan.isPopular,
        className: 'flex flex-col px-[30px] py-8',
      })}
    >
      {plan.isPopular && <Stamp className="bg-card absolute -top-3 right-5 rotate-[4deg]">Most Popular</Stamp>}
      <h2 className="font-display text-[2rem] font-semibold">{plan.name}</h2>
      {plan.description && <p className="text-ink-soft">{plan.description}</p>}

      <div className="mt-[18px] mb-1">
        {isFree ? (
          <>
            <div className="font-display text-blue text-[2.6rem] leading-none font-bold">Free</div>
            <small className="text-ink-soft">Forever</small>
          </>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="font-display text-blue text-[2.6rem] leading-none font-bold">
              {formatVendorPrice(price?.amount ?? 0, price?.currency)}
            </span>
            <span className="text-ink-soft">/{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
          </div>
        )}
      </div>

      <ul className="my-[22px] grid flex-1 content-start gap-[9px]">
        {sortedFeatures.map((feature) => (
          <li key={feature.key} className={cn('flex items-start gap-[9px]', feature.isHighlighted && 'font-semibold')}>
            <span className="shrink-0">{renderFeatureValue(feature)}</span>
            <span className={feature.isHighlighted ? 'text-ink' : 'text-ink-soft'}>{feature.name}</span>
          </li>
        ))}
      </ul>

      <SketchButton asChild variant={plan.isPopular ? 'solid' : 'line'}>
        <Link href={ctaLink}>{isFree ? 'Get Started Free' : 'Subscribe Now'}</Link>
      </SketchButton>
    </div>
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
      <div className={PLAN_GRID_WIDE}>
        {Array.from({ length: 3 }).map((_, i) => (
          <PlanSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink-soft">No plans available at the moment.</p>
      </div>
    )
  }

  const sortedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className={PLAN_GRID_WIDE}>
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
    <section className="mt-16 pt-4">
      <h2 className="font-display mb-6 text-center text-[1.8rem] font-semibold">Frequently Asked Questions</h2>
      <div className="mx-auto max-w-[780px]">
        {faqs.map((faq, i) => (
          <details key={faq.question} open={i === 0} className="border-line group border-b-2 border-dashed px-1 py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
              {faq.question}
              <span className="sk-hand text-[1.7rem] group-open:hidden" aria-hidden>
                +
              </span>
              <span className="sk-hand hidden text-[1.7rem] group-open:inline" aria-hidden>
                –
              </span>
            </summary>
            <p className="text-ink-soft mt-2 max-w-[62ch]">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

type PricingTab = 'users' | 'vendors'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY')
  const [activeTab, setActiveTab] = useState<PricingTab>('users')

  const { isAuthenticated, user } = useAuth()
  const { data: vendorPlans, isLoading: vendorLoading } = useVendorPlans()
  const { data: eventPricing, isLoading: eventPricingLoading } = useEventCreditPricing()

  // Extract tier data from pricing response
  const eventTiers = useMemo(() => {
    if (!eventPricing?.tiers) return undefined
    return eventPricing.tiers as TierData[]
  }, [eventPricing])

  const tabs: Array<{ id: PricingTab; label: string }> = [
    { id: 'users', label: 'For Users' },
    { id: 'vendors', label: 'For Vendors & Businesses' },
  ]

  return (
    <SkContainer className="pb-16">
      <PageHead
        center
        eyebrow="Pricing"
        title={
          <>
            Plans for every <Brush gold>celebration</Brush>.
          </>
        }
        sub="Create as many events as you want. Choose between Basic and Premium tiers based on the features you need for each event."
      />

      <div className="mt-6 flex flex-wrap justify-center gap-3" role="tablist" aria-label="Pricing for">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`pricing-tab-${t.id}`}
            aria-selected={activeTab === t.id}
            aria-controls={`pricing-panel-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            className={skBtn(activeTab === t.id ? 'solid' : 'line', 'sm')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' ? (
        <div role="tabpanel" id="pricing-panel-users" aria-labelledby="pricing-tab-users" className="mt-10">
          <div className="mb-8 text-center">
            <h2 className="font-display text-[1.8rem] font-semibold">Event Tiers for Users</h2>
            <p className="text-ink-soft mt-2">Plan your wedding, party, or any celebration with powerful tools</p>
          </div>

          <UnlimitedEventsBanner isAuthenticated={isAuthenticated} />

          <EventTiersSection
            isAuthenticated={isAuthenticated}
            tiers={eventTiers}
            isLoading={eventPricingLoading}
          />

          <p className="text-ink-soft mt-12 text-center text-sm">
            Create unlimited events. Feature limits apply per event based on the tier you choose.
          </p>
        </div>
      ) : (
        <div role="tabpanel" id="pricing-panel-vendors" aria-labelledby="pricing-tab-vendors" className="mt-10">
          <div className="mb-8 text-center">
            <h2 className="font-display text-[1.8rem] font-semibold">Plans for Vendors &amp; Businesses</h2>
            <p className="text-ink-soft mt-2">
              Grow your event business with leads, bookings, and powerful management tools
            </p>
          </div>

          <div className="mb-9 flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Billing cycle">
            <button
              type="button"
              aria-pressed={billingCycle === 'MONTHLY'}
              onClick={() => setBillingCycle('MONTHLY')}
              className={skBtn(billingCycle === 'MONTHLY' ? 'solid' : 'line', 'sm')}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={billingCycle === 'YEARLY'}
              onClick={() => setBillingCycle('YEARLY')}
              className={skBtn(billingCycle === 'YEARLY' ? 'solid' : 'line', 'sm')}
            >
              Yearly
              <Stamp className="ml-2">Save 33%</Stamp>
            </button>
          </div>

          <VendorPlansSection
            plans={vendorPlans}
            isLoading={vendorLoading}
            billingCycle={billingCycle}
            isAuthenticated={isAuthenticated}
            userRole={user?.role}
          />
        </div>
      )}

      {/* Enterprise CTA */}
      <section className="mt-16">
        <div className={skPaper({ alt: true, className: 'mx-auto max-w-[720px] p-7 text-center' })}>
          <h2 className="font-display text-[1.6rem] font-semibold">Need a custom solution?</h2>
          <p className="text-ink-soft mx-auto mt-2 max-w-xl">
            For large teams, enterprise features, or custom integrations, contact our sales team.
            We will create a plan tailored to your specific needs.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <SketchButton asChild>
              <Link href="/support">Contact Sales</Link>
            </SketchButton>
            <SketchButton asChild variant="line">
              <Link href="/for-vendors">Learn More</Link>
            </SketchButton>
          </div>
        </div>
      </section>

      <FAQSection />

      {/* Final CTA */}
      <section className="mt-14 text-center">
        <h2 className="font-display text-[1.8rem] font-semibold">Ready to plan your event?</h2>
        <p className="text-ink-soft mx-auto mt-2 max-w-xl">
          {isAuthenticated
            ? 'Create your next event and start planning'
            : 'Join thousands of happy users planning unforgettable events with the right tier for every celebration'}
        </p>
        <div className="mt-6">
          <SketchButton asChild>
            <Link href={isAuthenticated ? '/dashboard/events/new' : '/register'}>
              {isAuthenticated ? 'Create Event' : 'Get Started'}
            </Link>
          </SketchButton>
        </div>
      </section>
    </SkContainer>
  )
}
