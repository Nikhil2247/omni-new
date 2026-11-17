'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VerifyEmailForm } from '@/components/forms/auth/verify-email-form';
import { AuthCard } from '@/components/auth-sketch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  return (
    <AuthCard
      title="Verify your email"
      description="Confirm your email address to activate your account."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      }
    >
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Missing verification token. Please check your email for the correct link.
          </AlertDescription>
        </Alert>
      )}
    </AuthCard>
  );
}
