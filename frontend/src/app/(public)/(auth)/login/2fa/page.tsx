'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TwoFactorForm } from '@/components/forms/auth/two-factor-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertCircle, Shield } from 'lucide-react';
import { getSafeReturnUrl } from '@/lib/utils/navigation';

export default function TwoFactorPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const returnUrl = getSafeReturnUrl(params.get('returnUrl'));

  return (
    <Card className="w-full border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary ring-1 ring-primary/20">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-serif">Two-factor verification</CardTitle>
            <CardDescription className="text-base">
              Enter the 6-digit code from your authenticator app.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter className="flex-col space-y-4">
        <Separator className="bg-border/60" />
        <Link
          href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
