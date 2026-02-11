import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface UserProfileResponse {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone?: string | null
  role?: string
  roles?: string[]
  emailVerified?: boolean
  twoFactorEnabled?: boolean
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface NotificationPreferences {
  email: {
    events: boolean
    leads: boolean
    tasks: boolean
    updates: boolean
    marketing: boolean
  }
  push: {
    events: boolean
    leads: boolean
    tasks: boolean
    updates: boolean
  }
  sms: {
    events: boolean
    leads: boolean
    tasks: boolean
  }
}

export interface Enable2FAResponse {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface Verify2FAPayload {
  code: string
}

export const userService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.ACCOUNT.PROFILE)
    return data
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfileResponse> => {
    const { data } = await apiClient.patch(API_ENDPOINTS.USER.ACCOUNT.PROFILE, payload)
    return data
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USER.ACCOUNT.PASSWORD, payload)
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USER.ACCOUNT.NOTIFICATIONS)
    return data
  },

  updateNotificationPreferences: async (
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> => {
    const { data } = await apiClient.patch(
      API_ENDPOINTS.USER.ACCOUNT.NOTIFICATIONS,
      preferences
    )
    return data
  },

  enable2FA: async (): Promise<Enable2FAResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.USER.ACCOUNT.TWO_FACTOR_ENABLE)
    return data
  },

  verify2FA: async (payload: Verify2FAPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USER.ACCOUNT.TWO_FACTOR_VERIFY, payload)
  },

  disable2FA: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USER.ACCOUNT.TWO_FACTOR_DISABLE)
  },
}

