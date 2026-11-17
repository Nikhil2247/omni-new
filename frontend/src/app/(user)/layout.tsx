'use client';

import { AuthGuard, RoleGuard, OnboardingGuard } from '@/components/auth';
import { PublicLayout } from '@/components/layouts/public';
import { ROLES } from '@/config/roles';
import { SkContainer } from '@/components/sketch';

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
            {/* Same page width as the public pages */}
            <SkContainer className="py-4 sm:py-6">{children}</SkContainer>
          </PublicLayout>
        </OnboardingGuard>
      </RoleGuard>
    </AuthGuard>
  );
}
