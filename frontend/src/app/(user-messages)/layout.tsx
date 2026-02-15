'use client';

import { AuthGuard, RoleGuard } from '@/components/auth';
import { ROLES } from '@/config/roles';
import { PublicLayout } from '@/components/layouts/public';

export default function UserMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.USER]} redirectOnFail={true}>
        <PublicLayout>{children}</PublicLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
