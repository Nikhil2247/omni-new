import axios from 'axios'
import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  VibeImage,
  VibeQuizResult,
  SubmitVibeQuizInput,
  WeddingIdentity,
  CreateWeddingIdentityInput,
  UpdateWeddingIdentityInput,
  InvitePartnerInput,
} from '../types/onboarding.types'

export interface OnboardingStatus {
  vibeQuizCompleted: boolean
  weddingIdentityCreated: boolean
  isOnboardingComplete: boolean
}

export const onboardingService = {
  // Vibe Quiz
  getVibeQuizImages: async (): Promise<VibeImage[]> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.ONBOARDING.VIBE_QUIZ.IMAGES)
    return data
  },

  submitVibeQuiz: async (input: SubmitVibeQuizInput): Promise<VibeQuizResult> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.ONBOARDING.VIBE_QUIZ.SUBMIT, input)
    return data
  },

  getVibeQuizStatus: async (): Promise<{ completed: boolean; result?: VibeQuizResult }> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.ONBOARDING.VIBE_QUIZ.STATUS)
    return data
  },

  // Wedding Identity
  getWeddingIdentity: async (): Promise<WeddingIdentity | null> => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.USER.ONBOARDING.WEDDING_IDENTITY.ME)
      if (data && typeof data === 'object' && 'data' in data) {
        return (data as { data: WeddingIdentity | null }).data
      }
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  createWeddingIdentity: async (input: CreateWeddingIdentityInput): Promise<WeddingIdentity> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.ONBOARDING.WEDDING_IDENTITY.CREATE, input)
    return data
  },

  updateWeddingIdentity: async (input: UpdateWeddingIdentityInput): Promise<WeddingIdentity> => {
    const { data } = await apiClient.patch(API_ENDPOINTS.USER.ONBOARDING.WEDDING_IDENTITY.ME, input)
    return data
  },

  invitePartner: async (input: InvitePartnerInput): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.ONBOARDING.WEDDING_IDENTITY.INVITE_PARTNER, input)
    return data
  },

  acceptPartnerInvite: async (token: string): Promise<{ success: boolean; weddingIdentity: WeddingIdentity }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.ONBOARDING.WEDDING_IDENTITY.ACCEPT_INVITE(token))
    return data
  },

  // Onboarding Status
  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.ONBOARDING.STATUS)
    return data
  },
}
