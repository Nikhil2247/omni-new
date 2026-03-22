import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminService } from '@/lib/api/services/admin.service'
import { featureKeys } from '@/hooks/use-feature'
import type { AdminAuditParams, AdminUserListParams, SystemConfigState } from '@/lib/api/types/admin.types'

const adminKeys = {
  users: (params: AdminUserListParams) => ['admin-users', params] as const,
  user: (id: string) => ['admin-user', id] as const,
  roles: () => ['admin-roles'] as const,
  audit: (params: AdminAuditParams) => ['admin-audit', params] as const,
  systemConfig: () => ['admin-system-config'] as const,
  systemHealth: () => ['admin-system-health'] as const,
  featureFlags: () => ['admin-feature-flags'] as const,
  dashboard: () => ['admin-dashboard'] as const,
  sessions: (id: string) => ['admin-user-sessions', id] as const,
}

export function useAdminUsers(params: AdminUserListParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.listUsers(params),
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminService.getUser(id),
    enabled: Boolean(id),
  })
}

export function useAdminRoles() {
  return useQuery({
    queryKey: adminKeys.roles(),
    queryFn: () => adminService.listRoles(),
  })
}

export function useAdminAudit(params: AdminAuditParams) {
  return useQuery({
    queryKey: adminKeys.audit(params),
    queryFn: () => adminService.listAuditLogs(params),
  })
}

export function useSystemConfig() {
  return useQuery({
    queryKey: adminKeys.systemConfig(),
    queryFn: () => adminService.getSystemConfig(),
  })
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<SystemConfigState>) => adminService.updateSystemConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.systemConfig() })
      toast.success('System config updated')
    },
    onError: () => toast.error('Failed to update system config'),
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: () => adminService.getSystemHealth(),
  })
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: adminKeys.featureFlags(),
    queryFn: () => adminService.listFeatureFlags(),
  })
}

export function useCreateFeatureFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { key: string; description?: string; enabled?: boolean }) =>
      adminService.createFeatureFlag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.featureFlags() })
      toast.success('Feature flag created')
    },
    onError: () => toast.error('Failed to create feature flag'),
  })
}

export function useUpdateFeatureFlag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { id: string; description?: string; enabled?: boolean }) =>
      adminService.updateFeatureFlag(payload.id, {
        description: payload.description,
        enabled: payload.enabled,
      }),
    onSuccess: () => {
      // Invalidate admin feature flags list
      queryClient.invalidateQueries({ queryKey: adminKeys.featureFlags() })
      // Also invalidate public feature flags cache so changes take effect immediately
      queryClient.invalidateQueries({ queryKey: featureKeys.enabled() })
      queryClient.invalidateQueries({ queryKey: featureKeys.all() })
      toast.success('Feature flag updated')
    },
    onError: () => toast.error('Failed to update feature flag'),
  })
}

export function useBulkUpdateFeatureFlags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { ids: string[]; enabled: boolean }) =>
      adminService.bulkUpdateFeatureFlags(payload.ids, payload.enabled),
    onSuccess: (_, variables) => {
      // Invalidate admin feature flags list
      queryClient.invalidateQueries({ queryKey: adminKeys.featureFlags() })
      // Also invalidate public feature flags cache so changes take effect immediately
      queryClient.invalidateQueries({ queryKey: featureKeys.enabled() })
      queryClient.invalidateQueries({ queryKey: featureKeys.all() })
      toast.success(`${variables.ids.length} feature flags ${variables.enabled ? 'enabled' : 'disabled'}`)
    },
    onError: () => toast.error('Failed to update feature flags'),
  })
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => adminService.getAdminDashboard(),
  })
}

export function useUpdateUserStatus(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => adminService.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User status updated')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update user status'
      toast.error(msg)
    },
  })
}

export function useAssignUserRole(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => adminService.assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to assign role'
      toast.error(msg)
    },
  })
}

export function useRemoveUserRole(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => adminService.removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to remove role'
      toast.error(msg)
    },
  })
}

export function useUserSessions(userId: string) {
  return useQuery({
    queryKey: adminKeys.sessions(userId),
    queryFn: () => adminService.listUserSessions(userId),
    enabled: Boolean(userId),
  })
}

export function useRevokeSession(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => adminService.revokeUserSession(userId, sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.sessions(userId) }),
  })
}

export function useRevokeAllSessions(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => adminService.revokeAllSessions(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.sessions(userId) }),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; displayName: string; description?: string; level?: number }) =>
      adminService.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() })
      toast.success('Role created')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create role'
      toast.error(msg)
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.roles() })
      toast.success('Role deleted')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to delete role'
      toast.error(msg)
    },
  })
}
