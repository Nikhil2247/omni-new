import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PaginatedResponse } from '../types/common.types'
import type {
  AdminAuditLog,
  AdminAuditParams,
  AdminCategory,
  AdminCategoryInput,
  AdminCity,
  AdminCityInput,
  AdminCityListParams,
  AdminCountry,
  AdminCountryInput,
  AdminDashboard,
  AdminRole,
  AdminState,
  AdminStateInput,
  AdminUser,
  AdminUserListParams,
  AdminVendor,
  AdminVendorListParams,
  AdminVendorStats,
  FeatureFlag,
  SystemConfigState,
  SystemHealthState,
} from '../types/admin.types'

/**
 * Lists arrive as `[...]`, `{ data: [...] }` or `{ success, data: [...] }` depending on the endpoint.
 * Always give pages a real array so `.map` / `.filter` can never throw.
 */
function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const inner = (payload as { data?: unknown } | null | undefined)?.data
  if (Array.isArray(inner)) return inner as T[]
  const nested = (inner as { data?: unknown; items?: unknown } | null | undefined)
  if (Array.isArray(nested?.data)) return nested.data as T[]
  if (Array.isArray(nested?.items)) return nested.items as T[]
  return []
}

export const adminService = {
  listUsers: async (params: AdminUserListParams = {}): Promise<PaginatedResponse<AdminUser>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.USERS, { params })
    return data
  },
  getUser: async (id: string): Promise<AdminUser> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.USER_BY_ID(id))
    // Backend wraps single entities in { success, data, meta }
    return data?.data ?? data
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
    // The API wraps responses as { success, data: [...] }. The page needs the array itself; returning the
    // wrapper made `sessions.map is not a function` crash the user detail page.
    return unwrapList<Record<string, unknown>>(data)
  },
  deleteUser: async (id: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.USER_BY_ID(id))
    return data
  },

  // ── Vendors ──
  listVendors: async (params: AdminVendorListParams = {}): Promise<PaginatedResponse<AdminVendor>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.VENDORS, { params })
    return data
  },
  getVendorStats: async (): Promise<AdminVendorStats> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.VENDORS_STATS)
    return data?.data ?? data
  },
  updateVendorStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.VENDOR_STATUS(id), { status })
    return data?.data ?? data
  },
  deleteVendor: async (id: string, permanent = false) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.VENDOR_BY_ID(id), {
      params: permanent ? { permanent: 'true' } : undefined,
    })
    return data?.data ?? data
  },

  // ── Categories ──
  listCategories: async (): Promise<AdminCategory[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.CATEGORIES)
    return unwrapList<AdminCategory>(data)
  },
  createCategory: async (payload: AdminCategoryInput) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.CATEGORIES, payload)
    return data?.data ?? data
  },
  updateCategory: async (id: string, payload: Partial<AdminCategoryInput>) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.CATEGORY_BY_ID(id), payload)
    return data?.data ?? data
  },
  deleteCategory: async (id: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.CATEGORY_BY_ID(id))
    return data?.data ?? data
  },

  // ── Locations ──
  listCountries: async (): Promise<AdminCountry[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.LOCATIONS.COUNTRIES)
    return unwrapList<AdminCountry>(data)
  },
  createCountry: async (payload: AdminCountryInput) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.LOCATIONS.COUNTRIES, payload)
    return data?.data ?? data
  },
  updateCountry: async (id: string, payload: Partial<AdminCountryInput>) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.LOCATIONS.COUNTRY(id), payload)
    return data?.data ?? data
  },
  deleteCountry: async (id: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.LOCATIONS.COUNTRY(id))
    return data?.data ?? data
  },
  listStates: async (countryId?: string): Promise<AdminState[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.LOCATIONS.STATES, {
      params: countryId ? { countryId } : undefined,
    })
    return unwrapList<AdminState>(data)
  },
  createState: async (payload: AdminStateInput) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.LOCATIONS.STATES, payload)
    return data?.data ?? data
  },
  updateState: async (id: string, payload: Partial<AdminStateInput>) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.LOCATIONS.STATE(id), payload)
    return data?.data ?? data
  },
  deleteState: async (id: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.LOCATIONS.STATE(id))
    return data?.data ?? data
  },
  listCities: async (params: AdminCityListParams = {}): Promise<PaginatedResponse<AdminCity>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.LOCATIONS.CITIES, { params })
    return data
  },
  createCity: async (payload: AdminCityInput) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.LOCATIONS.CITIES, payload)
    return data?.data ?? data
  },
  updateCity: async (id: string, payload: Partial<AdminCityInput>) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.ADMIN.LOCATIONS.CITY(id), payload)
    return data?.data ?? data
  },
  deleteCity: async (id: string) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.ADMIN.LOCATIONS.CITY(id))
    return data?.data ?? data
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
    return unwrapList<AdminRole>(data)
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
    return data?.data ?? data ?? []
  },
  createFeatureFlag: async (payload: { key: string; name: string; description?: string; category?: string; enabled?: boolean; isSystem?: boolean }) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ADMIN.FEATURE_FLAGS, payload)
    return data?.data ?? data
  },
  updateFeatureFlag: async (id: string, payload: { name?: string; description?: string; category?: string; enabled?: boolean }) => {
    const { data } = await apiClient.patch(`${API_ENDPOINTS.ADMIN.FEATURE_FLAGS}/${id}`, payload)
    return data?.data ?? data
  },
  bulkUpdateFeatureFlags: async (ids: string[], enabled: boolean) => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.ADMIN.FEATURE_FLAGS}/bulk-update`, { ids, enabled })
    return data?.data ?? data
  },
  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.DASHBOARD)
    return data?.data ?? data
  },
}
