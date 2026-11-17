'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { trackDashboard } from '@/lib/analytics/umami';
import { RegisterForm } from '@/components/forms/auth/register-form';
import { AuthCard } from '@/components/auth-sketch';
import { getSafeReturnUrl } from '@/lib/utils/navigation';
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
      <AuthCard
        title="Create vendor account"
        description="Join as a vendor to showcase your services and receive qualified leads."
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
              Not a vendor?{' '}
              <Link
                href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
              >
                Create a planner account
              </Link>
            </p>
          </div>
        }
      >
        <RegisterForm accountType="VENDOR" />
      </AuthCard>
    </FeatureFlagGate>
  );
}
