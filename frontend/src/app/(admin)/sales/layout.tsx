'use client';

import { RoleGuard } from '@/components/auth';
import { ROLE_GROUPS } from '@/config/roles';

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.SALES} redirectOnFail={true}>
      {children}
    </RoleGuard>
  );
}
