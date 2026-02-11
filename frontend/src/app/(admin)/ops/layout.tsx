'use client';

import { RoleGuard } from '@/components/auth';
import { ROLE_GROUPS } from '@/config/roles';

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.OPS} redirectOnFail={true}>
      {children}
    </RoleGuard>
  );
}
