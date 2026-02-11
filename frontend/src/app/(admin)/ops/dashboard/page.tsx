'use client';

import { useAuthStore } from '@/store/auth-store';
import { ROLES, Role } from '@/config/roles';
import { OpsAdminDashboard } from './components/ops-admin-dashboard';
import { OpsManagerDashboard } from './components/ops-manager-dashboard';
import { OpsAssistantDashboard } from './components/ops-assistant-dashboard';

/**
 * Operations Dashboard Page
 *
 * Renders role-specific dashboard based on user's role:
 * - OPERATIONAL_ADMIN: Control Tower - Full operational oversight
 * - OPERATIONAL_MANAGER: Event Execution - Manage assigned events, add assistants
 * - OPERATIONAL_ASSISTANT: Field Work - Task execution, proof uploads
 */
export default function OpsDashboardPage() {
  const { user } = useAuthStore();
  const userRole = user?.role as Role;

  // Render role-specific dashboard
  switch (userRole) {
    case ROLES.OPERATIONAL_ADMIN:
      return <OpsAdminDashboard />;
    case ROLES.OPERATIONAL_MANAGER:
      return <OpsManagerDashboard />;
    case ROLES.OPERATIONAL_ASSISTANT:
      return <OpsAssistantDashboard />;
    default:
      // Fallback for ADMIN_SYSTEM or other roles that can access ops
      return <OpsAdminDashboard />;
  }
}
