'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/forms/auth/login-form';
import { AuthCard } from '@/components/auth-sketch';
import { useAuthStore } from '@/store/auth-store';
import { getDefaultPath } from '@/lib/utils/permissions';
import { getSafeReturnUrl } from '@/lib/utils/navigation';
import type { Role } from '@/config/roles';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, hasHydrated, user } = useAuthStore();
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'));

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(returnUrl ?? getDefaultPath(user?.role as Role | undefined));
    }
  }, [hasHydrated, isAuthenticated, router, returnUrl, user?.role]);

  if (hasHydrated && isAuthenticated) {
    return null;
  }

  return (
    <AuthCard
      title="Sign in"
      description="Access your dashboard and manage every detail with ease."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link
            href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
          >
            Create account
          </Link>
        </div>
      }
    >
      <LoginForm returnUrl={returnUrl} />
    </AuthCard>
  );
}
