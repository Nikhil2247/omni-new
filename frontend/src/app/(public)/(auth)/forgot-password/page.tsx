'use client';

import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/forms/auth/forgot-password-form';
import { AuthCard } from '@/components/auth-sketch';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
