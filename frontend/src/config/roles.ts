// Role definitions matching backend DEVELOPMENT_PLAN.md

export const ROLES = {
  // System Admin - Full access
  ADMIN_SYSTEM: 'ADMIN_SYSTEM',
  // Platform Admin - Limited system access
  ADMIN: 'ADMIN',

  // Operations Team
  OPERATIONAL_ADMIN: 'OPERATIONAL_ADMIN',
  OPERATIONAL_MANAGER: 'OPERATIONAL_MANAGER',
  OPERATIONAL_ASSISTANT: 'OPERATIONAL_ASSISTANT',

  // Marketing Team
  MARKETING_SERVICES_ADMIN: 'MARKETING_SERVICES_ADMIN',
  CONTENT_WRITER: 'CONTENT_WRITER',
  MULTI_MEDIA_MANAGER: 'MULTI_MEDIA_MANAGER',

  // Sales Team
  SALES_MANAGER: 'SALES_MANAGER',

  // External Users
  BUSINESS_ADMIN: 'BUSINESS_ADMIN', // Vendors
  USER: 'USER', // Planners/Couples
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role groups for access control
export const ROLE_GROUPS = {
  // All staff roles (internal team)
  STAFF: [
    ROLES.ADMIN_SYSTEM,
    ROLES.ADMIN,
    ROLES.OPERATIONAL_ADMIN,
    ROLES.OPERATIONAL_MANAGER,
    ROLES.OPERATIONAL_ASSISTANT,
    ROLES.MARKETING_SERVICES_ADMIN,
    ROLES.CONTENT_WRITER,
    ROLES.MULTI_MEDIA_MANAGER,
    ROLES.SALES_MANAGER,
  ] as Role[],

  // Operations team (includes ADMIN for full access)
  OPS: [
    ROLES.ADMIN_SYSTEM,
    ROLES.ADMIN,
    ROLES.OPERATIONAL_ADMIN,
    ROLES.OPERATIONAL_MANAGER,
    ROLES.OPERATIONAL_ASSISTANT,
  ] as Role[],

  // Marketing team
  MARKETING: [
    ROLES.ADMIN_SYSTEM,
    ROLES.MARKETING_SERVICES_ADMIN,
    ROLES.CONTENT_WRITER,
    ROLES.MULTI_MEDIA_MANAGER,
  ] as Role[],

  // Sales team
  SALES: [
    ROLES.ADMIN_SYSTEM,
    ROLES.SALES_MANAGER,
    ROLES.OPERATIONAL_MANAGER, // Can also access sales
  ] as Role[],

  // System admin only
  SYSTEM: [ROLES.ADMIN_SYSTEM] as Role[],

  // Vendors
  VENDOR: [ROLES.BUSINESS_ADMIN] as Role[],

  // End users (planners)
  PLANNER: [ROLES.USER, ROLES.BUSINESS_ADMIN] as Role[],
};

// Role hierarchy - higher roles inherit lower role permissions
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [ROLES.ADMIN_SYSTEM]: [
    ROLES.ADMIN,
    ROLES.OPERATIONAL_ADMIN,
    ROLES.MARKETING_SERVICES_ADMIN,
    ROLES.SALES_MANAGER,
  ],
  [ROLES.ADMIN]: [],
  [ROLES.OPERATIONAL_ADMIN]: [ROLES.OPERATIONAL_MANAGER],
  [ROLES.OPERATIONAL_MANAGER]: [ROLES.OPERATIONAL_ASSISTANT],
  [ROLES.OPERATIONAL_ASSISTANT]: [],
  [ROLES.MARKETING_SERVICES_ADMIN]: [ROLES.CONTENT_WRITER, ROLES.MULTI_MEDIA_MANAGER],
  [ROLES.CONTENT_WRITER]: [],
  [ROLES.MULTI_MEDIA_MANAGER]: [],
  [ROLES.SALES_MANAGER]: [],
  [ROLES.BUSINESS_ADMIN]: [],
  [ROLES.USER]: [],
};

// Role display names
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN_SYSTEM]: 'System Administrator',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.OPERATIONAL_ADMIN]: 'Operations Admin',
  [ROLES.OPERATIONAL_MANAGER]: 'Operations Manager',
  [ROLES.OPERATIONAL_ASSISTANT]: 'Operations Assistant',
  [ROLES.MARKETING_SERVICES_ADMIN]: 'Marketing Admin',
  [ROLES.CONTENT_WRITER]: 'Content Writer',
  [ROLES.MULTI_MEDIA_MANAGER]: 'Media Manager',
  [ROLES.SALES_MANAGER]: 'Sales Manager',
  [ROLES.BUSINESS_ADMIN]: 'Vendor',
  [ROLES.USER]: 'User',
};

// Default redirect paths per role after login
export const ROLE_DEFAULT_PATHS: Record<Role, string> = {
  [ROLES.ADMIN_SYSTEM]: '/system/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.OPERATIONAL_ADMIN]: '/ops/dashboard',
  [ROLES.OPERATIONAL_MANAGER]: '/ops/dashboard',
  [ROLES.OPERATIONAL_ASSISTANT]: '/ops/tasks',
  [ROLES.MARKETING_SERVICES_ADMIN]: '/marketing/dashboard',
  [ROLES.CONTENT_WRITER]: '/marketing/content-writer/dashboard',
  [ROLES.MULTI_MEDIA_MANAGER]: '/marketing/media',
  [ROLES.SALES_MANAGER]: '/sales/dashboard',
  [ROLES.BUSINESS_ADMIN]: '/business/dashboard',
  [ROLES.USER]: '/discover',
};
