'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Zap,
  Coins,
  Gift,
} from 'lucide-react';
import { useVendorPlans, useUserPlans, useEventCreditProducts } from '@/hooks/queries/use-subscription';
import { useRazorpay } from '@/hooks/use-razorpay';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { EventCreditProduct } from '@/lib/api/types/subscription.types';

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getBillingLabel(cycle: string): string {
  switch (cycle) {
    case 'YEARLY': return 'year';
    case 'QUARTERLY': return 'quarter';
    case 'LIFETIME': return 'one-time';
    default: return 'month';
  }
}

function getBillingPeriodLabel(cycle: string): string {
  switch (cycle) {
    case 'YEARLY': return 'Yearly';
    case 'QUARTERLY': return 'Quarterly';
    case 'LIFETIME': return 'Lifetime';
    default: return 'Monthly';
  }
}

function getSavingsText(cycle: string): string | null {
  switch (cycle) {
    case 'YEARLY': return 'Save 2 months';
    case 'QUARTERLY': return 'Save 17%';
    default: return null;
  }
}

function getBundleLabel(bundleType: string): string {
  switch (bundleType) {
    case 'SINGLE': return '1 Event';
    case 'FIVE_PACK': return '5 Events';
    case 'TEN_PACK': return '10 Events';
    default: return bundleType;
  }
}

function getTierLabel(tier: string): string {
  return tier === 'BASIC' ? 'Basic' : 'Premium';
}

function getProductDescription(product: EventCreditProduct): string {
  const tierLabel = getTierLabel(product.tier);
  const bundleLabel = getBundleLabel(product.bundleType);
  return `${product.creditCount} ${tierLabel} Event Credit${product.creditCount > 1 ? 's' : ''}`;
}

function getProductFeatures(tier: string): string[] {
  if (tier === 'BASIC') {
    return [
      'Up to 200 guests per event',
      '100 memory uploads',
      '1 GB storage',
      '200 WhatsApp invites',
      'RSVP tracking',
    ];
  }
  return [
    'Unlimited guests',
    'Unlimited memory uploads',
    '10 GB storage',
    'Unlimited WhatsApp invites',
    'Custom invite templates',
    'Priority support',
  ];
}

export default function UnifiedCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const productId = searchParams.get('product'); // Event credit product ID
  const billingCycle = searchParams.get('billing') || 'MONTHLY';
  const type = searchParams.get('type');

  const { user, isAuthenticated } = useAuth();
  const isVendor = user?.role === 'BUSINESS_ADMIN' || type === 'vendor';
  const isEventCreditPurchase = !!productId;

  const { data: vendorPlans, isLoading: vendorLoading } = useVendorPlans();
  const { data: userPlans, isLoading: userLoading } = useUserPlans();
  const { data: eventCreditProducts, isLoading: productsLoading } = useEventCreditProducts();

  const plans = isVendor ? vendorPlans : userPlans;
  const isLoading = isVendor ? vendorLoading : (isEventCreditPurchase ? productsLoading : userLoading);

  const { isProcessing, payForSubscription, payForEventCredits, isScriptLoaded, scriptError } = useRazorpay({
    isBusinessPayment: isVendor,
    onSuccess: (paymentId, subscriptionId, creditsGranted) => {
      if (isEventCreditPurchase) {
        router.push(`/payment/success?paymentId=${paymentId}&credits=${creditsGranted || ''}`);
      } else {
        const successPath = isVendor
          ? `/business/payment/success?paymentId=${paymentId}&subscriptionId=${subscriptionId}`
          : `/payment/success?paymentId=${paymentId}&subscriptionId=${subscriptionId}`;
        router.push(successPath);
      }
    },
  });

  const selectedPlan = plans?.find(p => p.id === planId);
  const selectedPrice = selectedPlan?.allPrices?.find(p => p.billingCycle === billingCycle);
  const savingsText = getSavingsText(billingCycle);

  // Find selected event credit product
  const selectedProduct = eventCreditProducts?.find(p => p.id === productId);

  const handleCheckout = async () => {
    if (isEventCreditPurchase) {
      if (!selectedProduct) return;
      const description = getProductDescription(selectedProduct);
      await payForEventCredits(selectedProduct.id, selectedProduct.priceInr, description, {
        name: user?.name,
        email: user?.email,
        contact: undefined,
      });
    } else {
      if (!selectedPlan || !selectedPrice) return;
      await payForSubscription(selectedPlan.id, selectedPrice.amount, {
        name: user?.name,
        email: user?.email,
        contact: undefined,
      });
    }
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated && !isLoading) {
    const returnUrl = isEventCreditPurchase
      ? `/checkout?product=${productId}`
      : `/checkout?plan=${planId}&billing=${billingCycle}${type ? `&type=${type}` : ''}`;
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            <Skeleton className="h-[500px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Check if we have a valid item to purchase
  const hasValidItem = isEventCreditPurchase ? !!selectedProduct : !!selectedPlan;

  if (!hasValidItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <Card className="max-w-md mx-4 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              {isEventCreditPurchase ? (
                <Coins className="h-8 w-8 text-muted-foreground" />
              ) : (
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {isEventCreditPurchase ? 'Product not found' : 'Plan not found'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isEventCreditPurchase
                ? 'The event credit package you\'re looking for doesn\'t exist or is no longer available.'
                : 'The subscription plan you\'re looking for doesn\'t exist or is no longer available.'}
            </p>
            <Link href="/pricing">
              <Button className="w-full">View Available Plans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get display values based on purchase type
  const displayName = isEventCreditPurchase
    ? getProductDescription(selectedProduct!)
    : selectedPlan!.name;
  const displayAmount = isEventCreditPurchase
    ? selectedProduct!.priceInr
    : (selectedPrice?.amount || 0);
  const displayFeatures = isEventCreditPurchase
    ? getProductFeatures(selectedProduct!.tier)
    : (selectedPlan!.features?.slice(0, 6) || []);
  const productSavingsText = isEventCreditPurchase && selectedProduct!.discountPercent
    ? `Save ${selectedProduct!.discountPercent}%`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/pricing"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to pricing
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left Column - Plan Details */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-24">
              {/* Plan/Product Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-card/80 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-8 relative">
                  {/* Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isEventCreditPurchase
                        ? selectedProduct!.tier === 'BASIC'
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : 'bg-purple-100 dark:bg-purple-900'
                        : 'bg-primary/10'
                    )}>
                      {isEventCreditPurchase ? (
                        <Coins className={cn(
                          "h-6 w-6",
                          selectedProduct!.tier === 'BASIC'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-purple-600 dark:text-purple-400'
                        )} />
                      ) : (
                        <Sparkles className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{displayName}</h1>
                        {!isEventCreditPurchase && selectedPlan?.isPopular && (
                          <Badge variant="default" className="bg-primary">Popular</Badge>
                        )}
                        {isEventCreditPurchase && selectedProduct!.tier === 'PREMIUM' && (
                          <Badge variant="default" className="bg-purple-500">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isEventCreditPurchase
                          ? `${getTierLabel(selectedProduct!.tier)} Tier - ${getBundleLabel(selectedProduct!.bundleType)}`
                          : (isVendor ? 'Business' : 'Personal') + ' Subscription'}
                      </p>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="bg-muted/50 rounded-2xl p-6 mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl lg:text-5xl font-bold tracking-tight">
                        {formatCurrency(displayAmount)}
                      </span>
                      {!isEventCreditPurchase && (
                        <span className="text-lg text-muted-foreground">
                          /{getBillingLabel(billingCycle)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEventCreditPurchase ? (
                        <>
                          <Badge variant="outline" className="font-medium">
                            One-time purchase
                          </Badge>
                          {productSavingsText && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                              {productSavingsText}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="font-medium">
                            {getBillingPeriodLabel(billingCycle)}
                          </Badge>
                          {savingsText && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                              {savingsText}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {isEventCreditPurchase ? 'Features per event' : "What's included"}
                    </h3>
                    <ul className="space-y-3">
                      {isEventCreditPurchase ? (
                        displayFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                              selectedProduct!.tier === 'BASIC' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                            )}>
                              <Check className={cn(
                                "h-3 w-3",
                                selectedProduct!.tier === 'BASIC' ? 'text-blue-600' : 'text-purple-600'
                              )} />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))
                      ) : (
                        (displayFeatures as any[]).map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm">
                              {feature.name}
                              {feature.displayValue && feature.displayValue !== 'Yes' && feature.displayValue !== '-' && (
                                <span className="text-muted-foreground ml-1">({feature.displayValue})</span>
                              )}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  {/* Description / Credits Info */}
                  {isEventCreditPurchase ? (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className="h-4 w-4 text-emerald-600" />
                        <span className="text-muted-foreground">
                          Credits never expire - use them whenever you're ready!
                        </span>
                      </div>
                    </div>
                  ) : selectedPlan?.description ? (
                    <p className="text-sm text-muted-foreground mt-6 pt-6 border-t">
                      {selectedPlan.description}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border">
                  <Shield className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border">
                  <Zap className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium">Instant Access</span>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border">
                  {isEventCreditPurchase ? (
                    <Gift className="h-6 w-6 text-primary mb-2" />
                  ) : (
                    <CreditCard className="h-6 w-6 text-primary mb-2" />
                  )}
                  <span className="text-xs font-medium">
                    {isEventCreditPurchase ? 'Never Expires' : 'Cancel Anytime'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="order-1 lg:order-2">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-6">Complete your purchase</h2>

                {/* Account Info */}
                {user && (
                  <div className="bg-muted/50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {isVendor ? 'Business Account' : 'Account'}
                    </p>
                    <p className="font-medium">{user.name || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                )}

                {/* Order Summary */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {isEventCreditPurchase
                          ? `${displayName} (${getBundleLabel(selectedProduct!.bundleType)})`
                          : `${selectedPlan!.name} (${getBillingPeriodLabel(billingCycle)})`}
                      </span>
                      <span className="font-medium">{formatCurrency(displayAmount)}</span>
                    </div>
                    {(isEventCreditPurchase ? productSavingsText : savingsText) && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>{isEventCreditPurchase ? productSavingsText : savingsText}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(displayAmount)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isEventCreditPurchase
                          ? 'One-time payment'
                          : `Billed ${getBillingPeriodLabel(billingCycle).toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Payment Method</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {['Card', 'UPI', 'NetBanking', 'Wallet'].map((method) => (
                      <div
                        key={method}
                        className="border rounded-lg p-3 text-center text-xs font-medium text-muted-foreground"
                      >
                        {method}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Select your preferred payment method on the next screen
                  </p>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || !isScriptLoaded || scriptError}
                  className={cn(
                    "w-full h-12 text-base font-semibold transition-all",
                    scriptError
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                  )}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : scriptError ? (
                    <>
                      Payment unavailable - Refresh page
                    </>
                  ) : !isScriptLoaded ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading payment gateway...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Pay {formatCurrency(displayAmount)}
                    </>
                  )}
                </Button>

                {/* Security Info */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                    <Shield className="h-4 w-4" />
                    <span>256-bit SSL Encrypted Payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Powered by Razorpay. Your payment information is secure.
                  </p>
                </div>

                {/* Terms */}
                <p className="text-xs text-center text-muted-foreground mt-6 pt-6 border-t leading-relaxed">
                  By completing this purchase, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-foreground">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                  .{' '}
                  {isEventCreditPurchase
                    ? 'Event credits never expire and can be used anytime.'
                    : 'You can cancel your subscription at any time from your account settings.'}
                </p>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="mt-6 p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                Need help?{' '}
                <Link href="/contact" className="text-primary hover:underline font-medium">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
