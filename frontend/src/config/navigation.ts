// Navigation configuration for all roles

import { Role, ROLES, ROLE_GROUPS } from './roles';
import {
  LayoutDashboard,
  Users,
  Store,
  Calendar,
  FileText,
  Image,
  TrendingUp,
  Settings,
  Bell,
  MessageSquare,
  CreditCard,
  BarChart3,
  Shield,
  Briefcase,
  Heart,
  Search,
  ClipboardList,
  UserCheck,
  Package,
  DollarSign,
  PieChart,
  Megaphone,
  Headphones,
  FileCheck,
  AlertTriangle,
  Receipt,
  UserPlus,
  CheckSquare,
  FolderKanban,
  CalendarDays,
  Handshake,
  Upload,
  type LucideIcon,
  Activity,
  Star,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: string;
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

// Admin Navigation (non-system)
export const adminNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.ADMIN, ROLES.ADMIN_SYSTEM],
      },
      {
        title: 'Insights',
        href: '/admin/insights',
        icon: BarChart3,
        roles: [ROLES.ADMIN, ROLES.ADMIN_SYSTEM],
      },
    ],
  },
  {
    title: 'Governance',
    items: [
      {
        title: 'Audit Logs',
        href: '/admin/audit',
        icon: ClipboardList,
        roles: [ROLES.ADMIN, ROLES.ADMIN_SYSTEM],
      },
      {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
        roles: [ROLES.ADMIN, ROLES.ADMIN_SYSTEM],
      },
      {
        title: 'Roles',
        href: '/admin/roles',
        icon: Shield,
        roles: [ROLES.ADMIN, ROLES.ADMIN_SYSTEM],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        roles: [ROLES.ADMIN, ROLES.ADMIN_SYSTEM],
      },
    ],
  },
];

// System Admin Navigation
export const systemAdminNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/system/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.ADMIN_SYSTEM],
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Users',
        href: '/system/users',
        icon: Users,
        roles: [ROLES.ADMIN_SYSTEM],
      },
      {
        title: 'Roles & Permissions',
        href: '/system/roles',
        icon: Shield,
        roles: [ROLES.ADMIN_SYSTEM],
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Features',
        href: '/system/features',
        icon: Settings,
        roles: [ROLES.ADMIN_SYSTEM],
      },
      {
        title: 'Configuration',
        href: '/system/config',
        icon: Settings,
        roles: [ROLES.ADMIN_SYSTEM],
      },
      {
        title: 'Audit Logs',
        href: '/system/audit',
        icon: ClipboardList,
        roles: [ROLES.ADMIN_SYSTEM],
      },
      {
        title: 'Health',
        href: '/system/health',
        icon: Activity,
        roles: [ROLES.ADMIN_SYSTEM],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        roles: [ROLES.ADMIN_SYSTEM],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATIONS TEAM NAVIGATION - Role-Specific
// ═══════════════════════════════════════════════════════════════════════════════

// OPERATIONAL_ADMIN Navigation (Control Tower)
export const opsAdminNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/ops/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
    ],
  },
  {
    title: 'Event Management',
    items: [
      {
        title: 'Active Events',
        href: '/ops/events',
        icon: Calendar,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
      {
        title: 'Leads',
        href: '/ops/leads',
        icon: Users,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
      {
        title: 'Requirements',
        href: '/ops/requirements',
        icon: ClipboardList,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
      {
        title: 'Agreements',
        href: '/ops/agreements',
        icon: Handshake,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
    ],
  },
  {
    title: 'Team',
    items: [
      {
        title: 'Managers',
        href: '/ops/team/managers',
        icon: Users,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
      {
        title: 'Assistants',
        href: '/ops/team/assistants',
        icon: UserCheck,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        title: 'Invoice Center',
        href: '/ops/invoices',
        icon: Receipt,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/ops/settings',
        icon: Settings,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
    ],
  },
];

// OPERATIONAL_MANAGER Navigation (Event Execution)
export const opsManagerNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/ops/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
    ],
  },
  {
    title: 'My Events',
    items: [
      {
        title: 'Assigned Events',
        href: '/ops/events',
        icon: Calendar,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
      {
        title: 'Requirement Sheets',
        href: '/ops/requirements',
        icon: ClipboardList,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
      {
        title: 'Vendor Agreements',
        href: '/ops/agreements',
        icon: Handshake,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
    ],
  },
  {
    title: 'Task Management',
    items: [
      {
        title: 'Tasks',
        href: '/ops/tasks',
        icon: CheckSquare,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
    ],
  },
  {
    title: 'Vendors',
    items: [
      {
        title: 'Vendor Search',
        href: '/ops/vendors/search',
        icon: Search,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
      {
        title: 'KYC Review',
        href: '/ops/kyc',
        icon: FileCheck,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        title: 'Event Reports',
        href: '/ops/reports/events',
        icon: PieChart,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
      {
        title: 'Cost vs Budget',
        href: '/ops/reports/budget',
        icon: DollarSign,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/ops/settings',
        icon: Settings,
        roles: [ROLES.OPERATIONAL_MANAGER],
      },
    ],
  },
];

// OPERATIONAL_ASSISTANT Navigation (Field Work)
export const opsAssistantNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/ops/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
    ],
  },
  {
    title: 'My Work',
    items: [
      {
        title: 'My Tasks',
        href: '/ops/tasks',
        icon: CheckSquare,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
      {
        title: 'Upload Proofs',
        href: '/ops/tasks/upload',
        icon: Upload,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
    ],
  },
  {
    title: 'Processing',
    items: [
      {
        title: 'KYC Documents',
        href: '/ops/kyc',
        icon: FileCheck,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
      {
        title: 'Content Moderation',
        href: '/ops/moderation',
        icon: Shield,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        title: 'Support Tickets',
        href: '/ops/support',
        icon: Headphones,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
      {
        title: 'Disputes',
        href: '/ops/disputes',
        icon: AlertTriangle,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/ops/settings',
        icon: Settings,
        roles: [ROLES.OPERATIONAL_ASSISTANT],
      },
    ],
  },
];

// Legacy combined OPS navigation (kept for backwards compatibility)
export const opsNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/ops/dashboard',
        icon: LayoutDashboard,
        roles: ROLE_GROUPS.OPS,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Active Events',
        href: '/ops/events',
        icon: Calendar,
        roles: [ROLES.OPERATIONAL_ADMIN, ROLES.OPERATIONAL_MANAGER],
      },
      {
        title: 'Leads',
        href: '/ops/leads',
        icon: Users,
        roles: [ROLES.OPERATIONAL_ADMIN],
      },
      {
        title: 'Tasks',
        href: '/ops/tasks',
        icon: CheckSquare,
        roles: ROLE_GROUPS.OPS,
      },
      {
        title: 'Vendors',
        href: '/ops/vendors',
        icon: Store,
        roles: [ROLES.OPERATIONAL_ADMIN, ROLES.OPERATIONAL_MANAGER],
      },
      {
        title: 'KYC Queue',
        href: '/ops/kyc',
        icon: FileCheck,
        roles: ROLE_GROUPS.OPS,
      },
      {
        title: 'Disputes',
        href: '/ops/disputes',
        icon: AlertTriangle,
        roles: [ROLES.OPERATIONAL_ADMIN, ROLES.OPERATIONAL_MANAGER, ROLES.OPERATIONAL_ASSISTANT],
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        title: 'Tickets',
        href: '/ops/support',
        icon: Headphones,
        roles: ROLE_GROUPS.OPS,
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        title: 'Operations Reports',
        href: '/ops/reports',
        icon: PieChart,
        roles: [ROLES.OPERATIONAL_ADMIN, ROLES.OPERATIONAL_MANAGER],
      },
    ],
  },
];

// Marketing Team Navigation
export const marketingNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/marketing/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN],
      },
      {
        title: 'Dashboard',
        href: '/marketing/content-writer/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.CONTENT_WRITER],
      },
      {
        title: 'Dashboard',
        href: '/marketing/media',
        icon: LayoutDashboard,
        roles: [ROLES.MULTI_MEDIA_MANAGER],
      },
    ],
  },
  {
    title: 'Content',
    items: [
      {
        title: 'Content Manager',
        href: '/marketing/content',
        icon: FileText,
        roles: ROLE_GROUPS.MARKETING,
      },
      {
        title: 'Create Post',
        href: '/marketing/content/new',
        icon: FileText,
        roles: ROLE_GROUPS.MARKETING,
      },
      {
        title: 'Media Library',
        href: '/marketing/media',
        icon: Image,
        roles: [ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER],
      },
    ],
  },
  {
    title: 'Campaigns',
    items: [
      {
        title: 'Campaigns',
        href: '/marketing/campaigns',
        icon: Megaphone,
        roles: [ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN],
      },
      {
        title: 'Analytics',
        href: '/marketing/analytics',
        icon: TrendingUp,
        roles: [ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/marketing/settings',
        icon: Settings,
        roles: ROLE_GROUPS.MARKETING,
      },
    ],
  },
];

// Sales Team Navigation
export const salesNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/sales/dashboard',
        icon: LayoutDashboard,
        roles: ROLE_GROUPS.SALES,
      },
    ],
  },
  {
    title: 'Sales',
    items: [
      {
        title: 'Leads',
        href: '/sales/leads',
        icon: Users,
        roles: ROLE_GROUPS.SALES,
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        title: 'Sales Reports',
        href: '/sales/reports',
        icon: PieChart,
        roles: ROLE_GROUPS.SALES,
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/sales/settings',
        icon: Settings,
        roles: ROLE_GROUPS.SALES,
      },
    ],
  },
];

// Business/Vendor Navigation
export const businessNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/business/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.BUSINESS_ADMIN],
      },
    ],
  },
  {
    title: 'My Business',
    items: [
      {
        title: 'Profile',
        href: '/business/profile',
        icon: Store,
        roles: [ROLES.BUSINESS_ADMIN],
      },
      {
        title: 'Services',
        href: '/business/services',
        icon: Package,
        roles: [ROLES.BUSINESS_ADMIN],
      },
      {
        title: 'Portfolio',
        href: '/business/portfolio',
        icon: Image,
        roles: [ROLES.BUSINESS_ADMIN],
      },
    ],
  },
  {
    title: 'Agreements & Tasks',
    items: [
      {
        title: 'Vendor Agreements',
        href: '/business/agreements',
        icon: Handshake,
        roles: [ROLES.BUSINESS_ADMIN],
      },
      {
        title: 'Assigned Tasks',
        href: '/business/tasks',
        icon: CheckSquare,
        roles: [ROLES.BUSINESS_ADMIN],
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        title: 'Leads',
        href: '/business/leads',
        icon: Users,
        roles: [ROLES.BUSINESS_ADMIN],
      },
      {
        title: 'Reviews',
        href: '/business/reviews',
        icon: Heart,
        roles: [ROLES.BUSINESS_ADMIN],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/business/settings',
        icon: Settings,
        roles: [ROLES.BUSINESS_ADMIN],
      },
    ],
  },
];

// User/Planner Navigation
export const userNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: [ROLES.USER],
      },
    ],
  },
  {
    title: 'Planning',
    items: [
      {
        title: 'Events',
        href: '/events',
        icon: Calendar,
        roles: [ROLES.USER],
      },
      {
        title: 'Checklist',
        href: '/checklist',
        icon: CheckSquare,
        roles: [ROLES.USER],
      },
      {
        title: 'Budget',
        href: '/budget',
        icon: DollarSign,
        roles: [ROLES.USER],
      },
      {
        title: 'Guestlist',
        href: '/guestlist',
        icon: Users,
        roles: [ROLES.USER],
      },
      {
        title: 'Timeline',
        href: '/timeline',
        icon: CalendarDays,
        roles: [ROLES.USER],
      },
    ],
  },
  {
    title: 'Vendors & Planning',
    items: [
      {
        title: 'Wishlists',
        href: '/wishlists',
        icon: Heart,
        roles: [ROLES.USER],
      },
      {
        title: 'Inquiries',
        href: '/inquiries',
        icon: MessageSquare,
        roles: [ROLES.USER],
      },
      {
        title: 'Reviews',
        href: '/reviews',
        icon: Star,
        roles: [ROLES.USER],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: [ROLES.USER],
      },
    ],
  },
];

/**
 * Get navigation for a specific role
 */
export function getNavigationForRole(role: Role): NavGroup[] {
  switch (role) {
    case ROLES.ADMIN_SYSTEM:
      return systemAdminNav;
    case ROLES.ADMIN:
      return adminNav;
    // OPS roles get role-specific navigation
    case ROLES.OPERATIONAL_ADMIN:
      return opsAdminNav;
    case ROLES.OPERATIONAL_MANAGER:
      return opsManagerNav;
    case ROLES.OPERATIONAL_ASSISTANT:
      return opsAssistantNav;
    // Other roles
    case ROLES.MARKETING_SERVICES_ADMIN:
    case ROLES.CONTENT_WRITER:
    case ROLES.MULTI_MEDIA_MANAGER:
      return marketingNav;
    case ROLES.SALES_MANAGER:
      return salesNav;
    case ROLES.BUSINESS_ADMIN:
      return businessNav;
    case ROLES.USER:
    default:
      return userNav;
  }
}

/**
 * Filter navigation items based on user role
 */
export function filterNavByRole(navGroups: NavGroup[], userRole: Role): NavGroup[] {
  return navGroups
    .map(group => ({
      ...group,
      items: group.items
        .filter(item => item.roles.includes(userRole))
        .map(item => ({
          ...item,
          children: item.children?.filter(child => child.roles.includes(userRole)),
        })),
    }))
    .filter(group => group.items.length > 0);
}
