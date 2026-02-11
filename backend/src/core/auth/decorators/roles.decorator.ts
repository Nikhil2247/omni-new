// ============================================================================
// ROLES DECORATOR - Define Required Roles for Routes
// ============================================================================
// Decorator to specify which roles can access a route
// ============================================================================

import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

// Main roles decorator
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

// Pre-defined role decorators for convenience
export const AdminOnly = () => Roles('ADMIN_SYSTEM', 'ADMIN')
export const SystemAdminOnly = () => Roles('ADMIN_SYSTEM')

export const OpsAccess = () =>
  Roles('ADMIN_SYSTEM', 'OPERATIONAL_ADMIN', 'OPERATIONAL_MANAGER', 'OPERATIONAL_ASSISTANT')

export const OpsAdminOnly = () => Roles('ADMIN_SYSTEM', 'OPERATIONAL_ADMIN')

export const OpsAdminAccess = () => Roles('ADMIN_SYSTEM', 'OPERATIONAL_ADMIN')

export const OpsManagerAccess = () =>
  Roles('ADMIN_SYSTEM', 'OPERATIONAL_ADMIN', 'OPERATIONAL_MANAGER')

export const MarketingAccess = () =>
  Roles('ADMIN_SYSTEM', 'MARKETING_SERVICES_ADMIN', 'CONTENT_WRITER', 'MULTI_MEDIA_MANAGER')

export const SalesAccess = () => Roles('ADMIN_SYSTEM', 'SALES_MANAGER', 'OPERATIONAL_MANAGER')

export const VendorAccess = () => Roles('ADMIN_SYSTEM', 'OPERATIONAL_ADMIN', 'BUSINESS_ADMIN')

export const UserAccess = () =>
  Roles('ADMIN_SYSTEM', 'USER', 'BUSINESS_ADMIN')
