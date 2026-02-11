'use client';

import { AuthGuard } from '@/components/auth';
import { RoleGuard } from '@/components/auth';
import { DashboardLayout } from '@/components/layouts/dashboard';
import { ROLES } from '@/config/roles';

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.BUSINESS_ADMIN]} redirectOnFail={true}>
        <DashboardLayout>{children}</DashboardLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
