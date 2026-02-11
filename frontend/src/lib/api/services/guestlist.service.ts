import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  CreateGuestInput,
  CreateGuestlistInput,
  Guest,
  Guestlist,
  UpdateGuestInput,
  UpdateRsvpInput,
} from '../types/guestlist.types'

export const guestlistService = {
  async getByEvent(eventId: string) {
    try {
      const response = await apiClient.get<Guestlist>(
        API_ENDPOINTS.USER.GUESTLIST,
        { params: { eventId } },
      )
      const payload: any = response.data
      return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  async createGuestlist(input: CreateGuestlistInput) {
    const response = await apiClient.post<Guestlist>(
      API_ENDPOINTS.USER.GUESTLIST,
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async addGuest(guestlistId: string, input: CreateGuestInput) {
    const response = await apiClient.post<Guest>(
      API_ENDPOINTS.USER.GUESTLIST_GUESTS(guestlistId),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async updateGuest(guestId: string, input: UpdateGuestInput) {
    const response = await apiClient.put<Guest>(
      API_ENDPOINTS.USER.GUEST_BY_ID(guestId),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async updateRsvp(guestId: string, input: UpdateRsvpInput) {
    const response = await apiClient.put<Guest>(
      API_ENDPOINTS.USER.GUEST_RSVP(guestId),
      input,
    )
    const payload: any = response.data
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
  },

  async deleteGuest(guestId: string) {
    await apiClient.delete(API_ENDPOINTS.USER.GUEST_BY_ID(guestId))
  },
}
