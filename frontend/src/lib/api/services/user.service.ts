import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

const unwrapResponse = <T>(payload: any): T => payload?.data ?? payload

export interface UserProfileResponse {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone?: string | null
  avatarUrl?: string | null
  role?: string
  roles?: string[]
  emailVerified?: boolean
  twoFactorEnabled?: boolean
  hasPassword?: boolean
  authProvider?: 'local' | 'google'
  createdAt?: string
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

export interface SetPasswordPayload {
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

export interface UserAddressOption {
  id: string
  label: string
}

export const userService = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.USER.ACCOUNT.PROFILE)
    return unwrapResponse<UserProfileResponse>(response.data)
  },

  getAddresses: async (): Promise<UserAddressOption[]> => {
    const response = await apiClient.get(API_ENDPOINTS.USER.ACCOUNT.ADDRESSES)
    return unwrapResponse<UserAddressOption[]>(response.data)
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfileResponse> => {
    const response = await apiClient.patch(API_ENDPOINTS.USER.ACCOUNT.PROFILE, payload)
    return unwrapResponse<UserProfileResponse>(response.data)
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USER.ACCOUNT.PASSWORD, payload)
  },

  setPassword: async (payload: SetPasswordPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.USER.ACCOUNT.SET_PASSWORD, payload)
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

