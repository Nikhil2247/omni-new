'use client';

import { RoleGuard } from '@/components/auth';
import { ROLE_GROUPS } from '@/config/roles';

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.SYSTEM} redirectOnFail={true}>
      {children}
    </RoleGuard>
  );
}
