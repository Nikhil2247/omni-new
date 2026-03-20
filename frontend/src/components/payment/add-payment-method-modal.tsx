'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import {
  CreditCard,
  Smartphone,
  Loader2,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethodType, AddPaymentMethodDto } from '@/lib/api/types/payment-method.types';
import { useRazorpay } from '@/hooks/use-razorpay';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPaymentMethod: (data: AddPaymentMethodDto) => void;
  isLoading: boolean;
  isBusinessPayment?: boolean;
}

type MethodTypeOption = {
  type: PaymentMethodType;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const methodTypes: MethodTypeOption[] = [
  {
    type: 'CARD',
    label: 'Credit/Debit Card',
    description: 'Add a card for future payments',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    type: 'UPI',
    label: 'UPI',
    description: 'Link your UPI ID',
    icon: <Smartphone className="h-5 w-5" />,
  },
];

// Simple UPI ID validation
function isValidUpiId(upiId: string): boolean {
  // UPI ID format: username@provider
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiRegex.test(upiId);
}

export function AddPaymentMethodModal({
  isOpen,
  onClose,
  onAddPaymentMethod,
  isLoading,
  isBusinessPayment = false,
}: AddPaymentMethodModalProps) {
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('CARD');
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  const { isScriptLoaded, openCheckout } = useRazorpay({
    isBusinessPayment,
    onSuccess: (paymentId) => {
      // Card was successfully tokenized via Razorpay
      // The backend should have created the payment method
      onClose();
    },
    onDismiss: () => {
      setIsProcessingCard(false);
    },
  });

  const handleClose = () => {
    setSelectedType('CARD');
    setUpiId('');
    setUpiError('');
    setIsProcessingCard(false);
    onClose();
  };

  const handleAddCard = async () => {
    if (!isScriptLoaded) {
      return;
    }

    setIsProcessingCard(true);

    // For card tokenization, we'll use Razorpay's checkout with a minimal amount
    // The backend will handle the actual tokenization
    // In a real implementation, you might use Razorpay's saved cards feature
    // For now, we'll create a simple flow that opens the checkout
    try {
      await openCheckout(
        {
          amount: 100, // Minimal amount in paise (1 rupee) for tokenization
          currency: 'INR',
          purpose: 'SUBSCRIPTION' as any, // Using subscription purpose for tokenization
        },
        {
          name: 'Omnicassion',
          description: 'Save card for future payments',
          themeColor: '#6366f1',
        }
      );
    } catch (error) {
      console.error('Failed to initiate card tokenization:', error);
      setIsProcessingCard(false);
    }
  };

  const handleAddUpi = () => {
    setUpiError('');

    if (!upiId.trim()) {
      setUpiError('Please enter your UPI ID');
      return;
    }

    if (!isValidUpiId(upiId.trim())) {
      setUpiError('Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }

    onAddPaymentMethod({
      type: 'UPI',
      upiId: upiId.trim(),
    });
  };

  const handleSubmit = () => {
    if (selectedType === 'CARD') {
      handleAddCard();
    } else if (selectedType === 'UPI') {
      handleAddUpi();
    }
  };

  const isSubmitDisabled = isLoading || isProcessingCard || (selectedType === 'CARD' && !isScriptLoaded);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method for faster checkouts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Method Type Selection */}
          <div className="space-y-3">
            <Label>Select Payment Method Type</Label>
            <RadioGroup
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as PaymentMethodType)}
              className="grid gap-3"
            >
              {methodTypes.map((option) => (
                <label
                  key={option.type}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                    selectedType === option.type
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethodType"
                    value={option.type}
                    checked={selectedType === option.type}
                    onChange={() => setSelectedType(option.type)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      selectedType === option.type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {selectedType === option.type && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* UPI ID Input */}
          {selectedType === 'UPI' && (
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setUpiError('');
                }}
                className={cn(upiError && 'border-destructive')}
              />
              {upiError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {upiError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your UPI ID linked to your bank account
              </p>
            </div>
          )}

          {/* Card Info */}
          {selectedType === 'CARD' && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Secure Card Tokenization</p>
                  <p className="text-xs text-muted-foreground">
                    Your card details are securely tokenized through Razorpay.
                    We never store your full card number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading || isProcessingCard}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isLoading || isProcessingCard ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {selectedType === 'CARD' ? 'Opening Razorpay...' : 'Adding...'}
              </>
            ) : (
              <>
                {selectedType === 'CARD' ? (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Card
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Add UPI
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
