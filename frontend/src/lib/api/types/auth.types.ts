export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  sessionId?: string
}

export interface AuthUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  roles: string[]
  emailVerified: boolean
  twoFactorEnabled: boolean
  hasCompletedOnboarding: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TwoFactorRequest {
  tempToken: string
  code: string
}

export interface GoogleLoginRequest {
  idToken: string
  accountType?: 'USER' | 'VENDOR'
}

export interface LoginResponse {
  success: boolean
  requiresTwoFactor: boolean
  tokens?: AuthTokens
  user?: AuthUser
  tempToken?: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  accountType?: 'USER' | 'VENDOR'
}

export interface RegisterResponse {
  success: boolean
  message: string
  userId: string
  email: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  sessionId?: string
  allDevices?: boolean
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}

export interface PasswordResponse {
  success: boolean
  message: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface EmailVerificationResponse {
  success: boolean
  message: string
  email?: string
}

export interface EmailVerificationStatus {
  emailVerified: boolean
  emailVerifiedAt: string | null
  canResend: boolean
}
