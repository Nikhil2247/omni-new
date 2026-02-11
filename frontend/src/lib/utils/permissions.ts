// Permission utilities for role-based access control

import { Role, ROLES, ROLE_GROUPS, ROLE_HIERARCHY, ROLE_DEFAULT_PATHS } from '@/config/roles';

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  if (userRole === requiredRole) return true;

  // Check hierarchy - if user's role inherits the required role
  return hasInheritedRole(userRole, requiredRole);
}

/**
 * Check if a role inherits another role through hierarchy
 */
function hasInheritedRole(userRole: Role, targetRole: Role, visited = new Set<Role>()): boolean {
  if (visited.has(userRole)) return false;
  visited.add(userRole);

  const inheritedRoles = ROLE_HIERARCHY[userRole] || [];

  for (const inheritedRole of inheritedRoles) {
    if (inheritedRole === targetRole) return true;
    if (hasInheritedRole(inheritedRole, targetRole, visited)) return true;
  }

  return false;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRole: Role | undefined, requiredRoles: Role[]): boolean {
  if (!userRole) return false;
  return requiredRoles.some(role => hasRole(userRole, role));
}

/**
 * Check if a user has all of the specified roles (through hierarchy)
 */
export function hasAllRoles(userRole: Role | undefined, requiredRoles: Role[]): boolean {
  if (!userRole) return false;
  return requiredRoles.every(role => hasRole(userRole, role));
}

/**
 * Check if user is a staff member (internal team)
 */
export function isStaff(userRole: Role | undefined): boolean {
  return hasAnyRole(userRole, ROLE_GROUPS.STAFF);
}

/**
 * Check if user is in operations team
 */
export function isOpsTeam(userRole: Role | undefined): boolean {
  return hasAnyRole(userRole, ROLE_GROUPS.OPS);
}

/**
 * Check if user is in marketing team
 */
export function isMarketingTeam(userRole: Role | undefined): boolean {
  return hasAnyRole(userRole, ROLE_GROUPS.MARKETING);
}

/**
 * Check if user is in sales team
 */
export function isSalesTeam(userRole: Role | undefined): boolean {
  return hasAnyRole(userRole, ROLE_GROUPS.SALES);
}

/**
 * Check if user is a system admin
 */
export function isSystemAdmin(userRole: Role | undefined): boolean {
  return userRole === ROLES.ADMIN_SYSTEM;
}

/**
 * Check if user is a platform admin (non-system)
 */
export function isPlatformAdmin(userRole: Role | undefined): boolean {
  return userRole === ROLES.ADMIN;
}

/**
 * Check if user is a vendor (business admin)
 */
export function isVendor(userRole: Role | undefined): boolean {
  return userRole === ROLES.BUSINESS_ADMIN;
}

/**
 * Check if user is an end user (planner/couple)
 */
export function isEndUser(userRole: Role | undefined): boolean {
  return userRole === ROLES.USER;
}

/**
 * Get the default redirect path for a role
 */
export function getDefaultPath(userRole: Role | undefined): string {
  if (!userRole) return '/login';
  return ROLE_DEFAULT_PATHS[userRole] || '/dashboard';
}

/**
 * Get the settings path for a role
 */
export function getSettingsPath(userRole: Role | undefined): string {
  if (!userRole) return '/settings';
  
  switch (userRole) {
    case ROLES.ADMIN_SYSTEM:
    case ROLES.ADMIN:
      return '/admin/settings';
    case ROLES.OPERATIONAL_ADMIN:
    case ROLES.OPERATIONAL_MANAGER:
    case ROLES.OPERATIONAL_ASSISTANT:
      return '/ops/settings';
    case ROLES.MARKETING_SERVICES_ADMIN:
    case ROLES.CONTENT_WRITER:
    case ROLES.MULTI_MEDIA_MANAGER:
      return '/marketing/settings';
    case ROLES.SALES_MANAGER:
      return '/sales/settings';
    case ROLES.BUSINESS_ADMIN:
      return '/business/settings';
    case ROLES.USER:
    default:
      return '/settings';
  }
}

/**
 * Get all permissions/roles a user has access to (including inherited)
 */
export function getAllUserRoles(userRole: Role | undefined): Role[] {
  if (!userRole) return [];

  const roles = new Set<Role>([userRole]);

  function collectInheritedRoles(role: Role) {
    const inherited = ROLE_HIERARCHY[role] || [];
    for (const inheritedRole of inherited) {
      if (!roles.has(inheritedRole)) {
        roles.add(inheritedRole);
        collectInheritedRoles(inheritedRole);
      }
    }
  }

  collectInheritedRoles(userRole);
  return Array.from(roles);
}

/**
 * Permission definitions for specific actions
 */
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: [ROLES.ADMIN_SYSTEM, ROLES.ADMIN, ROLES.OPERATIONAL_ADMIN],
  VIEW_USERS: [ROLES.ADMIN_SYSTEM, ROLES.ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.OPERATIONAL_MANAGER],

  // Vendor management
  MANAGE_VENDORS: [ROLES.ADMIN_SYSTEM, ROLES.OPERATIONAL_ADMIN, ROLES.OPERATIONAL_MANAGER],
  APPROVE_VENDORS: [ROLES.ADMIN_SYSTEM, ROLES.OPERATIONAL_ADMIN],
  VIEW_VENDORS: ROLE_GROUPS.STAFF,

  // Service management
  MANAGE_SERVICES: [ROLES.ADMIN_SYSTEM, ROLES.OPERATIONAL_ADMIN],
  VIEW_SERVICES: [...ROLE_GROUPS.STAFF, ROLES.BUSINESS_ADMIN],

  // Booking management
  MANAGE_BOOKINGS: [ROLES.ADMIN_SYSTEM, ROLES.OPERATIONAL_ADMIN, ROLES.OPERATIONAL_MANAGER],
  VIEW_ALL_BOOKINGS: ROLE_GROUPS.OPS,
  VIEW_OWN_BOOKINGS: [ROLES.BUSINESS_ADMIN, ROLES.USER],

  // Content management
  MANAGE_CONTENT: [ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.CONTENT_WRITER],
  PUBLISH_CONTENT: [ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN],
  VIEW_CONTENT: ROLE_GROUPS.MARKETING,

  // Media management
  MANAGE_MEDIA: [ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER],
  VIEW_MEDIA: [...ROLE_GROUPS.MARKETING, ROLES.BUSINESS_ADMIN],

  // Sales & Leads
  MANAGE_LEADS: [ROLES.ADMIN_SYSTEM, ROLES.SALES_MANAGER],
  VIEW_LEADS: ROLE_GROUPS.SALES,

  // Reports & Analytics
  VIEW_ALL_REPORTS: [ROLES.ADMIN_SYSTEM],
  VIEW_OPS_REPORTS: ROLE_GROUPS.OPS,
  VIEW_MARKETING_REPORTS: ROLE_GROUPS.MARKETING,
  VIEW_SALES_REPORTS: ROLE_GROUPS.SALES,
  VIEW_OWN_REPORTS: [ROLES.BUSINESS_ADMIN],

  // System settings
  MANAGE_SYSTEM: [ROLES.ADMIN_SYSTEM],
  VIEW_AUDIT_LOGS: [ROLES.ADMIN_SYSTEM, ROLES.ADMIN, ROLES.OPERATIONAL_ADMIN],

  // Financial
  MANAGE_PAYMENTS: [ROLES.ADMIN_SYSTEM, ROLES.OPERATIONAL_ADMIN],
  VIEW_PAYMENTS: [...ROLE_GROUPS.OPS, ROLES.BUSINESS_ADMIN],
  PROCESS_REFUNDS: [ROLES.ADMIN_SYSTEM, ROLES.OPERATIONAL_ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: Role | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  const allowedRoles = PERMISSIONS[permission];
  return hasAnyRole(userRole, allowedRoles as Role[]);
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userRole: Role | undefined, pathname: string): boolean {
  if (!userRole) return false;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return true;
  }

  // System admin routes
  if (pathname.startsWith('/system')) {
    return isSystemAdmin(userRole);
  }

  // Admin dashboard routes
  if (pathname.startsWith('/admin')) {
    return isSystemAdmin(userRole) || isPlatformAdmin(userRole);
  }

  // Operations routes
  if (pathname.startsWith('/ops')) {
    return isOpsTeam(userRole);
  }

  // Marketing routes
  if (pathname.startsWith('/marketing')) {
    return isMarketingTeam(userRole);
  }

  // Sales routes
  if (pathname.startsWith('/sales')) {
    return isSalesTeam(userRole);
  }

  // Business/Vendor routes
  if (pathname.startsWith('/business')) {
    return isVendor(userRole) || isStaff(userRole);
  }

  // User dashboard routes
  if (pathname.startsWith('/dashboard')) {
    return true; // All authenticated users
  }

  return false;
}
