'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/forms/auth/reset-password-form';
import { AuthCard } from '@/components/auth-sketch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  return (
    <AuthCard
      title="Choose a new password"
      description="Enter your new password to complete the reset."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Missing reset token. Please request a new password reset link.
          </AlertDescription>
        </Alert>
      )}
    </AuthCard>
  );
}
