'use client';

import { AuthGuard } from '@/components/auth';
import { RoleGuard } from '@/components/auth';
import { ROLES } from '@/config/roles';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.BUSINESS_ADMIN]} redirectOnFail={true}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          {/* Decorative elements */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          </div>
          {children}
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
