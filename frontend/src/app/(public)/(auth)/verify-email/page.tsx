'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VerifyEmailForm } from '@/components/forms/auth/verify-email-form';
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
import { ArrowLeft, AlertCircle, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  return (
    <Card className="w-full border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary ring-1 ring-primary/20">
            <MailCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-serif">Verify your email</CardTitle>
            <CardDescription className="text-base">
              Confirm your email address to activate your account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter className="flex-col space-y-4">
        <Separator className="bg-border/60" />
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
