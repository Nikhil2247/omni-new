'use client';

import { AuthGuard, RoleGuard, OnboardingGuard } from '@/components/auth';
import { PublicLayout } from '@/components/layouts/public';
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
          <PublicLayout>
            <main className="p-4 sm:p-4 lg:p-4">
              <div className="mx-auto w-full max-w-8xl">{children}</div>
            </main>
          </PublicLayout>
        </OnboardingGuard>
      </RoleGuard>
    </AuthGuard>
  );
}
