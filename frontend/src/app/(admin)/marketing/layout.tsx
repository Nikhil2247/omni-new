'use client';

import { RoleGuard } from '@/components/auth';
import { ROLE_GROUPS } from '@/config/roles';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.MARKETING} redirectOnFail={true}>
      {children}
    </RoleGuard>
  );
}
