'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/components/forms/auth/register-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSafeReturnUrl } from '@/lib/utils/navigation';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'));

  return (
    <Card className="w-full border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary ring-1 ring-primary/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-serif">Create account</CardTitle>
            <CardDescription className="text-base">
              Start planning extraordinary events with Omnicassion.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="flex-col space-y-4">
        <Separator className="bg-border/60" />
        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link
              href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
              className="transition-colors hover:text-foreground hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p>
            Are you a vendor?{' '}
            <Link
              href={returnUrl ? `/register/vendor?returnUrl=${encodeURIComponent(returnUrl)}` : '/register/vendor'}
              className="transition-colors hover:text-foreground hover:underline"
            >
              Create a vendor account
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
