'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentService, businessPaymentService } from '@/lib/api/services/payment.service';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  RazorpayOptions,
  RazorpayResponse,
  RazorpayError,
  PaymentPurpose,
} from '@/lib/api/types/payment.types';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

interface UseRazorpayOptions {
  isBusinessPayment?: boolean;
  onSuccess?: (paymentId: string, subscriptionId?: string, creditsGranted?: number) => void;
  onFailure?: (error: RazorpayError) => void;
  onDismiss?: () => void;
}

export function useRazorpay(options: UseRazorpayOptions = {}) {
  const { isBusinessPayment = false, onSuccess, onFailure, onDismiss } = options;
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const service = isBusinessPayment ? businessPaymentService : paymentService;

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      existingScript.addEventListener('error', () => {
        setScriptError(true);
        toast.error('Failed to load payment gateway. Please refresh and try again.');
      });
      return;
    }

    // Create new script
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      setIsScriptLoaded(true);
      setScriptError(false);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setScriptError(true);
      toast.error('Failed to load payment gateway. Please refresh and try again.');
    };
    document.body.appendChild(script);
  }, []);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => service.createOrder(data),
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; planId?: string; credits?: number }) =>
      service.verifyPayment(data),
  });

  const openCheckout = useCallback(
    async (
      orderData: CreateOrderRequest,
      checkoutOptions: {
        name?: string;
        description?: string;
        prefill?: { name?: string; email?: string; contact?: string };
        themeColor?: string;
      } = {}
    ) => {
      if (!isScriptLoaded) {
        toast.info('Payment gateway is loading...');
        return;
      }

      setIsProcessing(true);

      try {
        // Create order on backend
        const order = await createOrderMutation.mutateAsync(orderData);

        if (!order?.keyId) {
          toast.error('Payment gateway configuration error. Please contact support.');
          setIsProcessing(false);
          return;
        }

        // Configure Razorpay options
        const razorpayOptions: RazorpayOptions = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: checkoutOptions.name || 'Omnicassion',
          description: checkoutOptions.description || 'Payment',
          order_id: order.orderId,
          prefill: checkoutOptions.prefill,
          theme: {
            color: checkoutOptions.themeColor || '#6366f1',
          },
          handler: async (response: RazorpayResponse) => {
            try {
              // Verify payment on backend
              const result = await verifyPaymentMutation.mutateAsync({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: order.planId,
                credits: order.credits,
              });

              if (result.success) {
                toast.success(result.message || 'Your payment has been processed successfully.');
                onSuccess?.(result.paymentId, result.subscriptionId, result.creditsGranted);
              } else {
                toast.error(result.message || 'Please contact support if amount was deducted.');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment may have succeeded. Please check your account or contact support.');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              onDismiss?.();
            },
            escape: true,
            animation: true,
          },
        };

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(razorpayOptions);

        razorpay.on('payment.failed', (response: RazorpayError) => {
          setIsProcessing(false);
          toast.error(response.description || 'Your payment could not be processed.');
          onFailure?.(response);
        });

        razorpay.open();
      } catch (error: any) {
        setIsProcessing(false);
        console.error('Failed to create order:', error);

        // Extract error message from API response
        const errorMessage = error?.response?.data?.message
          || error?.message
          || 'Failed to initiate payment. Please try again.';

        toast.error(errorMessage);
      }
    },
    [isScriptLoaded, createOrderMutation, verifyPaymentMutation, onSuccess, onFailure, onDismiss]
  );

  // Helper functions for common payment scenarios
  const payForSubscription = useCallback(
    (planId: string, amount: number, userDetails?: { name?: string; email?: string; contact?: string }) => {
      return openCheckout(
        {
          amount: Math.round(amount * 100), // Convert rupees to paise
          currency: 'INR',
          purpose: PaymentPurpose.SUBSCRIPTION,
          planId,
        },
        {
          name: 'Omnicassion',
          description: 'Subscription Payment',
          prefill: userDetails,
        }
      );
    },
    [openCheckout]
  );

  const payForCredits = useCallback(
    (credits: number, amount: number, userDetails?: { name?: string; email?: string; contact?: string }) => {
      return openCheckout(
        {
          amount: Math.round(amount * 100), // Convert rupees to paise
          currency: 'INR',
          purpose: PaymentPurpose.AD_CREDITS,
          credits,
        },
        {
          name: 'Omnicassion',
          description: `Purchase ${credits} Ad Credits`,
          prefill: userDetails,
        }
      );
    },
    [openCheckout]
  );

  return {
    isScriptLoaded,
    scriptError,
    isProcessing,
    isCreatingOrder: createOrderMutation.isPending,
    isVerifying: verifyPaymentMutation.isPending,
    openCheckout,
    payForSubscription,
    payForCredits,
  };
}
