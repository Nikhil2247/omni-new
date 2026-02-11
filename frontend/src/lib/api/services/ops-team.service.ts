import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface OpsTeamMember {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  status: string
  createdAt: string
  managedEventsCount?: number
  assignedTasksCount?: number
}

export interface OpsTeamResponse {
  data: OpsTeamMember[]
  meta: {
    total: number
  }
}

export interface OpsTeamOverview {
  data: {
    managers: number
    assistants: number
    activeEvents: number
    pendingTasks: number
  }
}

/**
 * Ops Team Service
 * For OPERATIONAL_ADMIN to view team members
 */
export const opsTeamService = {
  /**
   * Get all operational managers
   */
  getManagers: async (): Promise<OpsTeamResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.TEAM.MANAGERS)
    return data
  },

  /**
   * Get all operational assistants
   */
  getAssistants: async (): Promise<OpsTeamResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.TEAM.ASSISTANTS)
    return data
  },

  /**
   * Get team overview statistics
   */
  getOverview: async (): Promise<OpsTeamOverview> => {
    const { data } = await apiClient.get(API_ENDPOINTS.OPS.TEAM.OVERVIEW)
    return data
  },
}
