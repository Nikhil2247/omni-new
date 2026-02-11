import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type {
  AdminAuditLog,
  AdminAuditParams,
  AdminDashboard,
  AdminRole,
  AdminUser,
  AdminUserListParams,
  FeatureFlag,
  SystemConfigState,
  SystemHealthState,
} from '../types/admin.types'

export const adminService = {
  listUsers: async (params: AdminUserListParams = {}): Promise<PaginatedResponse<AdminUser>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.USERS, { params })
    return data
  },
  getUser: async (id: string): Promise<AdminUser> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.USER_BY_ID(id))
    return data
  },
  updateUserStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.USER_STATUS(id), { status })
    return data
  },
  assignRole: async (id: string, roleId: string) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.USER_ROLES(id), { roleId })
    return data
  },
  removeRole: async (id: string, roleId: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.USER_ROLE(id, roleId))
    return data
  },
  listUserSessions: async (id: string) => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.USER_SESSIONS(id))
    return data
  },
  revokeUserSession: async (id: string, sessionId: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.USER_SESSION(id, sessionId))
    return data
  },
  revokeAllSessions: async (id: string) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.USER_SESSIONS_REVOKE_ALL(id))
    return data
  },
  listRoles: async (): Promise<AdminRole[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.ROLES)
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as { data: AdminRole[] }).data
    }
    return data
  },
  createRole: async (payload: Partial<AdminRole>) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.ROLES, payload)
    return data
  },
  updateRole: async (id: string, payload: Partial<AdminRole>) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.ROLE_BY_ID(id), payload)
    return data
  },
  deleteRole: async (id: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.ROLE_BY_ID(id))
    return data
  },
  listAuditLogs: async (params: AdminAuditParams = {}): Promise<PaginatedResponse<AdminAuditLog>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.AUDIT, { params })
    return data
  },
  getAuditLog: async (id: string): Promise<AdminAuditLog> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.AUDIT_BY_ID(id))
    return data
  },
  getSystemConfig: async (): Promise<SystemConfigState> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.SYSTEM_CONFIG)
    return data?.data || data
  },
  updateSystemConfig: async (payload: Partial<SystemConfigState>): Promise<SystemConfigState> => {
    const { data } = await apiClient.put(API_ENDPOINTS.ADMIN.SYSTEM_CONFIG, payload)
    return data?.data || data
  },
  getSystemHealth: async (): Promise<SystemHealthState> => {
    // Call admin system-health endpoint (requires ADMIN_SYSTEM role)
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.SYSTEM_HEALTH)
    return data?.data ?? data
  },
  listFeatureFlags: async (): Promise<FeatureFlag[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.FEATURE_FLAGS)
    return data
  },
  createFeatureFlag: async (payload: { key: string; description?: string; enabled?: boolean }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.FEATURE_FLAGS, payload)
    return data
  },
  updateFeatureFlag: async (id: string, payload: { description?: string; enabled?: boolean }) => {
    const { data } = await apiClient.patch(`${API_ENDPOINTS.ADMIN.FEATURE_FLAGS}/${id}`, payload)
    return data
  },
  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.DASHBOARD)
    return data?.data ?? data
  },
}
