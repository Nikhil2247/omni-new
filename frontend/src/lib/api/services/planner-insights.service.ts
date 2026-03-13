import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface PlannerInsightRisk {
  id: string
  title: string
  detail: string
  level: 'high' | 'medium' | 'low'
}

export interface PlannerInsights {
  eventId: string
  healthScore: number
  healthLabel: 'Excellent' | 'Strong' | 'At Risk' | 'Critical'
  topActions: string[]
  risks: PlannerInsightRisk[]
  metrics: {
    checklistCompletion: number
    budgetCompletion: number
    budgetUsage: number
    timelineItemsCount: number
    rsvpRate: number
    overdueTasks: number
  }
}

export const plannerInsightsService = {
  async getByEvent(eventId: string): Promise<PlannerInsights | null> {
    const response = await apiClient.get<PlannerInsights>(API_ENDPOINTS.USER.PLANNER_INSIGHTS, {
      params: { eventId },
    })
    const payload: any = response.data
    const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
    return data || null
  },
}
