// ============================================================================
// PUBLIC RSVP SERVICE - API Services
// ============================================================================

import { apiClient } from '../client'

export interface RsvpDetailsResponse {
  guest: {
    id: string
    firstName: string
    lastName?: string | null
    rsvpStatus: 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'
    plusOne: number
    dietaryReq?: string | null
    rsvpAt?: string | null
  }
  event: {
    id: string
    name: string
    date: string
    venueName?: string | null
    address?: any
  }
  timeline: Array<{
    title: string
    description?: string | null
    scheduledTime?: string
    duration?: number | null
  }>
  dietaryOptions: string[]
}

export interface RsvpSubmitInput {
  rsvpStatus: 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'
  plusOne?: number
  dietaryReq?: string
  message?: string
}

export interface RsvpSubmitResponse {
  success: boolean
  message: string
  guest: {
    firstName: string
    rsvpStatus: string
  }
}

export const publicRsvpService = {
  /**
   * Get RSVP details by token (public endpoint)
   */
  async getDetails(token: string): Promise<RsvpDetailsResponse> {
    const response = await apiClient.get<any>(`/public/rsvp/${token}`)
    return response.data?.data || response.data
  },

  /**
   * Submit RSVP response (public endpoint)
   */
  async submit(token: string, data: RsvpSubmitInput): Promise<RsvpSubmitResponse> {
    const response = await apiClient.post<any>(`/public/rsvp/${token}`, data)
    return response.data?.data || response.data
  },
}
