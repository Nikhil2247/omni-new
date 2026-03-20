'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useRazorpay } from '@/hooks/use-razorpay';
import { PaymentPurpose } from '@/lib/api/types/payment.types';

// Format currency helper
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'subscription' | 'credits';
  // For subscription
  plan?: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
    features: string[];
  };
  // For credits
  credits?: {
    amount: number;
    price: number;
  };
  userDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess?: (paymentId: string, subscriptionId?: string, creditsGranted?: number) => void;
  isBusinessPayment?: boolean;
}

export function CheckoutModal({
  isOpen,
  onClose,
  type,
  plan,
  credits,
  userDetails,
  onSuccess,
  isBusinessPayment = false,
}: CheckoutModalProps) {
  const { isProcessing, payForSubscription, payForCredits } = useRazorpay({
    isBusinessPayment,
    onSuccess: (paymentId, subscriptionId, creditsGranted) => {
      onSuccess?.(paymentId, subscriptionId, creditsGranted);
      onClose();
    },
    onDismiss: () => {
      // User closed the checkout modal
    },
  });

  const handlePayment = async () => {
    if (type === 'subscription' && plan) {
      await payForSubscription(plan.id, plan.price, {
        name: userDetails?.name,
        email: userDetails?.email,
        contact: userDetails?.phone,
      });
    } else if (type === 'credits' && credits) {
      await payForCredits(credits.amount, credits.price, {
        name: userDetails?.name,
        email: userDetails?.email,
        contact: userDetails?.phone,
      });
    }
  };

  const price = type === 'subscription' ? plan?.price : credits?.price;
  const title = type === 'subscription' ? `Subscribe to ${plan?.name}` : `Purchase ${credits?.amount} Credits`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Complete your payment securely with Razorpay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium">Order Summary</h4>

            {type === 'subscription' && plan && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{plan.name} Plan</span>
                  <Badge variant="secondary">{plan.billingCycle}</Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {type === 'credits' && credits && (
              <div className="flex justify-between">
                <span>{credits.amount} Ad Credits</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(price || 0, 'INR')}</span>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secured by Razorpay. Your payment information is encrypted.</span>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {formatCurrency(price || 0, 'INR')}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
