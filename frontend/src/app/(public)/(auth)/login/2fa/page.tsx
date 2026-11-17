'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackAuth } from '@/lib/analytics/umami';
import { TwoFactorForm } from '@/components/forms/auth/two-factor-form';
import { AuthCard } from '@/components/auth-sketch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getSafeReturnUrl } from '@/lib/utils/navigation';

export default function TwoFactorPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const returnUrl = getSafeReturnUrl(params.get('returnUrl'));

  useEffect(() => {
    trackAuth.signIn('2fa-pending')
  }, [])

  return (
    <AuthCard
      title="Two-factor verification"
      description="Enter the 6-digit code from your authenticator app."
      footer={
        <Link
          href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      }
    >
      {token ? (
        <TwoFactorForm tempToken={token} returnUrl={returnUrl} />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Missing verification token. Please try logging in again.
          </AlertDescription>
        </Alert>
      )}
    </AuthCard>
  );
}
