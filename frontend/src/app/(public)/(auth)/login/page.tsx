'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/forms/auth/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { getDefaultPath } from '@/lib/utils/permissions';
import { getSafeReturnUrl } from '@/lib/utils/navigation';
import type { Role } from '@/config/roles';
import { LogIn } from 'lucide-react';

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
    <Card className="w-full border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary ring-1 ring-primary/20">
            <LogIn className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-serif">Sign in</CardTitle>
            <CardDescription className="text-base">
              Access your dashboard and manage every detail with ease.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <LoginForm returnUrl={returnUrl} />
      </CardContent>
      <CardFooter className="flex-col space-y-4">
        <Separator className="bg-border/60" />
        <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="transition-colors hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
          <Link
            href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
            className="transition-colors hover:text-foreground hover:underline"
          >
            Create account
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
