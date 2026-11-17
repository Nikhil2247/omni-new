'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import Link from 'next/link';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-semibold">Payment Failed</h1>
            <p className="text-muted-foreground">
              {error || "We couldn't process your payment. Please try again."}
            </p>
          </div>

          {orderId && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Reference ID</p>
              <p className="font-mono text-sm break-all">{orderId}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <Button className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Link>

            <Link href="/support" className="block">
              <Button variant="outline" className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            If money was deducted from your account, it will be refunded within 5-7 business days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
