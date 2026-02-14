'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/api/services/auth.service'
import type { LoginRequest, RegisterRequest, PasswordResetRequest, PasswordResetConfirmRequest, VerifyEmailRequest, TwoFactorRequest } from '@/lib/api/types/auth.types'
import { useAuthStore } from '@/store/auth-store'
import { getDefaultPath } from '@/lib/utils/permissions'
import { getSafeReturnUrl } from '@/lib/utils/navigation'
import type { Role } from '@/config/roles'

function mapUser(user: { id: string; email: string; firstName: string | null; lastName: string | null; role?: string; roles: string[]; emailVerified: boolean; twoFactorEnabled: boolean; hasCompletedOnboarding: boolean }) {
  const primaryRole = user.role || user.roles?.[0] || 'USER'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    role: primaryRole,
    name,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
  }
}

export function useLogin(returnUrl?: string | null) {
  const router = useRouter()
  const { setCredentials, setLoading } = useAuthStore()

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        setLoading(false)
        return
      }
      if (!data.tokens || !data.user) {
        setLoading(false)
        return
      }
      const mappedUser = mapUser(data.user)
      setCredentials(data.tokens.accessToken, data.tokens.refreshToken, mappedUser)
      const safeReturnUrl = getSafeReturnUrl(returnUrl)
      router.push(safeReturnUrl ?? getDefaultPath(mappedUser.role as Role))
    },
    onError: () => setLoading(false),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
  })
}

export function useLogout() {
  const router = useRouter()
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout()
      router.push('/login')
    },
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: PasswordResetRequest) => authService.requestPasswordReset(payload),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: PasswordResetConfirmRequest) => authService.resetPassword(payload),
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) => authService.verifyEmail(payload),
  })
}

export function useVerifyTwoFactor(returnUrl?: string | null) {
  const router = useRouter()
  const { setCredentials, setLoading } = useAuthStore()

  return useMutation({
    mutationFn: (payload: TwoFactorRequest) => authService.verifyTwoFactor(payload),
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      if (!data.tokens || !data.user) {
        setLoading(false)
        return
      }
      const mappedUser = mapUser(data.user)
      setCredentials(data.tokens.accessToken, data.tokens.refreshToken, mappedUser)
      const safeReturnUrl = getSafeReturnUrl(returnUrl)
      router.push(safeReturnUrl ?? getDefaultPath(mappedUser.role as Role))
    },
    onError: () => setLoading(false),
  })
}
