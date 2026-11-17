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
  RefreshCw,
  History,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useUserSubscription,
  useUserUsage,
  useCancelSubscription,
  useReactivateSubscription,
} from '@/hooks/queries/use-subscription'
import type {
  SubscriptionStatus,
  UserSubscription,
  UserSubscriptionStatusResponse,
  FeatureLimitStatus,
} from '@/lib/api/types/subscription.types'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { trackDashboard } from '@/lib/analytics/umami'

// Helper to check if response is a full subscription
function isUserSubscription(
  data: UserSubscription | UserSubscriptionStatusResponse
): data is UserSubscription {
  return 'id' in data && 'planId' in data
}

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

// Feature key to display name
function getFeatureDisplayName(key: string): string {
  const names: Record<string, string> = {
    events: 'Events',
    guests_per_event: 'Guests per Event',
    vendors_per_event: 'Vendors per Event',
    photo_storage: 'Photo Storage (GB)',
    budget_tracking: 'Budget Tracking',
    checklist_items: 'Checklist Items',
    timeline_entries: 'Timeline Entries',
    vendor_messages: 'Vendor Messages',
    priority_support: 'Priority Support',
  }
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function UserSubscriptionSettingsPage() {
  const router = useRouter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data: subscriptionData, isLoading: subscriptionLoading, error: subscriptionError } = useUserSubscription()
  const { data: usageData, isLoading: usageLoading } = useUserUsage()
  const cancelMutation = useCancelSubscription()
  const reactivateMutation = useReactivateSubscription()

  useEffect(() => {
    trackDashboard.sectionView('settings', 'subscription')
  }, [])

  // Determine if user has an active subscription
  const hasSubscription = subscriptionData && isUserSubscription(subscriptionData)
  const subscription = hasSubscription ? subscriptionData : null
  const freeStatus = !hasSubscription && subscriptionData ? (subscriptionData as UserSubscriptionStatusResponse) : null

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    try {
      await cancelMutation.mutateAsync({ reason: cancelReason })
      toast.success('Subscription cancelled', {
        description: 'Your subscription will remain active until the end of the billing period.',
      })
      setCancelDialogOpen(false)
      setCancelReason('')
    } catch (error) {
      toast.error('Failed to cancel subscription', {
        description: 'Please try again or contact support.',
      })
    }
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

  // Loading state
  if (subscriptionLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
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
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing.</p>
        </div>
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing.</p>
      </div>

      {/* Cancellation Warning */}
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

      {/* Trial Notice */}
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              {subscription && (
                <Badge variant={statusConfig[subscription.status].variant}>
                  {(() => {
                    const Icon = statusConfig[subscription.status].icon
                    return <Icon className="mr-1 h-3 w-3" />
                  })()}
                  {statusConfig[subscription.status].label}
                </Badge>
              )}
              {freeStatus && (
                <Badge variant="secondary">Free Plan</Badge>
              )}
            </div>
            <CardDescription>
              {subscription
                ? `You're on the ${subscription.plan?.name || 'Unknown'} plan`
                : 'You are currently on the free plan'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.plan && subscription.price ? (
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
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">Free</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock more events, guests, and premium features.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={() => router.push('/pricing')} className="flex-1">
              <TrendingUp className="mr-2 h-4 w-4" />
              {subscription ? 'Change Plan' : 'Upgrade Now'}
            </Button>
            {subscription?.cancelAtPeriodEnd ? (
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
            ) : subscription && subscription.status === 'ACTIVE' ? (
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel your subscription? You&apos;ll continue to have access until the end of your billing period on {subscription && formatDate(subscription.currentPeriodEnd)}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="cancelReason" className="text-sm font-medium">
                        Reason for cancelling (optional)
                      </label>
                      <textarea
                        id="cancelReason"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Tell us why you're leaving..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                      Keep Subscription
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Cancel Subscription
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </CardFooter>
        </Card>

        {/* Usage Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage
            </CardTitle>
            <CardDescription>Your current feature usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : usageData && usageData.length > 0 ? (
              usageData.map((feature: FeatureLimitStatus) => {
                const percentage = feature.isUnlimited ? 0 : Math.min((feature.used / feature.limit) * 100, 100)
                const isNearLimit = !feature.isUnlimited && percentage >= 80
                const isAtLimit = !feature.isUnlimited && percentage >= 100

                return (
                  <div key={feature.featureKey} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{getFeatureDisplayName(feature.featureKey)}</span>
                      <span className={isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-600' : 'text-muted-foreground'}>
                        {feature.isUnlimited ? (
                          'Unlimited'
                        ) : (
                          `${feature.used} / ${feature.limit}`
                        )}
                      </span>
                    </div>
                    {!feature.isUnlimited && (
                      <Progress
                        value={percentage}
                        className="h-2"
                        indicatorClassName={
                          isAtLimit
                            ? 'bg-destructive'
                            : isNearLimit
                            ? 'bg-amber-500'
                            : undefined
                        }
                      />
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No usage data available.</p>
            )}
          </CardContent>
          {usageData && usageData.some((f: FeatureLimitStatus) => !f.isUnlimited && (f.used / f.limit) >= 0.8) && (
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => router.push('/pricing')} className="w-full">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Upgrade for more
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Payment Method Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Payment is handled securely via Razorpay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Pay securely with Razorpay</p>
                <p className="text-sm text-muted-foreground">
                  Cards, UPI, Net Banking & more supported. Pay when you upgrade.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/pricing')}>
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History Card (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>View your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No billing history available</p>
            <p className="text-sm text-muted-foreground">Your invoices will appear here once you subscribe to a paid plan.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
