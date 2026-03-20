'use client'

import { useState, useMemo } from 'react'
import { useVendorPlans, useUserPlans } from '@/hooks/queries/use-subscription'
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
import { Switch } from '@/components/ui/switch'
import { Check, X, Loader2, Sparkles, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import type { PlanDisplay, FeatureDisplay, BillingCycle } from '@/lib/api/types/subscription.types'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency for display
 */
function formatPrice(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get the price for the selected billing cycle
 */
function getPriceForCycle(plan: PlanDisplay, cycle: BillingCycle) {
  return plan.allPrices.find((p) => p.billingCycle === cycle)
}

/**
 * Calculate yearly savings percentage
 */
function calculateYearlySavings(plan: PlanDisplay): number | null {
  const monthlyPrice = getPriceForCycle(plan, 'MONTHLY')
  const yearlyPrice = getPriceForCycle(plan, 'YEARLY')

  if (!monthlyPrice || !yearlyPrice || monthlyPrice.amount === 0) {
    return yearlyPrice?.savingsPercent || null
  }

  const yearlyEquivalent = monthlyPrice.amount * 12
  const savings = ((yearlyEquivalent - yearlyPrice.amount) / yearlyEquivalent) * 100
  return Math.round(savings)
}

/**
 * Render feature value based on limit type
 */
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

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function PricingCardSkeleton() {
  return (
    <Card className="relative flex flex-col animate-pulse">
      <CardHeader className="text-center pb-4">
        <div className="h-6 bg-muted rounded w-24 mx-auto mb-2" />
        <div className="h-4 bg-muted rounded w-32 mx-auto" />
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="text-center py-4">
          <div className="h-10 bg-muted rounded w-28 mx-auto mb-2" />
          <div className="h-4 bg-muted rounded w-20 mx-auto" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 bg-muted rounded" />
              <div className="h-4 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 bg-muted rounded w-full" />
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Pricing Card Component
// ============================================================================

interface PricingCardProps {
  plan: PlanDisplay
  billingCycle: BillingCycle
  isVendorPlan?: boolean
  isAuthenticated?: boolean
  userRole?: string
}

function PricingCard({ plan, billingCycle, isVendorPlan = false, isAuthenticated = false, userRole }: PricingCardProps) {
  const price = getPriceForCycle(plan, billingCycle)
  const yearlySavings = calculateYearlySavings(plan)
  const isFree = plan.tier === 'FREE' || (price?.amount ?? 0) === 0

  // Determine CTA link based on auth status, plan type and tier
  const ctaLink = useMemo(() => {
    // Not logged in - go to registration
    if (!isAuthenticated) {
      if (isFree) {
        return isVendorPlan ? '/register/vendor' : '/register'
      }
      return isVendorPlan ? `/register/vendor?plan=${plan.slug}` : `/register?plan=${plan.slug}`
    }

    // Logged in - check user type and plan type
    const isVendorUser = userRole === 'BUSINESS_ADMIN'

    // Free plan - go to dashboard
    if (isFree) {
      return isVendorPlan ? '/business/dashboard' : '/dashboard'
    }

    // Paid plan - go to appropriate checkout
    if (isVendorPlan) {
      // Vendor plan - requires vendor account
      if (isVendorUser) {
        return `/business/checkout?plan=${plan.id}&billing=${billingCycle}`
      }
      // Regular user trying to get vendor plan - redirect to vendor registration
      return `/register/vendor?plan=${plan.slug}`
    }

    // User plan - go to user checkout
    return `/checkout?plan=${plan.id}&billing=${billingCycle}`
  }, [isAuthenticated, isFree, isVendorPlan, plan, billingCycle, userRole])

  const ctaText = useMemo(() => {
    if (isFree) return 'Get Started Free'
    if (isAuthenticated) return 'Subscribe Now'
    return 'Subscribe Now'
  }, [isFree, isAuthenticated])

  // Sort features by highlighted first, then by sort order
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
      {/* Popular Badge */}
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
        {plan.description && (
          <CardDescription className="mt-1.5">{plan.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Pricing */}
        <div className="text-center py-2">
          {isFree ? (
            <>
              <div className="text-4xl font-bold">Free</div>
              <p className="text-sm text-muted-foreground mt-1">Forever</p>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">
                  {formatPrice(price?.amount ?? 0, price?.currency)}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                </span>
              </div>
              {billingCycle === 'YEARLY' && yearlySavings && yearlySavings > 0 && (
                <Badge variant="secondary" className="mt-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Save {yearlySavings}%
                </Badge>
              )}
              {billingCycle === 'MONTHLY' && yearlySavings && yearlySavings > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Save {yearlySavings}% with annual billing
                </p>
              )}
            </>
          )}
        </div>

        {/* Trial Days */}
        {plan.trialDays > 0 && !isFree && (
          <p className="text-center text-sm text-muted-foreground border-y py-3 -mx-6 px-6 bg-muted/30">
            {plan.trialDays}-day free trial included
          </p>
        )}

        {/* Features List */}
        <ul className="space-y-3">
          {sortedFeatures.map((feature) => (
            <li
              key={feature.key}
              className={`flex items-start gap-3 text-sm ${
                feature.isHighlighted ? 'font-medium' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">{renderFeatureValue(feature)}</div>
              <div className="flex-1">
                <span className={feature.isHighlighted ? 'text-foreground' : 'text-muted-foreground'}>
                  {feature.name}
                </span>
                {feature.description && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{feature.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          asChild
          className="w-full"
          variant={plan.isPopular ? 'default' : 'outline'}
          size="lg"
        >
          <Link href={ctaLink}>{ctaText}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ============================================================================
// Plans Section Component
// ============================================================================

interface PlansSectionProps {
  plans: PlanDisplay[] | undefined
  isLoading: boolean
  billingCycle: BillingCycle
  isVendorPlan?: boolean
  isAuthenticated?: boolean
  userRole?: string
}

function PlansSection({ plans, isLoading, billingCycle, isVendorPlan = false, isAuthenticated = false, userRole }: PlansSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <PricingCardSkeleton key={i} />
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

  // Sort plans by display order
  const sortedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div
      className={`grid gap-6 ${
        sortedPlans.length === 2
          ? 'md:grid-cols-2 max-w-3xl mx-auto'
          : sortedPlans.length === 3
            ? 'md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
            : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }`}
    >
      {sortedPlans.map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          billingCycle={billingCycle}
          isVendorPlan={isVendorPlan}
          isAuthenticated={isAuthenticated}
          userRole={userRole}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Billing Toggle Component
// ============================================================================

interface BillingToggleProps {
  billingCycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
}

function BillingToggle({ billingCycle, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={`text-sm font-medium transition-colors ${
          billingCycle === 'MONTHLY' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Monthly
      </span>
      <Switch
        checked={billingCycle === 'YEARLY'}
        onCheckedChange={(checked) => onChange(checked ? 'YEARLY' : 'MONTHLY')}
        aria-label="Toggle yearly billing"
      />
      <span
        className={`text-sm font-medium transition-colors ${
          billingCycle === 'YEARLY' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Yearly
      </span>
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        Save up to 33%
      </Badge>
    </div>
  )
}

// ============================================================================
// FAQ Section
// ============================================================================

const faqs = [
  {
    question: 'Can I change my plan later?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you will be charged the prorated difference. When downgrading, the change will take effect at the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, debit cards, UPI, and net banking. For enterprise plans, we also support bank transfers and invoicing.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes, all paid plans come with a free trial period. You can explore all features before your card is charged.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We offer a 7-day money-back guarantee for all new subscriptions. If you are not satisfied, contact our support team within 7 days of your purchase.',
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
  const { data: userPlans, isLoading: userLoading } = useUserPlans()

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-16">
      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="secondary" className="mb-2">
          Simple, Transparent Pricing
        </Badge>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          Choose the perfect plan for your needs
        </h1>
        <p className="text-lg text-muted-foreground">
          Whether you are planning your dream event or growing your vendor business, we have a plan
          that fits. Start free, upgrade when you are ready.
        </p>
      </section>

      {/* Billing Toggle */}
      <div className="mt-8">
        <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
      </div>

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
            <h2 className="text-2xl font-semibold">Plans for Users</h2>
            <p className="text-muted-foreground mt-2">
              Plan your wedding, party, or any event with powerful tools and vendor discovery
            </p>
          </div>
          <PlansSection
            plans={userPlans}
            isLoading={userLoading}
            billingCycle={billingCycle}
            isVendorPlan={false}
            isAuthenticated={isAuthenticated}
            userRole={user?.role}
          />
        </TabsContent>

        <TabsContent value="vendors" className="mt-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold">Plans for Vendors & Businesses</h2>
            <p className="text-muted-foreground mt-2">
              Grow your event business with leads, bookings, and powerful management tools
            </p>
          </div>
          <PlansSection
            plans={vendorPlans}
            isLoading={vendorLoading}
            billingCycle={billingCycle}
            isVendorPlan={true}
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
        <h2 className="text-2xl font-semibold">Ready to get started?</h2>
        <p className="text-muted-foreground mt-2">
          {isAuthenticated
            ? 'Upgrade your plan to unlock more features'
            : 'Join thousands of happy users and vendors on Omnicassion'}
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href={isAuthenticated ? (user?.role === 'BUSINESS_ADMIN' ? '/business/dashboard' : '/dashboard') : '/register'}>
            {isAuthenticated ? 'Go to Dashboard' : 'Create Your Free Account'}
          </Link>
        </Button>
      </section>
    </main>
  )
}
