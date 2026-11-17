'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/components/forms/auth/register-form';
import { AuthCard } from '@/components/auth-sketch';
import { getSafeReturnUrl } from '@/lib/utils/navigation';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'));

  return (
    <AuthCard
      title="Create account"
      description="Start planning extraordinary events with Omnicassion."
      footer={
        <div className="space-y-2">
          <p>
            Already have an account?{' '}
            <Link
              href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
            >
              Sign in
            </Link>
          </p>
          <p>
            Are you a vendor?{' '}
            <Link
              href={returnUrl ? `/register/vendor?returnUrl=${encodeURIComponent(returnUrl)}` : '/register/vendor'}
            >
              Create a vendor account
            </Link>
          </p>
        </div>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
