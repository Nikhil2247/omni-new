'use client';

import { AuthGuard } from '@/components/auth';
import { RoleGuard } from '@/components/auth';
import { DashboardLayout } from '@/components/layouts/dashboard';
import { ROLE_GROUPS } from '@/config/roles';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // All staff roles can access the admin section
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={ROLE_GROUPS.STAFF} redirectOnFail={true}>
        <DashboardLayout>{children}</DashboardLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
