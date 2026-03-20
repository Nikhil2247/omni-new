'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Clock, CreditCard, Info } from 'lucide-react';
import { useRequestRefund, useBusinessRequestRefund } from '@/hooks/queries/use-refund';
import { PaymentRecord } from '@/lib/api/types/payment.types';
import { REFUND_REASONS } from '@/lib/api/types/refund.types';
import { toast } from 'sonner';

// Format currency helper
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
  isBusinessPayment?: boolean;
  onSuccess?: () => void;
}

export function RefundRequestModal({
  isOpen,
  onClose,
  payment,
  isBusinessPayment = false,
  onSuccess,
}: RefundRequestModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const requestRefund = useRequestRefund();
  const businessRequestRefund = useBusinessRequestRefund();

  const mutation = isBusinessPayment ? businessRequestRefund : requestRefund;

  // Reset form when modal opens/closes or payment changes
  useEffect(() => {
    if (isOpen && payment) {
      setRefundType('full');
      setPartialAmount('');
      setSelectedReason('');
      setCustomReason('');
    }
  }, [isOpen, payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payment) return;

    const reason = selectedReason === 'other'
      ? customReason
      : REFUND_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    const amount = refundType === 'partial'
      ? parseFloat(partialAmount)
      : undefined;

    if (refundType === 'partial') {
      if (!amount || isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid refund amount');
        return;
      }
      if (amount > payment.amount) {
        toast.error('Refund amount cannot exceed the original payment amount');
        return;
      }
    }

    try {
      await mutation.mutateAsync({
        paymentId: payment.id,
        amount,
        reason,
      });

      toast.success('Refund request submitted', {
        description: 'We will review your request and get back to you within 5-7 business days.',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error('Failed to submit refund request', {
        description: error?.message || 'Please try again later.',
      });
    }
  };

  const refundAmount = refundType === 'full'
    ? (payment?.amount || 0)
    : parseFloat(partialAmount) || 0;

  const isValidAmount = refundType === 'full' || (
    refundAmount > 0 && refundAmount <= (payment?.amount || 0)
  );

  const canSubmit = payment &&
    selectedReason &&
    (selectedReason !== 'other' || customReason.trim()) &&
    isValidAmount;

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Request Refund
          </DialogTitle>
          <DialogDescription>
            Submit a refund request for your payment. Our team will review and process it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Original Payment</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
              </div>
              <Badge variant="secondary">
                {payment.status}
              </Badge>
            </div>
            {payment.gatewayPaymentId && (
              <p className="text-xs text-muted-foreground mt-2">
                Payment ID: {payment.gatewayPaymentId}
              </p>
            )}
          </div>

          {/* Refund Type */}
          <div className="space-y-3">
            <Label>Refund Type</Label>
            <RadioGroup
              value={refundType}
              onValueChange={(value) => setRefundType(value as 'full' | 'partial')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer font-normal">
                  Full Refund ({formatCurrency(payment.amount, payment.currency)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="cursor-pointer font-normal">
                  Partial Refund
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Partial Amount Input */}
          {refundType === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="amount">Refund Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {payment.currency === 'INR' ? '₹' : '$'}
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={payment.amount}
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="pl-8"
                />
              </div>
              {partialAmount && parseFloat(partialAmount) > payment.amount && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Amount cannot exceed {formatCurrency(payment.amount, payment.currency)}
                </p>
              )}
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Textarea */}
          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please explain your reason</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide details about why you're requesting a refund..."
                rows={3}
              />
            </div>
          )}

          {/* Processing Time Info */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Estimated Processing Time:</strong> 5-7 business days after approval.
              Refunds are credited to the original payment method.
            </AlertDescription>
          </Alert>

          {/* Refund Summary */}
          {isValidAmount && refundAmount > 0 && (
            <div className="rounded-lg border p-4 bg-primary/5">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary" />
                <span>
                  You are requesting a refund of{' '}
                  <strong>{formatCurrency(refundAmount, payment.currency)}</strong>
                  {refundType === 'partial' && (
                    <> ({Math.round((refundAmount / payment.amount) * 100)}% of original payment)</>
                  )}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
