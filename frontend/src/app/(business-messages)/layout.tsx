'use client';

import { AuthGuard } from '@/components/auth';
import { RoleGuard } from '@/components/auth';
import { ROLES } from '@/config/roles';
import { PublicLayout } from '@/components/layouts/public';

export default function BusinessMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.BUSINESS_ADMIN]} redirectOnFail={true}>
        <PublicLayout>{children}</PublicLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
