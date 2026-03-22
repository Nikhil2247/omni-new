'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { trackDashboard } from '@/lib/analytics/umami';
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
import { Store } from 'lucide-react';
import { FeatureFlagGate, FeatureDisabledMessage } from '@/components/common';

export default function VendorRegisterPage() {
  const searchParams = useSearchParams();
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'));

  useEffect(() => {
    trackDashboard.sectionView('vendor-register', 'vendor')
  }, [])

  return (
    <FeatureFlagGate
      feature="vendor.onboarding"
      fallback={
        <FeatureDisabledMessage
          feature="Vendor Registration"
          description="Vendor registration is currently closed. Please check back later."
        />
      }
    >
      <Card className="w-full border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary ring-1 ring-primary/20">
              <Store className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-serif">Create vendor account</CardTitle>
              <CardDescription className="text-base">
                Join as a vendor to showcase your services and receive qualified leads.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RegisterForm accountType="VENDOR" />
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
              Not a vendor?{' '}
              <Link
                href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
                className="transition-colors hover:text-foreground hover:underline"
              >
                Create a planner account
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </FeatureFlagGate>
  );
}
