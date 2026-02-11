import { apiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  LoginRequest,
  LoginResponse,
  TwoFactorRequest,
  RegisterRequest,
  RegisterResponse,
  RefreshRequest,
  LogoutRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  PasswordResponse,
  VerifyEmailRequest,
  ResendVerificationRequest,
  EmailVerificationResponse,
  EmailVerificationStatus,
} from '../types/auth.types'

export const authService = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload)
    return data
  },

  verifyTwoFactor: async (payload: TwoFactorRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.TWO_FACTOR, payload)
    return data
  },

  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload)
    return data
  },

  refresh: async (payload: RefreshRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, payload)
    return data
  },

  logout: async (payload?: LogoutRequest): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, payload || {})
    return data
  },

  requestPasswordReset: async (
    payload: PasswordResetRequest,
  ): Promise<PasswordResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload)
    return data
  },

  resetPassword: async (
    payload: PasswordResetConfirmRequest,
  ): Promise<PasswordResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload)
    return data
  },

  verifyEmail: async (
    payload: VerifyEmailRequest,
  ): Promise<EmailVerificationResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, payload)
    return data
  },

  resendVerification: async (
    payload: ResendVerificationRequest,
  ): Promise<EmailVerificationResponse> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, payload)
    return data
  },

  getEmailStatus: async (): Promise<EmailVerificationStatus> => {
    const { data } = await apiClient.get(API_ENDPOINTS.AUTH.EMAIL_STATUS)
    return data
  },
}
