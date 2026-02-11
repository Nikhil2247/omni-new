import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/lib/api/services/admin.service'
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.systemConfig() }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.featureFlags() }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.featureFlags() }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) }),
  })
}

export function useAssignUserRole(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => adminService.assignRole(userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) }),
  })
}

export function useRemoveUserRole(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roleId: string) => adminService.removeRole(userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.roles() }),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.roles() }),
  })
}
