'use client';

import { AuthGuard, RoleGuard, OnboardingGuard } from '@/components/auth';
import { DashboardLayout } from '@/components/layouts/dashboard';
import { ROLES } from '@/config/roles';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.USER]} redirectOnFail={true}>
        <OnboardingGuard>
          <DashboardLayout>{children}</DashboardLayout>
        </OnboardingGuard>
      </RoleGuard>
    </AuthGuard>
  );
}
