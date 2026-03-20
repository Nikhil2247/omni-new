'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  Smartphone,
  Building2,
  Star,
  Trash2,
  Loader2,
  Plus,
  Wallet,
} from 'lucide-react';
import {
  PaymentMethod,
  getCardBrandDisplayName,
  formatCardExpiry,
  maskUpiId,
} from '@/lib/api/types/payment-method.types';

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
  onAddNew: () => void;
  isSettingDefault: boolean;
  isRemoving: boolean;
  removingId?: string;
  settingDefaultId?: string;
}

// Card brand icons/colors mapping
const cardBrandStyles: Record<string, { bg: string; text: string }> = {
  visa: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  mastercard: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  rupay: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  amex: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
  discover: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
};

function getCardStyles(brand?: string) {
  const normalizedBrand = brand?.toLowerCase() || '';
  return cardBrandStyles[normalizedBrand] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300'
  };
}

function PaymentMethodIcon({ type, cardBrand }: { type: PaymentMethod['type']; cardBrand?: string }) {
  switch (type) {
    case 'CARD':
      return <CreditCard className="h-5 w-5" />;
    case 'UPI':
      return <Smartphone className="h-5 w-5" />;
    case 'BANK_ACCOUNT':
      return <Building2 className="h-5 w-5" />;
    default:
      return <Wallet className="h-5 w-5" />;
  }
}

function PaymentMethodItem({
  method,
  onSetDefault,
  onRemove,
  isSettingDefault,
  isRemoving,
  settingDefaultId,
  removingId,
}: {
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
  isSettingDefault: boolean;
  isRemoving: boolean;
  settingDefaultId?: string;
  removingId?: string;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isCurrentlySettingDefault = isSettingDefault && settingDefaultId === method.id;
  const isCurrentlyRemoving = isRemoving && removingId === method.id;

  const handleRemoveClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmRemove = () => {
    onRemove(method.id);
    setShowDeleteDialog(false);
  };

  const getMethodDetails = () => {
    switch (method.type) {
      case 'CARD':
        return {
          title: `${getCardBrandDisplayName(method.cardBrand)} ****${method.cardLast4}`,
          subtitle: `Expires ${formatCardExpiry(method.cardExpMonth, method.cardExpYear)}`,
          styles: getCardStyles(method.cardBrand),
        };
      case 'UPI':
        return {
          title: 'UPI',
          subtitle: maskUpiId(method.upiId),
          styles: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
        };
      case 'BANK_ACCOUNT':
        return {
          title: method.bankName || 'Bank Account',
          subtitle: method.bankLast4 ? `****${method.bankLast4}` : 'Account linked',
          styles: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
        };
      default:
        return {
          title: 'Payment Method',
          subtitle: '',
          styles: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
        };
    }
  };

  const details = getMethodDetails();

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${details.styles.bg} ${details.styles.text}`}>
            <PaymentMethodIcon type={method.type} cardBrand={method.cardBrand} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{details.title}</span>
              {method.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{details.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!method.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetDefault(method.id)}
              disabled={isSettingDefault || isRemoving}
            >
              {isCurrentlySettingDefault ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Set as Default'
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveClick}
            disabled={isSettingDefault || isRemoving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {isCurrentlyRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
              {method.isDefault && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  This is your default payment method. You may need to set a new default after removing it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PaymentMethodListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PaymentMethodList({
  paymentMethods,
  isLoading,
  error,
  onSetDefault,
  onRemove,
  onAddNew,
  isSettingDefault,
  isRemoving,
  removingId,
  settingDefaultId,
}: PaymentMethodListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodListSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load payment methods</p>
            <p className="text-sm">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your saved payment methods</CardDescription>
          </div>
          <Button onClick={onAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!paymentMethods || paymentMethods.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment methods saved</p>
            <p className="text-sm mb-4">Add a payment method for faster checkouts</p>
            <Button onClick={onAddNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <PaymentMethodItem
                key={method.id}
                method={method}
                onSetDefault={onSetDefault}
                onRemove={onRemove}
                isSettingDefault={isSettingDefault}
                isRemoving={isRemoving}
                settingDefaultId={settingDefaultId}
                removingId={removingId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
