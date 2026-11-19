'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  History,
  Coins,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useVendorSubscription,
  useVendorUsage,
  useAdCreditBalance,
  useVendorCancelSubscription,
  useVendorReactivateSubscription,
  useVendorUpgradePlan,
  useVendorDowngradePlan,
  useVendorPauseSubscription,
  useVendorResumeSubscription,
  useVendorPlans,
} from '@/hooks/queries/use-subscription'
import { useBusinessPaymentHistory } from '@/hooks/queries/use-payment'
import { format } from 'date-fns'
import Link from 'next/link'
import type {
  SubscriptionStatus,
  Subscription,
  FeatureLimitStatus,
} from '@/lib/api/types/subscription.types'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { PaymentRecord } from '@/lib/api/types/payment.types'
import { PageHeader, DataTable, StatusBadge, TwoLineCell } from '@/components/dash'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useUmami } from '@/hooks/use-umami'

// Import new subscription management components
import { UpgradeModal } from '@/components/subscription/upgrade-modal'
import { DowngradeModal } from '@/components/subscription/downgrade-modal'
import { CancelModal } from '@/components/subscription/cancel-modal'
import { PauseSubscriptionModal, ResumeSubscriptionButton } from '@/components/subscription/pause-subscription'

// Status badge configuration
const statusConfig: Record<
  SubscriptionStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }
> = {
  ACTIVE: { label: 'Active', variant: 'default', icon: CheckCircle2 },
  TRIALING: { label: 'Trial', variant: 'secondary', icon: Clock },
  PENDING: { label: 'Pending', variant: 'outline', icon: Clock },
  PAST_DUE: { label: 'Past Due', variant: 'destructive', icon: AlertTriangle },
  CANCELLED: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
  PAUSED: { label: 'Paused', variant: 'secondary', icon: Clock },
  EXPIRED: { label: 'Expired', variant: 'destructive', icon: XCircle },
}

// Format currency
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Get billing cycle label
function getBillingCycleLabel(cycle: string): string {
  const labels: Record<string, string> = {
    MONTHLY: 'per month',
    QUARTERLY: 'per quarter',
    YEARLY: 'per year',
    LIFETIME: 'one-time',
  }
  return labels[cycle] || cycle.toLowerCase()
}

// Feature key to display name for vendors
function getFeatureDisplayName(key: string): string {
  const names: Record<string, string> = {
    portfolio_images: 'Portfolio Images',
    albums: 'Albums',
    featured_listings: 'Featured Listings',
    lead_responses: 'Lead Responses',
    analytics_access: 'Analytics Access',
    priority_placement: 'Priority Placement',
    verified_badge: 'Verified Badge',
    ad_credits_monthly: 'Monthly Ad Credits',
    team_members: 'Team Members',
    custom_branding: 'Custom Branding',
    api_access: 'API Access',
  }
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Tier display names
function getTierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    FREE: 'Free',
    STARTER: 'Starter',
    PROFESSIONAL: 'Professional',
    ENTERPRISE: 'Enterprise',
  }
  return names[tier] || tier
}

// Get tier order for comparison
function getTierOrder(tier: string): number {
  const order: Record<string, number> = {
    FREE: 0,
    STARTER: 1,
    PROFESSIONAL: 2,
    ENTERPRISE: 3,
  }
  return order[tier] ?? 0
}

export default function VendorSubscriptionSettingsPage() {
  const router = useRouter()
  const { track } = useUmami()

  // Modal states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [pauseModalOpen, setPauseModalOpen] = useState(false)

  // Queries
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } = useVendorSubscription()
  const { data: usageData, isLoading: usageLoading } = useVendorUsage()
  const { data: adCredits, isLoading: adCreditsLoading } = useAdCreditBalance()
  const { data: availablePlans = [] } = useVendorPlans()
  const { data: paymentHistory, isLoading: paymentsLoading } = useBusinessPaymentHistory(10)

  // Mutations
  const cancelMutation = useVendorCancelSubscription()
  const reactivateMutation = useVendorReactivateSubscription()
  const upgradeMutation = useVendorUpgradePlan()
  const downgradeMutation = useVendorDowngradePlan()
  const pauseMutation = useVendorPauseSubscription()
  const resumeMutation = useVendorResumeSubscription()

  useEffect(() => {
    track('business:settings:subscription:page_view', { section: 'subscription' })
  }, [track])

  // Handle upgrade
  const handleUpgrade = async (planId: string, priceId: string) => {
    await upgradeMutation.mutateAsync({
      newPlanId: planId,
      newPriceId: priceId,
      immediateUpgrade: true,
    })
  }

  // Handle downgrade
  const handleDowngrade = async (planId: string, priceId: string, reason?: string) => {
    await downgradeMutation.mutateAsync({
      newPlanId: planId,
      newPriceId: priceId,
      reason,
    })
  }

  // Handle cancel subscription
  const handleCancelSubscription = async (reason?: string, feedback?: string, immediate?: boolean) => {
    await cancelMutation.mutateAsync({
      reason,
      feedback,
      cancelImmediately: immediate,
    })
  }

  // Handle reactivate subscription
  const handleReactivateSubscription = async () => {
    try {
      await reactivateMutation.mutateAsync()
      toast.success('Subscription reactivated', {
        description: 'Your subscription has been restored.',
      })
    } catch (error) {
      toast.error('Failed to reactivate subscription', {
        description: 'Please try again or contact support.',
      })
    }
  }

  // Handle pause subscription
  const handlePauseSubscription = async (durationMonths: number) => {
    await pauseMutation.mutateAsync(durationMonths)
  }

  // Handle resume subscription
  const handleResumeSubscription = async () => {
    await resumeMutation.mutateAsync()
  }

  // Loading state
  if (subscriptionLoading) {
    return (
      <div className="space-y-3">
        <PageHeader title="Subscription" />
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (subscriptionError) {
    return (
      <div className="space-y-3">
        <PageHeader title="Subscription" />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading subscription</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load your subscription details. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const hasSubscription = !!subscription?.id
  const planTier = subscription?.plan?.tier || 'FREE'
  const currentTierOrder = getTierOrder(planTier)
  const hasHigherPlans = availablePlans.some((p) => getTierOrder(p.tier) > currentTierOrder)
  const hasLowerPlans = availablePlans.some((p) => getTierOrder(p.tier) < currentTierOrder && getTierOrder(p.tier) > 0)
  const isActive = subscription?.status === 'ACTIVE'
  const isPaused = subscription?.status === 'PAUSED'
  const isCancelled = subscription?.status === 'CANCELLED' || subscription?.cancelAtPeriodEnd

  return (
    <div className="space-y-3">
      <PageHeader title="Subscription" />

      {/* Status Alerts */}
      {subscription?.cancelAtPeriodEnd && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription ending soon</AlertTitle>
          <AlertDescription>
            Your subscription will be cancelled on {formatDate(subscription.currentPeriodEnd)}.
            You can continue to use premium features until then.
          </AlertDescription>
        </Alert>
      )}

      {subscription?.status === 'TRIALING' && subscription.trialEnd && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Trial period active</AlertTitle>
          <AlertDescription>
            Your free trial ends on {formatDate(subscription.trialEnd)}.
            Add a payment method to continue after the trial.
          </AlertDescription>
        </Alert>
      )}

      {subscription?.status === 'PAST_DUE' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment overdue</AlertTitle>
          <AlertDescription>
            Your payment is past due. Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {isPaused && (
        <Alert>
          <Pause className="h-4 w-4" />
          <AlertTitle>Subscription paused</AlertTitle>
          <AlertDescription>
            Your subscription is currently paused. Resume anytime to regain access to premium features.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              {hasSubscription && subscription.status && (
                <Badge variant={statusConfig[subscription.status].variant}>
                  {(() => {
                    const Icon = statusConfig[subscription.status].icon
                    return <Icon className="mr-1 h-3 w-3" />
                  })()}
                  {statusConfig[subscription.status].label}
                </Badge>
              )}
              {!hasSubscription && (
                <Badge variant="secondary">Free Plan</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasSubscription && subscription.plan && subscription.price ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">
                    {formatCurrency(subscription.price.amount, subscription.price.currency)}
                  </span>
                  <span className="text-muted-foreground">
                    {getBillingCycleLabel(subscription.price.billingCycle)}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Current period: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  {subscription.trialEnd && subscription.status === 'TRIALING' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Trial ends: {formatDate(subscription.trialEnd)}</span>
                    </div>
                  )}
                </div>

                {/* Plan Features */}
                {subscription.plan.features && subscription.plan.features.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Included in your plan:</p>
                    <div className="grid gap-1">
                      {subscription.plan.features
                        .filter((f) => f.limitValue !== 0 && f.limitValue !== null)
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .slice(0, 6)
                        .map((feature) => (
                          <div key={feature.id} className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                              <span>{feature.featureName}</span>
                            </div>
                            <span className="text-xs">
                              {feature.limitType === 'BOOLEAN'
                                ? (feature.limitValue === 1 ? 'Yes' : 'No')
                                : feature.limitType === 'UNLIMITED'
                                ? 'Unlimited'
                                : feature.limitValue}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">Free</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upgrade to get more portfolio images, featured listings, and grow your business.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {/* Upgrade Button */}
            {hasHigherPlans && (
              <Button onClick={() => setUpgradeModalOpen(true)} className="flex-1">
                <ArrowUp className="mr-2 h-4 w-4" />
                Upgrade
              </Button>
            )}

            {/* Downgrade Button */}
            {hasLowerPlans && isActive && (
              <Button variant="outline" onClick={() => setDowngradeModalOpen(true)}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Downgrade
              </Button>
            )}

            {/* Reactivate Button (for cancelled subscriptions) */}
            {isCancelled && !isPaused && (
              <Button
                variant="outline"
                onClick={handleReactivateSubscription}
                disabled={reactivateMutation.isPending}
              >
                {reactivateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Reactivate
              </Button>
            )}

            {/* Pause/Resume Buttons */}
            {isActive && !isCancelled && (
              <Button variant="outline" onClick={() => setPauseModalOpen(true)}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}

            {isPaused && (
              <ResumeSubscriptionButton
                subscription={subscription}
                onResume={handleResumeSubscription}
                isLoading={resumeMutation.isPending}
                variant="outline"
              />
            )}

            {/* Cancel Button */}
            {hasSubscription && isActive && !isCancelled && (
              <Button variant="ghost" onClick={() => setCancelModalOpen(true)}>
                Cancel
              </Button>
            )}

            {/* View All Plans */}
            {!hasSubscription && (
              <Button onClick={() => router.push('/pricing')} className="flex-1">
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Now
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Ad Credits Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Ad Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {adCreditsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : adCredits ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{adCredits.balance.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Available credits</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use ad credits to boost your profile, promote albums, and get featured listings.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Coins className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">0</p>
                  <p className="text-sm text-muted-foreground">No credits available</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/business/marketing/campaigns')}>
              <Sparkles className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
            <Button variant="outline" onClick={() => router.push('/business/marketing/credits')}>
              Buy Credits
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Subscription Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/pricing')}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Compare Plans</span>
            </Button>

            {hasHigherPlans && (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setUpgradeModalOpen(true)}
              >
                <ArrowUp className="h-5 w-5 text-primary" />
                <span>Upgrade Plan</span>
              </Button>
            )}

            {hasLowerPlans && isActive && (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setDowngradeModalOpen(true)}
              >
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
                <span>Downgrade Plan</span>
              </Button>
            )}

            {isActive && !isCancelled && (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setPauseModalOpen(true)}
              >
                <Pause className="h-5 w-5 text-primary" />
                <span>Pause Subscription</span>
              </Button>
            )}

            {isPaused && (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={handleResumeSubscription}
                disabled={resumeMutation.isPending}
              >
                {resumeMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 text-primary" />
                )}
                <span>Resume Subscription</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feature Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2 p-4 rounded-lg border">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : usageData && usageData.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {usageData.map((feature: FeatureLimitStatus) => {
                const percentage = feature.isUnlimited ? 0 : Math.min((feature.used / feature.limit) * 100, 100)
                const isNearLimit = !feature.isUnlimited && percentage >= 80
                const isAtLimit = !feature.isUnlimited && percentage >= 100

                return (
                  <div key={feature.featureKey} className="space-y-2 p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{getFeatureDisplayName(feature.featureKey)}</span>
                      {isAtLimit && (
                        <Badge variant="destructive" className="text-xs">Limit reached</Badge>
                      )}
                      {isNearLimit && !isAtLimit && (
                        <Badge variant="secondary" className="text-xs">Near limit</Badge>
                      )}
                    </div>
                    {!feature.isUnlimited && (
                      <Progress
                        value={percentage}
                        className="h-2"
                        indicatorClassName={
                          isAtLimit
                            ? 'bg-destructive'
                            : undefined
                        }
                      />
                    )}
                    <p className={`text-xs ${isAtLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {feature.isUnlimited ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          Unlimited
                        </span>
                      ) : (
                        `${feature.used} of ${feature.limit} used`
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No usage data available</p>
            </div>
          )}
        </CardContent>
        {usageData && usageData.some((f: FeatureLimitStatus) => !f.isUnlimited && (f.used / f.limit) >= 0.8) && (
          <CardFooter>
            <Button variant="outline" onClick={() => setUpgradeModalOpen(true)} className="w-full">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Upgrade for higher limits
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Payment Method Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Pay securely with Razorpay</p>
                <p className="text-sm text-muted-foreground">
                  Cards, UPI, Net Banking & more supported. Pay when you upgrade or purchase credits.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/pricing')}>
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ad Credits Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Ad Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adCreditsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold">{(adCredits?.balance || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">credits available</p>
              </div>
              <Link href="/business/marketing/credits">
                <Button variant="outline">
                  <Coins className="mr-2 h-4 w-4" />
                  Manage Credits
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Billing History</h2>
        <DataTable<PaymentRecord & { purpose?: string }>
          data={paymentHistory}
          isLoading={paymentsLoading}
          rowKey={(p) => p.id}
          exportFilename="billing-history"
          emptyTitle="No billing history available"
          emptyIcon={History}
          columns={[
            {
              id: 'purpose',
              header: 'Description',
              label: 'Description',
              exportValue: (p) => p.purpose,
              cell: (p) => (
                <TwoLineCell
                  title={
                    p.purpose === 'SUBSCRIPTION'
                      ? 'Subscription Payment'
                      : p.purpose === 'AD_CREDITS'
                        ? 'Ad Credits Purchase'
                        : p.purpose
                  }
                  subtitle={format(new Date(p.createdAt), 'MMM d, yyyy')}
                />
              ),
            },
            {
              id: 'date',
              header: 'Date',
              label: 'Date',
              hideBelow: 'sm',
              sortValue: (p) => new Date(p.createdAt),
              exportValue: (p) => p.createdAt,
              cell: (p) => <span className="text-sm">{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>,
            },
            {
              id: 'amount',
              header: 'Amount',
              label: 'Amount',
              align: 'right',
              sortValue: (p) => p.amount,
              exportValue: (p) => p.amount,
              cell: (p) => <span className="text-sm font-medium">{formatCurrency(p.amount, p.currency || 'INR')}</span>,
            },
            {
              id: 'status',
              header: 'Status',
              label: 'Status',
              sortValue: (p) => p.status,
              exportValue: (p) => p.status,
              cell: (p) => <StatusBadge status={p.status} />,
            },
          ]}
        />
      </div>

      {/* Modals */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentSubscription={subscription || null}
        availablePlans={availablePlans}
        onUpgrade={handleUpgrade}
        isLoading={upgradeMutation.isPending}
        variant="vendor"
      />

      <DowngradeModal
        open={downgradeModalOpen}
        onOpenChange={setDowngradeModalOpen}
        currentSubscription={subscription || null}
        availablePlans={availablePlans}
        onDowngrade={handleDowngrade}
        isLoading={downgradeMutation.isPending}
        variant="vendor"
      />

      <CancelModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        subscription={subscription || null}
        onCancel={handleCancelSubscription}
        isLoading={cancelMutation.isPending}
        showRetentionOffer={false}
      />

      <PauseSubscriptionModal
        open={pauseModalOpen}
        onOpenChange={setPauseModalOpen}
        subscription={subscription || null}
        onPause={handlePauseSubscription}
        isLoading={pauseMutation.isPending}
      />
    </div>
  )
}
