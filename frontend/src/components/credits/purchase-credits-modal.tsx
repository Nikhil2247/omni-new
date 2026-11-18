'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coins, CheckCircle, Sparkles } from 'lucide-react';
import { useRazorpay } from '@/hooks/use-razorpay';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionKeys } from '@/hooks/queries/use-subscription';
import { cn } from '@/lib/utils';

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const creditPackages = [
  { credits: 1000, price: 999, popular: false, savings: 0 },
  { credits: 5000, price: 4499, popular: true, savings: 10 },
  { credits: 10000, price: 7999, popular: false, savings: 20 },
  { credits: 25000, price: 17999, popular: false, savings: 28 },
];

export function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | 'custom'>(5000);
  const [customAmount, setCustomAmount] = useState<number>(1000);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { isProcessing, payForCredits } = useRazorpay({
    isBusinessPayment: true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.adCreditBalance() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.adCreditHistory() });
      onClose();
    },
  });

  const getSelectedCredits = () => {
    if (selectedPackage === 'custom') return customAmount;
    return selectedPackage;
  };

  const getSelectedPrice = () => {
    if (selectedPackage === 'custom') return customAmount;
    const pkg = creditPackages.find(p => p.credits === selectedPackage);
    return pkg?.price || 0;
  };

  const handlePurchase = async () => {
    await payForCredits(getSelectedCredits(), getSelectedPrice(), {
      name: user?.name,
      email: user?.email,
      contact: undefined,
    });
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 100;
    setCustomAmount(Math.max(100, Math.min(100000, value)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-primary" />
            Purchase Ad Credits
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Credit Packages */}
          <div className="grid grid-cols-2 gap-2">
            {creditPackages.map((pkg) => {
              const isSelected = selectedPackage === pkg.credits;
              return (
                <div
                  key={pkg.credits}
                  onClick={() => setSelectedPackage(pkg.credits)}
                  className={cn(
                    'relative rounded-lg border p-3 cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0 h-4">
                      <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                      Best
                    </Badge>
                  )}
                  {pkg.savings > 0 && !pkg.popular && (
                    <Badge variant="secondary" className="absolute -top-2 right-1 text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success">
                      -{pkg.savings}%
                    </Badge>
                  )}
                  <div className="text-center pt-1">
                    <p className="text-xl font-bold">{formatNumber(pkg.credits)}</p>
                    <p className="text-[10px] text-muted-foreground">credits</p>
                    <p className="text-sm font-semibold text-primary mt-1">{formatCurrency(pkg.price)}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="absolute top-1.5 right-1.5 h-4 w-4 text-primary" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Amount */}
          <div
            onClick={() => setSelectedPackage('custom')}
            className={cn(
              'rounded-lg border p-3 cursor-pointer transition-all',
              selectedPackage === 'custom'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/40'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                  selectedPackage === 'custom' ? 'border-primary' : 'border-muted-foreground'
                )}>
                  {selectedPackage === 'custom' && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm font-medium">Custom Amount</span>
              </div>
              {selectedPackage === 'custom' ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={100}
                    max={100000}
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 h-8 text-right text-sm"
                  />
                  <span className="text-xs text-muted-foreground w-16">{formatCurrency(customAmount)}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">100 - 100K credits</span>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">You'll receive</p>
                <p className="text-lg font-bold">{formatNumber(getSelectedCredits())} credits</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(getSelectedPrice())}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-3 border-t bg-muted/30">
          <Button
            onClick={handlePurchase}
            disabled={isProcessing || getSelectedCredits() < 100}
            className="w-full h-10"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {formatCurrency(getSelectedPrice())}
              </>
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Secured by Razorpay · Cards, UPI, Net Banking
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
