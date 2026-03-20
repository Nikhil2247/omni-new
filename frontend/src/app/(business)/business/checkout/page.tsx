'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Redirect business checkout to unified checkout
export default function BusinessCheckoutRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get('plan');
    const billing = searchParams.get('billing') || 'MONTHLY';
    router.replace(`/checkout?plan=${plan}&billing=${billing}&type=vendor`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
}
