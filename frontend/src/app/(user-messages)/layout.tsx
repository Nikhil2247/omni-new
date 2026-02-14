'use client';

import { AuthGuard, RoleGuard } from '@/components/auth';
import { ROLES } from '@/config/roles';
import { PublicHeader } from '@/components/layouts/public';
import { BottomNav } from '@/components/ui/bottom-nav';

export default function UserMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.USER]} redirectOnFail={true}>
        <div className="min-h-screen bg-background">
          <PublicHeader />
          <main className="pt-16 pb-20 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
