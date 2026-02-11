'use client'

import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.ADMIN_SYSTEM]} redirectOnFail={true}>
      {children}
    </RoleGuard>
  )
}