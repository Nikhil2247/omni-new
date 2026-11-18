'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Chip, Ico, ICONS, Paper, SketchButton, SkContainer, Stamp } from '@/components/sketch';
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
      <SkContainer className="py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16" aria-busy="true">
          <Skeleton className="h-[500px] rounded-[18px]" />
          <Skeleton className="h-[400px] rounded-[18px]" />
        </div>
      </SkContainer>
    );
  }

  // Check if we have a valid item to purchase
  const hasValidItem = isEventCreditPurchase ? !!selectedProduct : !!selectedPlan;

  if (!hasValidItem) {
    return (
      <SkContainer className="max-w-md py-12">
        <Paper className="px-6 py-10 text-center">
          <Ico d={isEventCreditPurchase ? ICONS.wallet : ICONS.card} className="mx-auto mb-3 h-12 w-12" />
          <h2 className="font-display text-2xl font-semibold">
            {isEventCreditPurchase ? 'Product not found' : 'Plan not found'}
          </h2>
          <p className="text-ink-soft mt-2 mb-6">
            {isEventCreditPurchase
              ? 'The event credit package you\'re looking for doesn\'t exist or is no longer available.'
              : 'The subscription plan you\'re looking for doesn\'t exist or is no longer available.'}
          </p>
          <SketchButton asChild className="w-full">
            <Link href="/pricing">View Available Plans</Link>
          </SketchButton>
        </Paper>
      </SkContainer>
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
    <SkContainer className="py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <SketchButton variant="ghost" size="sm" asChild>
          <Link href="/pricing">
            <ArrowLeft className="h-4 w-4" />
            Back to pricing
          </Link>
        </SketchButton>
        <div className="text-ink-soft flex items-center gap-2 text-sm font-bold">
          <Lock className="h-4 w-4" />
          <span>Secure checkout</span>
        </div>
      </div>

      {/* Main Content */}
      <main>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Plan Details */}
          <div className="order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              {/* Plan/Product Card */}
              <Paper tape className="px-5 py-6 sm:px-8 sm:py-8">
                {/* Badge */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="bg-blue-wash border-ink flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2">
                    {isEventCreditPurchase ? (
                      <Coins className="text-blue h-6 w-6" />
                    ) : (
                      <Sparkles className="text-blue h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-semibold tracking-tight">{displayName}</h1>
                      {!isEventCreditPurchase && selectedPlan?.isPopular && (
                        <Stamp>Popular</Stamp>
                      )}
                      {isEventCreditPurchase && selectedProduct!.tier === 'PREMIUM' && (
                        <Stamp tone="wait">Premium</Stamp>
                      )}
                    </div>
                    <p className="text-ink-soft text-sm">
                      {isEventCreditPurchase
                        ? `${getTierLabel(selectedProduct!.tier)} Tier - ${getBundleLabel(selectedProduct!.bundleType)}`
                        : (isVendor ? 'Business' : 'Personal') + ' Subscription'}
                    </p>
                  </div>
                </div>

                {/* Price Display */}
                <Paper alt className="mb-6 px-5 py-5">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-semibold tracking-tight lg:text-5xl">
                      {formatCurrency(displayAmount)}
                    </span>
                    {!isEventCreditPurchase && (
                      <span className="text-ink-soft text-lg">
                        /{getBillingLabel(billingCycle)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isEventCreditPurchase ? (
                      <>
                        <Chip>One-time purchase</Chip>
                        {productSavingsText && <Stamp>{productSavingsText}</Stamp>}
                      </>
                    ) : (
                      <>
                        <Chip>{getBillingPeriodLabel(billingCycle)}</Chip>
                        {savingsText && <Stamp>{savingsText}</Stamp>}
                      </>
                    )}
                  </div>
                </Paper>

                {/* Features List */}
                <div className="space-y-3">
                  <h3 className="sk-eyebrow">
                    {isEventCreditPurchase ? 'Features per event' : "What's included"}
                  </h3>
                  <ul className="space-y-3">
                    {isEventCreditPurchase ? (
                      (displayFeatures as string[]).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="bg-blue-wash mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                            <Check className="text-blue h-3 w-3" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))
                    ) : (
                      (displayFeatures as any[]).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="bg-blue-wash mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                            <Check className="text-blue h-3 w-3" />
                          </div>
                          <span className="text-sm">
                            {feature.name}
                            {feature.displayValue && feature.displayValue !== 'Yes' && feature.displayValue !== '-' && (
                              <span className="text-ink-soft ml-1">({feature.displayValue})</span>
                            )}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Description / Credits Info */}
                {isEventCreditPurchase ? (
                  <div className="border-line mt-6 border-t-2 border-dashed pt-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="text-leaf-deep h-4 w-4" />
                      <span className="text-ink-soft">
                        Credits never expire - use them whenever you&apos;re ready!
                      </span>
                    </div>
                  </div>
                ) : selectedPlan?.description ? (
                  <p className="text-ink-soft border-line mt-6 border-t-2 border-dashed pt-6 text-sm">
                    {selectedPlan.description}
                  </p>
                ) : null}
              </Paper>

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
                <Paper alt className="flex flex-col items-center p-3 text-center sm:p-4">
                  <Shield className="text-blue mb-2 h-6 w-6" />
                  <span className="text-xs font-bold">Secure Payment</span>
                </Paper>
                <Paper alt className="flex flex-col items-center p-3 text-center sm:p-4">
                  <Zap className="text-blue mb-2 h-6 w-6" />
                  <span className="text-xs font-bold">Instant Access</span>
                </Paper>
                <Paper alt className="flex flex-col items-center p-3 text-center sm:p-4">
                  {isEventCreditPurchase ? (
                    <Gift className="text-blue mb-2 h-6 w-6" />
                  ) : (
                    <CreditCard className="text-blue mb-2 h-6 w-6" />
                  )}
                  <span className="text-xs font-bold">
                    {isEventCreditPurchase ? 'Never Expires' : 'Cancel Anytime'}
                  </span>
                </Paper>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="order-1 lg:order-2">
            <Paper className="px-5 py-6 sm:px-8 sm:py-8">
              <h2 className="font-display mb-6 text-xl font-semibold">Complete your purchase</h2>

              {/* Account Info */}
              {user && (
                <Paper alt className="mb-6 px-4 py-4">
                  <p className="sk-eyebrow mb-1">
                    {isVendor ? 'Business Account' : 'Account'}
                  </p>
                  <p className="font-bold">{user.name || 'User'}</p>
                  <p className="text-ink-soft text-sm">{user.email}</p>
                </Paper>
              )}

              {/* Order Summary */}
              <div className="mb-6 space-y-4">
                <h3 className="font-display font-semibold">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-soft">
                      {isEventCreditPurchase
                        ? `${displayName} (${getBundleLabel(selectedProduct!.bundleType)})`
                        : `${selectedPlan!.name} (${getBillingPeriodLabel(billingCycle)})`}
                    </span>
                    <span className="font-bold">{formatCurrency(displayAmount)}</span>
                  </div>
                  {(isEventCreditPurchase ? productSavingsText : savingsText) && (
                    <div className="text-leaf-deep flex justify-between font-bold">
                      <span>Discount</span>
                      <span>{isEventCreditPurchase ? productSavingsText : savingsText}</span>
                    </div>
                  )}
                  <div className="border-line mt-3 border-t-2 border-dashed pt-3">
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(displayAmount)}</span>
                    </div>
                    <p className="text-ink-soft mt-1 text-xs">
                      {isEventCreditPurchase
                        ? 'One-time payment'
                        : `Billed ${getBillingPeriodLabel(billingCycle).toLowerCase()}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h3 className="font-display mb-3 font-semibold">Payment Method</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {['Card', 'UPI', 'NetBanking', 'Wallet'].map((method) => (
                    <Chip key={method} className="text-ink-soft text-center">
                      {method}
                    </Chip>
                  ))}
                </div>
                <p className="text-ink-soft mt-2 text-xs">
                  Select your preferred payment method on the next screen
                </p>
              </div>

              {/* Pay Button */}
              <SketchButton
                onClick={handleCheckout}
                disabled={isProcessing || !isScriptLoaded || scriptError}
                className={cn('w-full text-base', scriptError && 'bg-rose')}
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
              </SketchButton>

              {/* Security Info */}
              <div className="mt-6 text-center">
                <div className="text-ink-soft mb-2 flex items-center justify-center gap-2 text-xs">
                  <Shield className="h-4 w-4" />
                  <span>256-bit SSL Encrypted Payment</span>
                </div>
                <p className="text-ink-soft text-xs">
                  Powered by Razorpay. Your payment information is secure.
                </p>
              </div>

              {/* Terms */}
              <p className="text-ink-soft border-line mt-6 border-t-2 border-dashed pt-6 text-center text-xs leading-relaxed">
                By completing this purchase, you agree to our{' '}
                <Link href="/terms" className="hover:text-ink underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="hover:text-ink underline">
                  Privacy Policy
                </Link>
                .{' '}
                {isEventCreditPurchase
                  ? 'Event credits never expire and can be used anytime.'
                  : 'You can cancel your subscription at any time from your account settings.'}
              </p>
            </Paper>

            {/* Help Section */}
            <Paper alt className="mt-6 p-4 text-center">
              <p className="text-ink-soft text-sm">
                Need help?{' '}
                <Link href="/contact" className="text-blue font-bold hover:underline">
                  Contact Support
                </Link>
              </p>
            </Paper>
          </div>
        </div>
      </main>
    </SkContainer>
  );
}
